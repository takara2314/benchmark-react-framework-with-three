import { test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { gzipSync } from 'node:zlib';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// ESMモジュールのための__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface BundleInfo {
  name: string;
  sizeKB: number;
  gzipSizeKB: number;
  type: 'js' | 'css';
}

interface WebVitals {
  fcpMs: number;
  lcpMs: number;
  ttiMs: number;
  tbtMs: number;
}

interface BenchmarkMetrics {
  loadTimeMs: number;
  memoryUsageKB: number;
  fcpMs: number;
  lcpMs: number;
  ttiMs: number;
  tbtMs: number;
  bundleSizes: BundleInfo[];
  totalBundleSizeKB: number;
  totalGzipSizeKB: number;
  jsBundleSizeKB: number;
  cssBundleSizeKB: number;
  jsGzipSizeKB: number;
  cssGzipSizeKB: number;
}

interface EnvironmentInfo {
  platform: string;
  arch: string;
  cpus: number;
  memory: string;
  nodeVersion: string;
  playwrightVersion: string;
}

function getFileSizeInKB(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size / 1024;
}

function getGzipSizeInKB(filePath: string): number {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length / 1024;
}

function getBundleInfo(distPath: string): BundleInfo[] {
  const astroPath = path.join(distPath, '_astro');
  if (!fs.existsSync(astroPath)) {
    return [];
  }

  // JSファイルとCSSファイルを取得
  const jsFiles = fs.readdirSync(astroPath)
    .filter((file: string) => file.endsWith('.js'));

  const cssFiles = fs.readdirSync(astroPath)
    .filter((file: string) => file.endsWith('.css'));

  const jsBundles = jsFiles.map((file: string) => {
    const filePath = path.join(astroPath, file);
    const size = getFileSizeInKB(filePath);
    const gzipSize = getGzipSizeInKB(filePath);

    return {
      name: file,
      sizeKB: Number(size.toFixed(2)),
      gzipSizeKB: Number(gzipSize.toFixed(2)),
      type: 'js' as const
    };
  });

  const cssBundles = cssFiles.map((file: string) => {
    const filePath = path.join(astroPath, file);
    const size = getFileSizeInKB(filePath);
    const gzipSize = getGzipSizeInKB(filePath);

    return {
      name: file,
      sizeKB: Number(size.toFixed(2)),
      gzipSizeKB: Number(gzipSize.toFixed(2)),
      type: 'css' as const
    };
  });

  return [...jsBundles, ...cssBundles].sort((a: BundleInfo, b: BundleInfo) => a.sizeKB - b.sizeKB);
}

function getEnvironmentInfo(): EnvironmentInfo {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

  // Playwrightのバージョンを取得
  let playwrightVersion = 'unknown';
  try {
    const packageJsonPath = path.join(__dirname, '..', 'node_modules', '@playwright', 'test', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      playwrightVersion = packageJson.version;
    }
  } catch (error) {
    console.error('Failed to get Playwright version:', error);
  }

  return {
    platform: `${os.platform()} ${os.release()}`,
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: `${(totalMemory / (1024 * 1024 * 1024)).toFixed(2)}GB (${memoryUsagePercent}% used)`,
    nodeVersion: process.version,
    playwrightVersion,
  };
}

test('ページロードのベンチマーク', async ({ page }) => {
  // 環境情報を取得
  const envInfo = getEnvironmentInfo();
  console.log('Environment Information:', envInfo);

  // ネットワーク条件を固定
  await page.route('**/*', async (route) => {
    // キャッシュを無効化
    const headers = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    await route.continue({ headers });
  });

  // distディレクトリのパスを取得
  const distPath = path.join(process.cwd(), 'dist');

  // バンドル情報を取得
  const bundleInfo = getBundleInfo(distPath);
  const totalBundleSizeKB = bundleInfo.reduce((acc, bundle) => acc + bundle.sizeKB, 0);
  const totalGzipSizeKB = bundleInfo.reduce((acc, bundle) => acc + bundle.gzipSizeKB, 0);

  // JSとCSSのバンドルサイズを計算
  const jsBundles = bundleInfo.filter(bundle => bundle.type === 'js');
  const cssBundles = bundleInfo.filter(bundle => bundle.type === 'css');

  const jsBundleSizeKB = jsBundles.reduce((acc, bundle) => acc + bundle.sizeKB, 0);
  const cssBundleSizeKB = cssBundles.reduce((acc, bundle) => acc + bundle.sizeKB, 0);

  const jsGzipSizeKB = jsBundles.reduce((acc, bundle) => acc + bundle.gzipSizeKB, 0);
  const cssGzipSizeKB = cssBundles.reduce((acc, bundle) => acc + bundle.gzipSizeKB, 0);

  // パフォーマンスメトリクスを収集
  const metrics: BenchmarkMetrics = {
    loadTimeMs: 0,
    memoryUsageKB: 0,
    fcpMs: 0,
    lcpMs: 0,
    ttiMs: 0,
    tbtMs: 0,
    bundleSizes: bundleInfo,
    totalBundleSizeKB,
    totalGzipSizeKB,
    jsBundleSizeKB,
    cssBundleSizeKB,
    jsGzipSizeKB,
    cssGzipSizeKB
  };

  // ページの読み込みを開始
  const startTime = Date.now();

  // ページにアクセス
  await page.goto('http://localhost:3000', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // 読み込み時間を計測
  metrics.loadTimeMs = Date.now() - startTime;

  // Web Vitalsの計測
  const webVitals = await page.evaluate(() => {
    return new Promise<WebVitals>((resolve) => {
      // FCPとナビゲーション情報を取得
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      // LCPを計測
      let lcpValue = 0;
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = lastEntry.startTime;

        // 最後のLCP値が取得できたらresolve
        if (lastEntry.startTime > 0) {
          lcpObserver.disconnect();
          resolve({
            fcpMs: fcpEntry ? fcpEntry.startTime : 0,
            lcpMs: lcpValue,
            ttiMs: navEntry ? navEntry.domInteractive - navEntry.startTime : 0,
            tbtMs: performance.now() - (navEntry ? navEntry.domInteractive : 0)
          });
        }
      });

      // LCPの監視を開始
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // タイムアウト処理（3秒後）
      setTimeout(() => {
        lcpObserver.disconnect();
        resolve({
          fcpMs: fcpEntry ? fcpEntry.startTime : 0,
          lcpMs: lcpValue,
          ttiMs: navEntry ? navEntry.domInteractive - navEntry.startTime : 0,
          tbtMs: performance.now() - (navEntry ? navEntry.domInteractive : 0)
        });
      }, 3000);
    });
  });

  metrics.fcpMs = webVitals.fcpMs;
  metrics.lcpMs = webVitals.lcpMs;
  metrics.ttiMs = webVitals.ttiMs;
  metrics.tbtMs = webVitals.tbtMs;

  // メモリ使用量を取得
  metrics.memoryUsageKB = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  // 結果を出力
  console.log('Benchmark Results:', {
    // 基本メトリクス
    loadTimeMs: `${metrics.loadTimeMs}ms`,
    memoryUsageKB: `${(metrics.memoryUsageKB / 1024).toFixed(2)}KB`,

    // Web Vitals
    firstContentfulPaintMs: `${metrics.fcpMs.toFixed(2)}ms`,
    largestContentfulPaintMs: `${metrics.lcpMs.toFixed(2)}ms`,
    timeToInteractiveMs: `${metrics.ttiMs.toFixed(2)}ms`,
    totalBlockingTimeMs: `${metrics.tbtMs.toFixed(2)}ms`,

    // バンドルサイズ
    bundleSizes: metrics.bundleSizes.map(bundle => ({
      name: bundle.name,
      sizeKB: `${bundle.sizeKB}KB`,
      gzipSizeKB: `${bundle.gzipSizeKB}KB`,
      type: bundle.type
    })),
    totalBundleSizeKB: `${metrics.totalBundleSizeKB.toFixed(2)}KB`,
    totalGzipSizeKB: `${metrics.totalGzipSizeKB.toFixed(2)}KB`,
    jsBundleSizeKB: `${metrics.jsBundleSizeKB.toFixed(2)}KB`,
    cssBundleSizeKB: `${metrics.cssBundleSizeKB.toFixed(2)}KB`,
    jsGzipSizeKB: `${metrics.jsGzipSizeKB.toFixed(2)}KB`,
    cssGzipSizeKB: `${metrics.cssGzipSizeKB.toFixed(2)}KB`
  });
});
