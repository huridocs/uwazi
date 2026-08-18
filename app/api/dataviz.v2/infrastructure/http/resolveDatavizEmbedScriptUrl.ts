import path from 'path';
import { fileURLToPath } from 'url';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';

type WebpackAssets = {
  vendor?: { js?: string };
  'dataviz-embed'?: { js?: string };
};

/** Webpack entrypoints that wait for shared chunks use `.O(void 0,[chunkIds], ...)`. */
const WEBPACK_SHARED_CHUNK_BOOTSTRAP = /\.O\s*\(\s*void\s*0\s*,\s*\[\s*\d+/;

const webpackDevScriptUrl = (): string => {
  const webpackPort = process.env.WEBPACK_PORT || 8080;
  const webpackURL =
    typeof process.env.WEBPACK_PUBLIC_URL === 'string'
      ? process.env.WEBPACK_PUBLIC_URL
      : `http://localhost:${webpackPort}`;
  return `${webpackURL.replace(/\/$/, '')}/dataviz-embed.js`;
};

const distRootPath = (): string => {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, '../../../../../dist');
};

const distAssetsPath = (): string => path.join(distRootPath(), 'webpack-assets.json');

const readWebpackAssets = (): WebpackAssets | undefined => {
  try {
    return JSON.parse(fs.readFileSync(distAssetsPath(), 'utf8')) as WebpackAssets;
  } catch {
    return undefined;
  }
};

const embedBundleRequiresVendorChunk = (embedScriptPath: string): boolean => {
  try {
    const absolutePath = path.join(distRootPath(), embedScriptPath.replace(/^\//, ''));
    const bundle = fs.readFileSync(absolutePath, 'utf8');
    return WEBPACK_SHARED_CHUNK_BOOTSTRAP.test(bundle);
  } catch {
    return false;
  }
};

const resolveProductionEmbedScriptUrls = (): string[] => {
  const assets = readWebpackAssets();
  const embedScript = assets?.['dataviz-embed']?.js;
  if (!embedScript) {
    return ['/dataviz-embed.js'];
  }

  const vendorScript = assets?.vendor?.js;
  if (vendorScript && embedBundleRequiresVendorChunk(embedScript)) {
    return [vendorScript, embedScript];
  }

  return [embedScript];
};

const resolveDatavizEmbedScriptUrls = (): string[] => {
  if (process.env.HOT) {
    return [webpackDevScriptUrl()];
  }

  return resolveProductionEmbedScriptUrls();
};

/** @deprecated Prefer resolveDatavizEmbedScriptUrls — kept for callers that need a single URL. */
const resolveDatavizEmbedScriptUrl = (): string => {
  const urls = resolveDatavizEmbedScriptUrls();
  return urls[urls.length - 1] ?? '/dataviz-embed.js';
};

export {
  resolveDatavizEmbedScriptUrl,
  resolveDatavizEmbedScriptUrls,
  webpackDevScriptUrl,
  WEBPACK_SHARED_CHUNK_BOOTSTRAP,
};
