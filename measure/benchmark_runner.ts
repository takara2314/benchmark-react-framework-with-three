import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

const targets = ['astro', 'next', 'vite'];
const iterations = 10;
const results: { [key: string]: string[] } = {};

// サーバーが起動したかどうかを確認する関数
async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`Attempting to connect to ${url} (attempt ${i+1}/${maxAttempts})`);
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          console.log(`Received response from ${url}: ${res.statusCode}`);
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Server returned status code ${res.statusCode}`));
          }
        });
        req.on('error', (err) => {
          console.log(`Connection error to ${url}: ${err.message}`);
          // 接続エラーは無視して再試行
          setTimeout(resolve, 1000);
        });
      });
      return true;
    } catch (error) {
      console.log(`Error connecting to ${url}: ${error}`);
      // エラーは無視して再試行
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// サーバーを起動する関数
async function startServer(target: string): Promise<{ process: any } | null> {
  console.log(`Starting server for ${target}...`);

  return new Promise((resolve) => {
    try {
      // バックグラウンドでサーバーを起動
      const command = `cd ${path.join('targets', target)} && npm run start`;
      console.log(`Executing command: ${command}`);

      const serverProcess = exec(command, {
        env: { ...process.env, PATH: process.env.PATH },
        shell: '/bin/zsh' // macOSのデフォルトシェルを明示的に指定
      }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error starting server for ${target}:`, error);
          resolve(null);
          return;
        }
        console.log(`Server process stdout: ${stdout}`);
        if (stderr) {
          console.error(`Server process stderr: ${stderr}`);
        }
      });

      // サーバーが起動するまで待機
      const checkServer = async () => {
        console.log(`Checking if server for ${target} is running...`);
        try {
          const isReady = await waitForServer("http://localhost:3000");
          console.log(`Server is ready: ${isReady}`);

          if (isReady) {
            console.log(`Server for ${target} is running`);
            resolve({ process: { kill: () => serverProcess.kill() } });
          } else {
            // サーバーがまだ起動していない場合は再試行
            console.log(`Server not ready yet, retrying...`);
            setTimeout(checkServer, 1000);
          }
        } catch (error) {
          console.error(`Error checking server: ${error}`);
          setTimeout(checkServer, 1000);
        }
      };

      // サーバーの起動を確認
      console.log(`Waiting 2 seconds before checking server...`);
      setTimeout(checkServer, 2000);

      // タイムアウト設定
      setTimeout(() => {
        console.error(`Failed to start server for ${target} (timeout)`);
        serverProcess.kill();
        resolve(null);
      }, 30000);

    } catch (error) {
      console.error(`Error starting server for ${target}:`, error);
      resolve(null);
    }
  });
}

// サーバーを停止する関数
function stopServer(process: any, target: string): void {
  console.log(`Stopping server for ${target}...`);
  process.kill();

  // プロセスが完全に終了するまで待機
  let attempts = 0;
  const checkInterval = setInterval(() => {
    try {
      execSync(`pgrep -f "${target}"`, { stdio: 'ignore' });
      attempts++;
      if (attempts > 10) {
        clearInterval(checkInterval);
        console.log(`Server for ${target} stopped`);
      }
    } catch (error) {
      clearInterval(checkInterval);
      console.log(`Server for ${target} stopped`);
    }
  }, 1000);
}

// ベンチマークを実行する関数
async function runBenchmarkForTarget(target: string): Promise<string[]> {
  console.log(`\n=== Running benchmark for ${target} ===\n`);
  const targetResults: string[] = [];

  // 初回セットアップ
  console.log('Running initial setup...');
  execSync(`cd targets/${target} && npm install && npm run build`, { stdio: 'inherit' });

  // ベンチマークの繰り返し実行
  for (let i = 0; i < iterations; i++) {
    console.log(`\nIteration ${i + 1}/${iterations} for ${target}`);

    try {
      // サーバーを起動
      const serverInfo = await startServer(target);
      if (!serverInfo) {
        targetResults.push(`ERROR: Failed to start server`);
        continue;
      }

      // ベンチマークを実行
      const benchmarkResult = execSync(`cd targets/${target} && npm run benchmark`, { stdio: 'pipe' });

      // カラーコードを削除
      const cleanResult = benchmarkResult.toString().replace(/\u001b\[\d+m/g, '');

      // 結果を保存
      targetResults.push(cleanResult);

      // サーバーを停止
      stopServer(serverInfo.process, target);

    } catch (error: any) {
      console.error(`Error in iteration ${i + 1} for ${target}:`, error);
      targetResults.push(`ERROR: ${error?.message || 'Unknown error'}`);
    }
  }

  return targetResults;
}

// メイン関数
async function runBenchmark() {
  for (const target of targets) {
    results[target] = await runBenchmarkForTarget(target);
  }

  // 結果をファイルに保存
  const outputPath = path.join(__dirname, `benchmark_results_raw.json`);

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

runBenchmark().catch(console.error);
