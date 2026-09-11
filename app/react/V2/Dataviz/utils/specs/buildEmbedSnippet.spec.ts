import { buildPageEmbedSnippet } from '../buildEmbedSnippet.js';

describe('buildPageEmbedSnippet', () => {
  it('should include the default height so page authors can see it is configurable', () => {
    expect(buildPageEmbedSnippet('6aa3306eb1d2d149374eac69')).toBe(
      '<Dataviz id="6aa3306eb1d2d149374eac69" height="320"/>'
    );
  });
});
