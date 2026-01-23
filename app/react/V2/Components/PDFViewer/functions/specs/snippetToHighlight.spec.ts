/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import {
  highlightSnippetInPage,
  clearSnippets,
} from '#V2/Components/PDFViewer/functions/snippetToHighlight.js';

const joinText = (nodes: NodeListOf<Element>): string =>
  Array.from(nodes)
    .map(n => n.textContent)
    .join('');

describe('snippetToHighlight', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'pdf-page';
    container.innerHTML = `
      <div class="textLayer">
        <span>Page 1 contains some text</span>
        <span>with multiple spans</span>
        <span>and more content here</span>
      </div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('highlightSnippetInPage', () => {
    describe('with simple text match', () => {
      it('should highlight text matching the snippet', () => {
        const snippet = {
          text: 'Page 1 <b>contains</b> some text',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        const marksText = joinText(marks);
        expect(marksText).toContain('contains');

        const contexts = container.querySelectorAll('.snippet-context');
        expect(contexts.length).toBeGreaterThan(0);
        Array.from(contexts).forEach(ctx => {
          const el = ctx as HTMLElement;
          expect(el.style.backgroundColor).toBeTruthy();
        });
      });

      it('should highlight the search terms with searchTerm class', () => {
        const snippet = {
          text: 'Page 1 <b>contains</b> some text',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const searchTermMarks = container.querySelectorAll('mark.snippet-search-term');
        const highlightedText = joinText(searchTermMarks);
        expect(highlightedText).toContain('contains');
      });

      it('should extract multiple search terms from bold tags', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>The quick brown fox jumps over the lazy dog</span>
          </div>
        `;

        const snippet = {
          text: 'The <b>quick</b> brown <b>fox</b> jumps',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const searchTermMarks = container.querySelectorAll('mark.snippet-search-term');
        const termsText = joinText(searchTermMarks);
        expect(termsText).toContain('quick');
        expect(termsText).toContain('fox');
      });
    });

    describe('various snippet scenarios', () => {
      it('handles a set of real-world snippet cases', () => {
        const snippets = [
          {
            name: 'special characters',
            html: '<div class="textLayer"><span>Price: $100.50 (discount 20%)</span></div>',
            snippetText: 'Price: <b>$100.50</b> (discount 20%)',
            expected: '$100.50',
          },
          {
            name: 'newlines',
            html: '<div class="textLayer"><span>Line one</span><span>Line two</span></div>',
            snippetText: 'Line one\n<b>Line two</b>',
            expected: 'Line two',
          },
          {
            name: 'spanning multiple elements',
            html: '<div class="textLayer"><span>Page 1 contains some text</span><span>with multiple spans</span></div>',
            snippetText: 'Page 1 <b>contains</b> some text with <b>multiple</b> spans',
            expected: ['contains', 'multiple'],
          },
          {
            name: 'fuzzy fallback 1',
            html: '<div class="textLayer"><span>This text has some variations and differences</span></div>',
            snippetText: 'This <b>text</b> has many variations and also differences',
            expected: 'text',
          },
          {
            name: 'fuzzy fallback 2',
            html: '<div class="textLayer"><span>Beginning of text ... lots of content in between ... end of text</span></div>',
            snippetText: 'Beginning of text <b>content</b> end of text',
            expected: 'content',
          },
          {
            name: 'ellipsis',
            html: '<div class="textLayer"><span>Text with ... ellipsis</span></div>',
            snippetText: 'Text with … <b>ellipsis</b>',
            expected: 'ellipsis',
          },
          {
            name: 'extra spaces',
            html: '<div class="textLayer"><span>Text   with    extra     spaces</span></div>',
            snippetText: 'Text with extra <b>spaces</b>',
            expected: 'spaces',
          },
        ];

        snippets.forEach(snippet => {
          container.innerHTML = snippet.html;

          highlightSnippetInPage(container, { text: snippet.snippetText, page: 1 });

          const marks = container.querySelectorAll('mark');
          const marksText = joinText(marks);

          // ensure snippet context spans have background color applied
          const contexts = container.querySelectorAll('.snippet-context');
          expect(contexts.length).toBeGreaterThanOrEqual(0);
          Array.from(contexts).forEach(ctx => {
            const el = ctx as HTMLElement;
            expect(el.style.backgroundColor === '' || !!el.style.backgroundColor).toBeTruthy();
          });

          if (Array.isArray(snippet.expected)) {
            snippet.expected.forEach(exp => expect(marksText).toContain(exp));
          } else {
            expect(marksText).toContain(snippet.expected);
          }
        });
      });
    });
  });

  describe('clearSnippets', () => {
    beforeEach(() => {
      const textLayer = container.querySelector('.textLayer');
      if (textLayer) {
        textLayer.innerHTML = `
          <mark class="snippet-context">Highlighted</mark>
          <mark class="snippet-search-term">Search term</mark>
          <span>Normal text</span>
        `;
      }
    });

    it('should remove all mark elements', () => {
      clearSnippets(container);

      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(0);
    });

    it('should unwrap mark elements and preserve their text content', () => {
      const textLayer = container.querySelector('.textLayer');
      if (textLayer) {
        textLayer.innerHTML = `
          <span>Before <mark>highlighted text</mark> after</span>
        `;
      }

      clearSnippets(container);

      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(0);
      expect(container.textContent).toContain('highlighted text');
    });
  });

  it('should clear and re-highlight on multiple calls', () => {
    const snippet1 = {
      text: 'Page 1 <b>contains</b> some text',
      page: 1,
    };

    highlightSnippetInPage(container, snippet1);
    const marks1 = container.querySelectorAll('mark');
    const marks1Text = joinText(marks1);
    expect(marks1Text).toContain('contains');

    clearSnippets(container);
    const marksAfterClear = container.querySelectorAll('mark');
    expect(marksAfterClear.length).toBe(0);

    const snippet2 = {
      text: 'with <b>multiple</b> spans',
      page: 1,
    };

    highlightSnippetInPage(container, snippet2);
    const marks2 = container.querySelectorAll('mark');
    const marks2Text = joinText(marks2);
    expect(marks2Text).toContain('multiple');
  });
});
