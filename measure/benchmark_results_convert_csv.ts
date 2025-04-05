// インプット
interface JSONResult {
  astro: PerformanceMetrics[];
  next: PerformanceMetrics[];
  vite: PerformanceMetrics[];
}

interface BundleInfo {
  name: string;
  sizeKB: number;
  gzipSizeKB: number;
  type: "js" | "css";
}

interface PerformanceMetrics {
  loadTimeMs: number;
  memoryUsageKB: number;
  firstContentfulPaintMs: number;
  largestContentfulPaintMs: number;
  timeToInteractiveMs: number;
  totalBlockingTimeMs: number;
  bundleSizes: BundleInfo[];
  totalBundleSizeKB: number;
  totalGzipSizeKB: number;
  jsBundleSizeKB: number;
  cssBundleSizeKB: number;
  jsGzipSizeKB: number;
  cssGzipSizeKB: number;
}

// 最終アウトプット
interface CSVResult {
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

// 文字列から単位を削除して数値に変換する関数
function parseMetricValue(value: string): number {
  // 単位（ms, KB）を削除して数値に変換
  return parseFloat(value.replace(/[^0-9.]/g, ''));
}

// JSONデータをCSVに変換する関数
function convertJSONToCSV(jsonData: JSONResult): CSVResult[] {
  const csvResults: CSVResult[] = [];

  // 各フレームワークのデータを処理
  Object.entries(jsonData).forEach(([framework, metrics]) => {
    metrics.forEach((metric: PerformanceMetrics, index: number) => {
      // 文字列の値を数値に変換
      const csvResult: CSVResult = {
        framework,
        iteration: index + 1,
        loadTimeMs: parseMetricValue(metric.loadTimeMs as unknown as string),
        memoryUsageKB: parseMetricValue(metric.memoryUsageKB as unknown as string),
        firstContentfulPaintMs: parseMetricValue(metric.firstContentfulPaintMs as unknown as string),
        largestContentfulPaintMs: parseMetricValue(metric.largestContentfulPaintMs as unknown as string),
        timeToInteractiveMs: parseMetricValue(metric.timeToInteractiveMs as unknown as string),
        totalBlockingTimeMs: parseMetricValue(metric.totalBlockingTimeMs as unknown as string),
        totalBundleSizeKB: parseMetricValue(metric.totalBundleSizeKB as unknown as string),
        totalGzipSizeKB: parseMetricValue(metric.totalGzipSizeKB as unknown as string),
        jsBundleSizeKB: parseMetricValue(metric.jsBundleSizeKB as unknown as string),
        cssBundleSizeKB: parseMetricValue(metric.cssBundleSizeKB as unknown as string),
        jsGzipSizeKB: parseMetricValue(metric.jsGzipSizeKB as unknown as string),
        cssGzipSizeKB: parseMetricValue(metric.cssGzipSizeKB as unknown as string)
      };

      csvResults.push(csvResult);
    });
  });
  
  return csvResults;
}

// CSVヘッダーを生成する関数
function generateCSVHeader(): string {
  return 'framework,iteration,loadTimeMs,memoryUsageKB,firstContentfulPaintMs,largestContentfulPaintMs,timeToInteractiveMs,totalBlockingTimeMs,totalBundleSizeKB,totalGzipSizeKB,jsBundleSizeKB,cssBundleSizeKB,jsGzipSizeKB,cssGzipSizeKB';
}

// CSV行を生成する関数
function generateCSVRow(result: CSVResult): string {
  return `${result.framework},${result.iteration},${result.loadTimeMs},${result.memoryUsageKB},${result.firstContentfulPaintMs},${result.largestContentfulPaintMs},${result.timeToInteractiveMs},${result.totalBlockingTimeMs},${result.totalBundleSizeKB},${result.totalGzipSizeKB},${result.jsBundleSizeKB},${result.cssBundleSizeKB},${result.jsGzipSizeKB},${result.cssGzipSizeKB}`;
}

// メイン処理
import fs from 'fs';
import path from 'path';

// JSONファイルを読み込む
const jsonFilePath = path.join(__dirname, 'benchmark_results.json');
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8')) as JSONResult;

// JSONデータをCSVに変換
const csvResults = convertJSONToCSV(jsonData);

// CSVファイルを生成
const csvFilePath = path.join(__dirname, 'benchmark_results.csv');
const csvContent = [generateCSVHeader(), ...csvResults.map(generateCSVRow)].join('\n');

// CSVファイルを書き込む
fs.writeFileSync(csvFilePath, csvContent, 'utf-8');

console.log(`CSVファイルを生成しました: ${csvFilePath}`);
