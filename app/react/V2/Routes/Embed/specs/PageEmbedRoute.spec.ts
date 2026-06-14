import { PageEmbedView } from '#app/Pages/PageEmbedView.js';
import { PageEmbedRoute } from '../PageEmbedRoute.js';

describe('PageEmbedRoute', () => {
  it('should expose requestState for SSR page data loading', () => {
    expect(PageEmbedRoute.requestState).toBe(PageEmbedView.requestState);
  });
});
