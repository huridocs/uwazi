import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const webpackDevScriptUrl = (): string => {
  const webpackPort = process.env.WEBPACK_PORT || 8080;
  const webpackURL =
    typeof process.env.WEBPACK_PUBLIC_URL === 'string'
      ? process.env.WEBPACK_PUBLIC_URL
      : `http://localhost:${webpackPort}`;
  return `${webpackURL.replace(/\/$/, '')}/dataviz-embed.js`;
};

const distAssetsPath = (): string => {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(moduleDir, '../../../../dist/webpack-assets.json');
};

const readHashedScriptFromAssets = (): string | undefined => {
  try {
    const assets = JSON.parse(fs.readFileSync(distAssetsPath(), 'utf8')) as {
      'dataviz-embed'?: { js?: string };
    };
    const js = assets['dataviz-embed']?.js;
    return typeof js === 'string' ? js : undefined;
  } catch {
    return undefined;
  }
};

const resolveDatavizEmbedScriptUrl = (): string => {
  if (process.env.HOT) {
    return webpackDevScriptUrl();
  }

  return readHashedScriptFromAssets() ?? '/dataviz-embed.js';
};

export { resolveDatavizEmbedScriptUrl, webpackDevScriptUrl };
