import { entityPageDocumentCss } from '../entityPageDocumentCss.js';

describe('entityPageDocumentCss', () => {
  it('reads custom page css from the entity loader payload', () => {
    expect(
      entityPageDocumentCss({
        'routes/entity': {
          entityPageView: {
            pageView: { metadata: { css: ' .hero { color: red } ' } },
          },
        },
      })
    ).toBe(' .hero { color: red } ');
  });

  it('ignores empty css and loaders without an entity page', () => {
    expect(
      entityPageDocumentCss({
        library: { rows: [] },
        entity: { entityPageView: { pageView: { metadata: { css: '  ' } } } },
      })
    ).toBeUndefined();
    expect(entityPageDocumentCss(undefined)).toBeUndefined();
  });
});
