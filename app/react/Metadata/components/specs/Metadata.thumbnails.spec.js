import { showByType } from '../Metadata.js';

const image = (value, thumbnails) =>
  showByType({
    prop: { type: 'image', label: 'Cover', value },
    thumbnails,
  });

describe('v1 card images', () => {
  it('requests a thumbnail for an image', () => {
    expect(image('/api/files/cover.png', true).props.src).toBe('/files/thumbnails/cover.png');
  });

  it('leaves a non-image file on the original url', () => {
    expect(image('/api/files/hearing.mp3', true).props.src).toBe('/api/files/hearing.mp3');
  });

  it('keeps the original url when the card is not asking for a thumbnail', () => {
    expect(image('/api/files/cover.png', false).props.src).toBe('/api/files/cover.png');
  });
});
