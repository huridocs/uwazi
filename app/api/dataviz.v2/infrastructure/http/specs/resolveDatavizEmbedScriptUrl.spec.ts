// eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import {
  resolveDatavizEmbedScriptUrl,
  resolveDatavizEmbedScriptUrls,
  webpackDevScriptUrl,
  WEBPACK_SHARED_CHUNK_BOOTSTRAP,
} from '../resolveDatavizEmbedScriptUrl.js';

describe('resolveDatavizEmbedScriptUrl', () => {
  const originalHot = process.env.HOT;
  const originalWebpackPort = process.env.WEBPACK_PORT;
  const originalWebpackPublicUrl = process.env.WEBPACK_PUBLIC_URL;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalHot === undefined) {
      delete process.env.HOT;
    } else {
      process.env.HOT = originalHot;
    }
    if (originalWebpackPort === undefined) {
      delete process.env.WEBPACK_PORT;
    } else {
      process.env.WEBPACK_PORT = originalWebpackPort;
    }
    if (originalWebpackPublicUrl === undefined) {
      delete process.env.WEBPACK_PUBLIC_URL;
    } else {
      process.env.WEBPACK_PUBLIC_URL = originalWebpackPublicUrl;
    }
  });

  it('should point to the webpack dev server when HOT is enabled', () => {
    process.env.HOT = 'true';
    process.env.WEBPACK_PORT = '8080';

    expect(resolveDatavizEmbedScriptUrls()).toEqual(['http://localhost:8080/dataviz-embed.js']);
    expect(resolveDatavizEmbedScriptUrl()).toBe('http://localhost:8080/dataviz-embed.js');
  });

  it('should use WEBPACK_PUBLIC_URL when HOT is enabled', () => {
    process.env.HOT = 'true';
    process.env.WEBPACK_PUBLIC_URL = 'http://webpack.example';

    expect(resolveDatavizEmbedScriptUrls()).toEqual(['http://webpack.example/dataviz-embed.js']);
    expect(resolveDatavizEmbedScriptUrl()).toBe('http://webpack.example/dataviz-embed.js');
  });

  it('should fall back to /dataviz-embed.js when not in HOT mode and assets are missing', () => {
    delete process.env.HOT;
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('missing');
    });

    expect(resolveDatavizEmbedScriptUrls()).toEqual(['/dataviz-embed.js']);
    expect(resolveDatavizEmbedScriptUrl()).toBe('/dataviz-embed.js');
  });

  it('should read the hashed script path from webpack-assets.json when not in HOT mode', () => {
    delete process.env.HOT;
    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: fs.PathOrFileDescriptor) => {
      if (String(filePath).endsWith('webpack-assets.json')) {
        return JSON.stringify({ 'dataviz-embed': { js: '/dataviz-embed.abc123.js' } });
      }
      return 'let __webpack_exports__=__webpack_require__(44510);';
    });

    expect(resolveDatavizEmbedScriptUrls()).toEqual(['/dataviz-embed.abc123.js']);
    expect(resolveDatavizEmbedScriptUrl()).toBe('/dataviz-embed.abc123.js');
  });

  it('should prepend vendor.js when the embed bundle waits on a shared chunk', () => {
    delete process.env.HOT;
    jest.spyOn(fs, 'readFileSync').mockImplementation((filePath: fs.PathOrFileDescriptor) => {
      if (String(filePath).endsWith('webpack-assets.json')) {
        return JSON.stringify({
          vendor: { js: '/vendor.def456.js' },
          'dataviz-embed': { js: '/dataviz-embed.abc123.js' },
        });
      }
      return 'let __webpack_exports__=__webpack_require__.O(void 0,[4121],(()=>__webpack_require__(44510)));';
    });

    expect(resolveDatavizEmbedScriptUrls()).toEqual([
      '/vendor.def456.js',
      '/dataviz-embed.abc123.js',
    ]);
  });

  it('should expose the webpack dev URL helper', () => {
    process.env.WEBPACK_PORT = '9000';

    expect(webpackDevScriptUrl()).toBe('http://localhost:9000/dataviz-embed.js');
  });

  it('should detect webpack shared-chunk bootstrap markers', () => {
    expect(
      WEBPACK_SHARED_CHUNK_BOOTSTRAP.test(
        'let __webpack_exports__=__webpack_require__.O(void 0,[4121],(()=>__webpack_require__(44510)));'
      )
    ).toBe(true);
    expect(
      WEBPACK_SHARED_CHUNK_BOOTSTRAP.test('let __webpack_exports__=__webpack_require__(44510);')
    ).toBe(false);
  });
});
