/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import { highlightSnippetInPage, clearHighlights } from '../snippetToHighlight';

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
        expect(marks.length).toBeGreaterThan(0);

        const textContent = container.textContent || '';
        expect(textContent).toContain('contains');
      });

      it('should highlight the search terms with searchTerm class', () => {
        const snippet = {
          text: 'Page 1 <b>contains</b> some text',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const searchTermMarks = container.querySelectorAll('mark.searchTerm');
        expect(searchTermMarks.length).toBeGreaterThan(0);

        const highlightedText = Array.from(searchTermMarks)
          .map(mark => mark.textContent)
          .join('');
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

        const searchTermMarks = container.querySelectorAll('mark.searchTerm');
        expect(searchTermMarks.length).toBeGreaterThanOrEqual(2);

        const terms = Array.from(searchTermMarks).map(mark => mark.textContent);
        expect(terms).toContain('quick');
        expect(terms).toContain('fox');
      });
    });

    describe('with context highlighting', () => {
      it('should highlight the full snippet context with lighter background', () => {
        const snippet = {
          text: 'Page 1 <b>contains</b> some text',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const contextMarks = container.querySelectorAll('mark:not(.searchTerm)');
        expect(contextMarks.length).toBeGreaterThan(0);
      });

      it('should handle text with special characters', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>Price: $100.50 (discount 20%)</span>
          </div>
        `;

        const snippet = {
          text: 'Price: <b>$100.50</b> (discount 20%)',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });

      it('should handle text with newlines', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>Line one</span>
            <span>Line two</span>
          </div>
        `;

        const snippet = {
          text: 'Line one\n<b>Line two</b>',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });

      it('should handle text spanning multiple elements', () => {
        const snippet = {
          text: 'Page 1 <b>contains</b> some text with <b>multiple</b> spans',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });
    });

    describe('with fuzzy matching fallback', () => {
      it('should fall back to fuzzy matching when exact match fails', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>This text has some variations and differences</span>
          </div>
        `;

        const snippet = {
          text: 'This <b>text</b> has many variations and also differences',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });

      it('should match start and end of snippet with fuzzy middle', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>Beginning of text ... lots of content in between ... end of text</span>
          </div>
        `;

        const snippet = {
          text: 'Beginning of text <b>content</b> end of text',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });

      it('should try progressively smaller chunks on no match', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>A completely different text that does not match at all</span>
          </div>
        `;

        const snippet = {
          text: 'Some <b>random</b> text that is not present',
          page: 1,
        };

        // Should not throw error, just not highlight anything
        expect(() => {
          highlightSnippetInPage(container, snippet);
        }).not.toThrow();
      });
    });

    describe('with empty or invalid input', () => {
      it('should handle empty snippet text gracefully', () => {
        const snippet = {
          text: '',
          page: 1,
        };

        expect(() => {
          highlightSnippetInPage(container, snippet);
        }).not.toThrow();

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBe(0);
      });

      it('should handle snippet without bold tags', () => {
        const snippet = {
          text: 'Page 1 contains some text',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });

      it('should handle container without textLayer', () => {
        const emptyContainer = document.createElement('div');
        document.body.appendChild(emptyContainer);

        const snippet = {
          text: 'Some <b>text</b>',
          page: 1,
        };

        expect(() => {
          highlightSnippetInPage(emptyContainer, snippet);
        }).not.toThrow();

        document.body.removeChild(emptyContainer);
      });

      it('should handle null container gracefully', () => {
        const snippet = {
          text: 'Some <b>text</b>',
          page: 1,
        };

        expect(() => {
          highlightSnippetInPage(null as any, snippet);
        }).not.toThrow();
      });
    });

    describe('with ellipsis and special formatting', () => {
      it('should handle ellipsis characters', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>Text with ... ellipsis</span>
          </div>
        `;

        const snippet = {
          text: 'Text with … <b>ellipsis</b>',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });

      it('should handle multiple whitespace variations', () => {
        container.innerHTML = `
          <div class="textLayer">
            <span>Text   with    extra     spaces</span>
          </div>
        `;

        const snippet = {
          text: 'Text with extra <b>spaces</b>',
          page: 1,
        };

        highlightSnippetInPage(container, snippet);

        const marks = container.querySelectorAll('mark');
        expect(marks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('clearHighlights', () => {
    beforeEach(() => {
      // Add some existing highlights
      const textLayer = container.querySelector('.textLayer');
      if (textLayer) {
        textLayer.innerHTML = `
          <mark class="bg-primary-100">Highlighted</mark>
          <mark class="searchTerm bg-yellow-200">Search term</mark>
          <span>Normal text</span>
        `;
      }
    });

    it('should remove all mark elements', () => {
      clearHighlights(container);

      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(0);
    });

    it('should preserve non-mark content', () => {
      const originalText = container.textContent;
      clearHighlights(container);

      expect(container.textContent).toBe(originalText);
    });

    it('should handle container without marks', () => {
      const cleanContainer = document.createElement('div');
      cleanContainer.innerHTML = '<span>No marks here</span>';
      document.body.appendChild(cleanContainer);

      expect(() => {
        clearHighlights(cleanContainer);
      }).not.toThrow();

      document.body.removeChild(cleanContainer);
    });

    it('should handle null container gracefully', () => {
      expect(() => {
        clearHighlights(null as any);
      }).not.toThrow();
    });

    it('should unwrap mark elements and preserve their text content', () => {
      const textLayer = container.querySelector('.textLayer');
      if (textLayer) {
        textLayer.innerHTML = `
          <span>Before <mark>highlighted text</mark> after</span>
        `;
      }

      clearHighlights(container);

      const marks = container.querySelectorAll('mark');
      expect(marks.length).toBe(0);
      expect(container.textContent).toContain('highlighted text');
    });
  });

  describe('integration scenarios', () => {
    it('should clear and re-highlight on multiple calls', () => {
      const snippet1 = {
        text: 'Page 1 <b>contains</b> some text',
        page: 1,
      };

      highlightSnippetInPage(container, snippet1);
      const marks1 = container.querySelectorAll('mark');
      expect(marks1.length).toBeGreaterThan(0);

      clearHighlights(container);
      const marksAfterClear = container.querySelectorAll('mark');
      expect(marksAfterClear.length).toBe(0);

      const snippet2 = {
        text: 'with <b>multiple</b> spans',
        page: 1,
      };

      highlightSnippetInPage(container, snippet2);
      const marks2 = container.querySelectorAll('mark');
      expect(marks2.length).toBeGreaterThan(0);
    });

    it('should handle real-world PDF text layer structure', () => {
      container.innerHTML = `
        <div class="textLayer">
          <span style="left: 100px; top: 200px;">DE 8 DE DICIEMBRE DE 2021</span>
          <span style="left: 100px; top: 220px;">CASO COMUNIDAD INDÍGENA</span>
          <span style="left: 100px; top: 240px;">MAYA Q'EQCHI' AGUA CALIENTE</span>
        </div>
      `;

      const snippet = {
        text: "DE 8 DE DICIEMBRE DE 2021\n\n<b>CASO</b> COMUNIDAD INDÍGENA MAYA Q'EQCHI' AGUA CALIENTE",
        page: 1,
      };

      highlightSnippetInPage(container, snippet);

      const searchTermMarks = container.querySelectorAll('mark.searchTerm');
      expect(searchTermMarks.length).toBeGreaterThan(0);

      const highlightedText = Array.from(searchTermMarks)
        .map(mark => mark.textContent)
        .join('');
      expect(highlightedText).toContain('CASO');
    });
  });
});
