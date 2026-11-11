/* eslint-disable max-statements */
import { Result } from '#api/core/libs/Result.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ImageThumbnailRejected } from '../../../domain/imageThumbnailErrors.js';
import { VipsImageThumbnailRenderer } from '../VipsImageThumbnailRenderer.js';

const source = new DiskFile('/tmp/source.png');

const fileIO = {
  toDisk: async () => source,
};

const contents = () =>
  new FileContents(async function* empty() {
    yield new Uint8Array();
  });

describe('VipsImageThumbnailRenderer', () => {
  it('fits the image inside 640 and writes a quality-60 jpeg on white', async () => {
    const execute = jest.fn(async (command: string, args: string[]) => {
      if (command === 'vipsheader' && args[1] === 'bands') {
        return Result.ok('4\n');
      }
      if (command === 'vipsheader') {
        return Result.ok('10\n');
      }
      return Result.ok('');
    });
    const renderer = new VipsImageThumbnailRenderer({ execute }, fileIO);

    await renderer.render(contents());

    const calls = execute.mock.calls.map(([command, args]) => [command, args]);
    expect(calls).toEqual([
      ['vipsheader', ['-f', 'width', source.path]],
      ['vipsheader', ['-f', 'height', source.path]],
      [
        'vips',
        [
          'thumbnail',
          source.path,
          expect.stringMatching(/\.png$/),
          '640',
          '--height',
          '640',
          '--size',
          'down',
        ],
      ],
      ['vipsheader', ['-f', 'bands', expect.stringMatching(/\.png$/)]],
      [
        'vips',
        [
          'flatten',
          expect.stringMatching(/\.png$/),
          expect.stringMatching(/\.jpg\[Q=60\]$/),
          '--background',
          '255,255,255',
        ],
      ],
    ]);
  });

  it('saves a jpeg directly when the thumbnail has no alpha', async () => {
    const execute = jest.fn(async (command: string, args: string[]) => {
      if (command === 'vipsheader' && args[1] === 'bands') {
        return Result.ok('3\n');
      }
      if (command === 'vipsheader') {
        return Result.ok('10\n');
      }
      return Result.ok('');
    });
    const renderer = new VipsImageThumbnailRenderer({ execute }, fileIO);

    await renderer.render(contents());

    const operations = execute.mock.calls
      .filter(([command]) => command === 'vips')
      .map(([, args]) => args[0]);
    expect(operations).toEqual(['thumbnail', 'copy']);
  });

  it('rejects an image above the pixel ceiling before rendering', async () => {
    const execute = jest.fn(async (command: string, args: string[]) =>
      Result.ok(command === 'vipsheader' && args[1] === 'width' ? '20000\n' : '20000\n')
    );
    const renderer = new VipsImageThumbnailRenderer({ execute }, fileIO);

    await expect(renderer.render(contents())).rejects.toBeInstanceOf(ImageThumbnailRejected);
    expect(execute.mock.calls.map(([command]) => command)).toEqual(['vipsheader', 'vipsheader']);
  });
});
