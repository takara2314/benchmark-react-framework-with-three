import * as fs from 'fs';
import * as path from 'path';
import * as JSON5 from 'json5';

// 生のベンチマーク結果を読み込む
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'benchmark_results_raw.json'), 'utf-8')
);

// 結果を整形する関数
function formatBenchmarkResults(rawData: Record<string, string[]>) {
  const formattedResults: Record<string, any[]> = {};

  // 各フレームワークのデータを処理
  for (const [framework, results] of Object.entries(rawData)) {
    formattedResults[framework] = results.map((result: string) => {
      // "Benchmark Results: " と "  ✓  " の間のJSONを抽出
      const startMarker = 'Benchmark Results: ';
      const endMarker = '  ✓  ';

      const startIndex = result.indexOf(startMarker) + startMarker.length;
      const endIndex = result.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        console.error(`マーカーが見つかりません: ${framework}`);
        return null;
      }

      // JSONを抽出して改行を削除
      const jsonStr = result.substring(startIndex, endIndex).replace(/\n/g, '');

      try {
        // JSON5でパース
        return JSON5.parse(jsonStr);
      } catch (error) {
        console.error(`JSON5のパースに失敗しました: ${framework}`, error);
        return null;
      }
    }).filter(Boolean); // nullを除外
  }

  return formattedResults;
}

// 結果を整形
const formattedResults = formatBenchmarkResults(rawData);

// 結果をJSONファイルに書き出す
fs.writeFileSync(
  path.join(__dirname, 'benchmark_results.json'),
  JSON.stringify(formattedResults, null, 2),
  'utf-8'
);

console.log('ベンチマーク結果の整形が完了しました。');
