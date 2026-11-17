/* eslint-disable max-statements */
import {
  IMAGE_THUMBNAIL_DIRECTORY,
  IMAGE_THUMBNAIL_JPEG_QUALITY,
  IMAGE_THUMBNAIL_LONG_EDGE,
  imageNeedsThumbnail,
  imageThumbnailLocation,
  imageThumbnailSkipLocation,
} from '../imageThumbnail.js';

describe('imageThumbnail', () => {
  it('expects a thumbnail for the image extensions and for nothing else', () => {
    expect(imageNeedsThumbnail('photo.JPG')).toBe(true);
    expect(imageNeedsThumbnail('photo.jpeg')).toBe(true);
    expect(imageNeedsThumbnail('photo.jpe')).toBe(true);
    expect(imageNeedsThumbnail('photo.jfif')).toBe(true);
    expect(imageNeedsThumbnail('photo.png')).toBe(true);
    expect(imageNeedsThumbnail('photo.webp')).toBe(true);
    expect(imageNeedsThumbnail('photo.gif')).toBe(true);
    expect(imageNeedsThumbnail('photo.bmp')).toBe(true);
    expect(imageNeedsThumbnail('photo.avif')).toBe(true);
    expect(imageNeedsThumbnail('photo.heic')).toBe(true);
    expect(imageNeedsThumbnail('photo.heif')).toBe(true);
    expect(imageNeedsThumbnail('photo.tif')).toBe(true);
    expect(imageNeedsThumbnail('photo.tiff')).toBe(true);

    expect(imageNeedsThumbnail('diagram.svg')).toBe(false);
    expect(imageNeedsThumbnail('clip.mp4')).toBe(false);
    expect(imageNeedsThumbnail('document.pdf')).toBe(false);
    expect(imageNeedsThumbnail('notes')).toBe(false);
  });

  it('stores the derivative and the give-up marker under the thumbnail prefix', () => {
    expect(IMAGE_THUMBNAIL_LONG_EDGE).toBe(640);
    expect(IMAGE_THUMBNAIL_JPEG_QUALITY).toBe(60);
    expect(imageThumbnailLocation('photo.png')).toEqual({
      type: 'customPath',
      destination: IMAGE_THUMBNAIL_DIRECTORY,
      filename: 'photo.png',
    });
    expect(imageThumbnailSkipLocation('photo.png')).toEqual({
      type: 'customPath',
      destination: IMAGE_THUMBNAIL_DIRECTORY,
      filename: 'photo.png.skip',
    });
  });
});
