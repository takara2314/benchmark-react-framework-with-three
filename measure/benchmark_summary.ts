import fs from 'fs';
import path from 'path';

interface CSVInput {
  framework: string;
  iteration: number;
  loadTimeMs: number;
  memoryUsageKB: number;
  firstContentfulPaintMs: number;
  largestContentfulPaintMs: number;
  timeToInteractiveMs: number;
  totalBlockingTimeMs: number;
  totalBundleSizeKB: number;
  totalGzipSizeKB: number;
  jsBundleSizeKB: number;
  cssBundleSizeKB: number;
  jsGzipSizeKB: number;
  cssGzipSizeKB: number;
}

interface FrameworkAverage {
  framework: string;
  loadTimeMs: number;
  memoryUsageKB: number;
  firstContentfulPaintMs: number;
  largestContentfulPaintMs: number;
  timeToInteractiveMs: number;
  totalBlockingTimeMs: number;
  totalBundleSizeKB: number;
  totalGzipSizeKB: number;
  jsBundleSizeKB: number;
  cssBundleSizeKB: number;
  jsGzipSizeKB: number;
  cssGzipSizeKB: number;
}

// CSVファイルを読み込む
const csvFilePath = path.join(__dirname, 'benchmark_results.csv');
const csvData = fs.readFileSync(csvFilePath, 'utf-8');

// CSVデータをパースする
const rows = csvData.split('\n').slice(1); // ヘッダーを除外
const data: CSVInput[] = rows
  .filter(row => row.trim() !== '')
  .map(row => {
    const [
      framework,
      iteration,
      loadTimeMs,
      memoryUsageKB,
      firstContentfulPaintMs,
      largestContentfulPaintMs,
      timeToInteractiveMs,
      totalBlockingTimeMs,
      totalBundleSizeKB,
      totalGzipSizeKB,
      jsBundleSizeKB,
      cssBundleSizeKB,
      jsGzipSizeKB,
      cssGzipSizeKB
    ] = row.split(',');

    return {
      framework,
      iteration: parseInt(iteration, 10),
      loadTimeMs: parseFloat(loadTimeMs),
      memoryUsageKB: parseFloat(memoryUsageKB),
      firstContentfulPaintMs: parseFloat(firstContentfulPaintMs),
      largestContentfulPaintMs: parseFloat(largestContentfulPaintMs),
      timeToInteractiveMs: parseFloat(timeToInteractiveMs),
      totalBlockingTimeMs: parseFloat(totalBlockingTimeMs),
      totalBundleSizeKB: parseFloat(totalBundleSizeKB),
      totalGzipSizeKB: parseFloat(totalGzipSizeKB),
      jsBundleSizeKB: parseFloat(jsBundleSizeKB),
      cssBundleSizeKB: parseFloat(cssBundleSizeKB),
      jsGzipSizeKB: parseFloat(jsGzipSizeKB),
      cssGzipSizeKB: parseFloat(cssGzipSizeKB)
    };
  });

// フレームワークごとにデータをグループ化
const frameworkGroups = data.reduce((acc, item) => {
  if (!acc[item.framework]) {
    acc[item.framework] = [];
  }
  acc[item.framework].push(item);
  return acc;
}, {} as Record<string, CSVInput[]>);

// 各フレームワークの平均値を計算
const frameworkAverages: FrameworkAverage[] = Object.entries(frameworkGroups).map(([framework, items]) => {
  const sum = items.reduce((acc, item) => ({
    loadTimeMs: acc.loadTimeMs + item.loadTimeMs,
    memoryUsageKB: acc.memoryUsageKB + item.memoryUsageKB,
    firstContentfulPaintMs: acc.firstContentfulPaintMs + item.firstContentfulPaintMs,
    largestContentfulPaintMs: acc.largestContentfulPaintMs + item.largestContentfulPaintMs,
    timeToInteractiveMs: acc.timeToInteractiveMs + item.timeToInteractiveMs,
    totalBlockingTimeMs: acc.totalBlockingTimeMs + item.totalBlockingTimeMs,
    totalBundleSizeKB: acc.totalBundleSizeKB + item.totalBundleSizeKB,
    totalGzipSizeKB: acc.totalGzipSizeKB + item.totalGzipSizeKB,
    jsBundleSizeKB: acc.jsBundleSizeKB + item.jsBundleSizeKB,
    cssBundleSizeKB: acc.cssBundleSizeKB + item.cssBundleSizeKB,
    jsGzipSizeKB: acc.jsGzipSizeKB + item.jsGzipSizeKB,
    cssGzipSizeKB: acc.cssGzipSizeKB + item.cssGzipSizeKB
  }), {
    loadTimeMs: 0,
    memoryUsageKB: 0,
    firstContentfulPaintMs: 0,
    largestContentfulPaintMs: 0,
    timeToInteractiveMs: 0,
    totalBlockingTimeMs: 0,
    totalBundleSizeKB: 0,
    totalGzipSizeKB: 0,
    jsBundleSizeKB: 0,
    cssBundleSizeKB: 0,
    jsGzipSizeKB: 0,
    cssGzipSizeKB: 0
  });

  const count = items.length;
  return {
    framework,
    loadTimeMs: Math.round(sum.loadTimeMs / count),
    memoryUsageKB: Math.round(sum.memoryUsageKB / count),
    firstContentfulPaintMs: Math.round(sum.firstContentfulPaintMs / count),
    largestContentfulPaintMs: Math.round(sum.largestContentfulPaintMs / count),
    timeToInteractiveMs: Math.round((sum.timeToInteractiveMs / count) * 10) / 10,
    totalBlockingTimeMs: Math.round((sum.totalBlockingTimeMs / count) * 10) / 10,
    totalBundleSizeKB: Math.round((sum.totalBundleSizeKB / count) * 100) / 100,
    totalGzipSizeKB: Math.round((sum.totalGzipSizeKB / count) * 100) / 100,
    jsBundleSizeKB: Math.round((sum.jsBundleSizeKB / count) * 100) / 100,
    cssBundleSizeKB: Math.round((sum.cssBundleSizeKB / count) * 100) / 100,
    jsGzipSizeKB: Math.round((sum.jsGzipSizeKB / count) * 100) / 100,
    cssGzipSizeKB: Math.round((sum.cssGzipSizeKB / count) * 100) / 100
  };
});

// 指定された順序（Astro, Vite, Next.js）でソート
const sortedAverages = frameworkAverages.sort((a, b) => {
  const order = { 'astro': 0, 'vite': 1, 'next': 2 };
  return order[a.framework as keyof typeof order] - order[b.framework as keyof typeof order];
});

// 結果を表示
console.log('ベンチマーク結果の平均値:');
console.log('----------------------------------------');
console.log('| 指標 | Astro | Vite | Next.js |');
console.log('----------------------------------------');
console.log(`| ロード時間 [ms] | ${sortedAverages[0].loadTimeMs} | ${sortedAverages[1].loadTimeMs} | ${sortedAverages[2].loadTimeMs} |`);
console.log(`| メモリ使用量 [KB] | ${sortedAverages[0].memoryUsageKB} | ${sortedAverages[1].memoryUsageKB} | ${sortedAverages[2].memoryUsageKB} |`);
console.log(`| First Contentful Paint [ms] | ${sortedAverages[0].firstContentfulPaintMs} | ${sortedAverages[1].firstContentfulPaintMs} | ${sortedAverages[2].firstContentfulPaintMs} |`);
console.log(`| Largest Contentful Paint [ms] | ${sortedAverages[0].largestContentfulPaintMs} | ${sortedAverages[1].largestContentfulPaintMs} | ${sortedAverages[2].largestContentfulPaintMs} |`);
console.log(`| Time to Interactive [ms] | ${sortedAverages[0].timeToInteractiveMs} | ${sortedAverages[1].timeToInteractiveMs} | ${sortedAverages[2].timeToInteractiveMs} |`);
console.log(`| Total Blocking Time [ms] | ${sortedAverages[0].totalBlockingTimeMs} | ${sortedAverages[1].totalBlockingTimeMs} | ${sortedAverages[2].totalBlockingTimeMs} |`);
console.log(`| バンドル合計サイズ [KB] | ${sortedAverages[0].totalBundleSizeKB} | ${sortedAverages[1].totalBundleSizeKB} | ${sortedAverages[2].totalBundleSizeKB} |`);
console.log(`| Gzip合計サイズ [KB] | ${sortedAverages[0].totalGzipSizeKB} | ${sortedAverages[1].totalGzipSizeKB} | ${sortedAverages[2].totalGzipSizeKB} |`);
console.log(`| JS バンドルサイズ [KB] | ${sortedAverages[0].jsBundleSizeKB} | ${sortedAverages[1].jsBundleSizeKB} | ${sortedAverages[2].jsBundleSizeKB} |`);
console.log(`| CSS バンドルサイズ [KB] | ${sortedAverages[0].cssBundleSizeKB} | ${sortedAverages[1].cssBundleSizeKB} | ${sortedAverages[2].cssBundleSizeKB} |`);
console.log(`| JS Gzipサイズ [KB] | ${sortedAverages[0].jsGzipSizeKB} | ${sortedAverages[1].jsGzipSizeKB} | ${sortedAverages[2].jsGzipSizeKB} |`);
console.log(`| CSS Gzipサイズ [KB] | ${sortedAverages[0].cssGzipSizeKB} | ${sortedAverages[1].cssGzipSizeKB} | ${sortedAverages[2].cssGzipSizeKB} |`);
console.log('----------------------------------------');

// 結果をCSVファイルに出力
const outputCsv = [
  'framework,loadTimeMs,memoryUsageKB,firstContentfulPaintMs,largestContentfulPaintMs,timeToInteractiveMs,totalBlockingTimeMs,totalBundleSizeKB,totalGzipSizeKB,jsBundleSizeKB,cssBundleSizeKB,jsGzipSizeKB,cssGzipSizeKB',
  ...sortedAverages.map(avg => 
    `${avg.framework},${avg.loadTimeMs},${avg.memoryUsageKB},${avg.firstContentfulPaintMs},${avg.largestContentfulPaintMs},${avg.timeToInteractiveMs},${avg.totalBlockingTimeMs},${avg.totalBundleSizeKB},${avg.totalGzipSizeKB},${avg.jsBundleSizeKB},${avg.cssBundleSizeKB},${avg.jsGzipSizeKB},${avg.cssGzipSizeKB}`
  )
].join('\n');

fs.writeFileSync(path.join(__dirname, 'benchmark_averages.csv'), outputCsv);
console.log('平均値を benchmark_averages.csv に保存しました。');
