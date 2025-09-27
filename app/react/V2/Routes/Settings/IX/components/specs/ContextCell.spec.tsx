/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContextCell } from '../ContextCell';
import {
  basicMatching,
  multipleMatching,
  multipleMatchInMatching,
  noMatching,
  plainText,
} from './HTMLFixtures';

describe('ContextCell', () => {
  it('should not render script tags', () => {
    render(
      <ContextCell text='<script src="/some.js"></script> <p class="regular-text">Text 1</p> <script src="/another.js" />' />
    );
    expect(screen.getAllByText('Text 1')[0].parentElement).toMatchSnapshot();
    expect(document.querySelector('script')).toBeNull();
  });

  it('should not render script tags when nested on valid tags', () => {
    render(<ContextCell text='<p class="regular-text">Text 1 <script src="/another.js" /></p>' />);
    expect(screen.getAllByText('Text 1')[0]).toMatchSnapshot();
    expect(document.querySelector('script')).toBeNull();
  });

  it('should not render unsafe html tags', () => {
    render(<ContextCell text='<object>Text 1 <p class="regular-text">Nested valid</p></object>' />);
    expect(screen.getAllByText('Nested valid')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Text 1')[0].tagName).toBe('DIV');
  });

  it('should return a truncated string if it is not html', () => {
    render(<ContextCell text={plainText} />);
    expect(screen.getByText('[...]'));
  });

  it('should return the html with the correct classes', () => {
    render(
      <ContextCell text='<p class="ix_matching_paragraph">Some primary text <span class="ix_match">with matching</span> words</p>' />
    );

    expect(screen.getAllByText('Some primary text', { exact: false })[0].className).toBe(
      'ix_matching_paragraph text-black px-1'
    );
    expect(screen.getAllByText('with matching')[0].className).toBe(
      'ix_match bg-[#FFE29A] text-black'
    );
  });

  describe('Truncation Logic', () => {
    it.each([
      ['html with single matching paragraph', basicMatching],
      ['html with multiple matching paragraphs', multipleMatching],
    ])('should truncate %s and only show relevant paragraphs', (_, content) => {
      render(<ContextCell text={content} />);
      expect(
        screen.getAllByText('Praesent sed molestie risus, vitae laoreet elit.')[0].parentElement
      ).toMatchSnapshot();
    });

    it('should work when a matching paragraph has multiple match words', () => {
      render(<ContextCell text={multipleMatchInMatching} />);
      expect(screen.getAllByText('Revenue: $1.2M')[0].parentElement).toMatchSnapshot();
    });

    it('should show the first available paragraph if not matching elements are present', () => {
      render(<ContextCell text={noMatching} />);
      expect(
        screen.getByText('Duis volutpat leo eu interdum euismod. Maecenas lu...').className
      ).toBe('ix_paragraph text-gray-500');
    });
  });

  describe('Context Trimming', () => {
    it('should show meaningful context with dynamic context calculation', () => {
      const issueContent =
        '<p class="ix_adjacent_paragraph">Distr.: General</p><p class="ix_matching_paragraph"><span class="ix_match">6</span> <span class="ix_match">April</span> <span class="ix_match">2021</span></p><p class="ix_adjacent_paragraph">Recalling General Assembly resolution 68/127 on a world against violence and violent extremism, adopted by the Assembly by consensus on 18 December 2013, and welcoming the leading role of the United Nations Educational, Scientific and Cultural Organization in promoting intercultural dialogue, the work of the United Nations Alliance of Civilizations and the Anna Lindh Euro-Mediterranean Foundation for Dialogue between Cultures, the work of the King Abdullah Bin Abdulaziz International Centre for Interreligious and Intercultural dialogue in Vienna, and Assembly resolution 65/5 of 20 October 2010 on World Interfaith Harmony Week, proposed by King Abdullah II of Jordan,</p>';

      render(<ContextCell text={issueContent} />);

      const visibleContent = document.querySelector('[data-testid="flowbite-tooltip-target"]');
      expect(visibleContent?.textContent).toContain('Distr.: General');
      expect(visibleContent?.textContent).toContain('6');
      expect(visibleContent?.textContent).toContain('April');
      expect(visibleContent?.textContent).toContain('2021');
      expect(visibleContent?.textContent).toContain('Recalling');
      expect(visibleContent?.textContent).toContain('General Assembly');

      const matchingParagraph = document.querySelector('.ix_matching_paragraph');
      expect(matchingParagraph?.textContent).toContain('6');
      expect(matchingParagraph?.textContent).toContain('April');
      expect(matchingParagraph?.textContent).toContain('2021');

      expect(visibleContent?.textContent).not.toBe('6 April 2021');
      expect(visibleContent?.textContent).toContain('...');
    });

    it('should handle very short matching text (single character)', () => {
      const shortMatch =
        '<p class="ix_adjacent_paragraph">Before context</p><p class="ix_matching_paragraph"><span class="ix_match">A</span></p><p class="ix_adjacent_paragraph">After context with more meaningful information</p>';

      render(<ContextCell text={shortMatch} />);

      const visibleContent = document.querySelector('[data-testid="flowbite-tooltip-target"]');
      expect(visibleContent?.textContent).toContain('Before context');
      expect(visibleContent?.textContent).toContain('A');
      expect(visibleContent?.textContent).toContain('After context');
    });

    it('should handle very long matching text', () => {
      const longMatch =
        '<p class="ix_adjacent_paragraph">Short before</p><p class="ix_matching_paragraph"><span class="ix_match">This is a very long matching text that should be preserved in full</span></p><p class="ix_adjacent_paragraph">Short after</p>';

      render(<ContextCell text={longMatch} />);

      const visibleContent = document.querySelector('[data-testid="flowbite-tooltip-target"]');
      expect(visibleContent?.textContent).toContain('This is a very long matching text');
    });

    it('should handle multiple short matches in sequence', () => {
      const multipleShort =
        '<p class="ix_adjacent_paragraph">Context before</p><p class="ix_matching_paragraph"><span class="ix_match">A</span> <span class="ix_match">B</span> <span class="ix_match">C</span></p><p class="ix_adjacent_paragraph">Context after</p>';

      render(<ContextCell text={multipleShort} />);

      const visibleContent = document.querySelector('[data-testid="flowbite-tooltip-target"]');
      expect(visibleContent?.textContent).toContain('A');
      expect(visibleContent?.textContent).toContain('B');
      expect(visibleContent?.textContent).toContain('C');
    });

    it('should handle empty segment gracefully', () => {
      const { container } = render(<ContextCell text="" />);
      expect(container).toBeInTheDocument();
    });

    it('should handle "No context" text', () => {
      const noContext = '<p class="ix_paragraph">No context</p>';

      render(<ContextCell text={noContext} />);

      expect(screen.getAllByText('No context')[0]).toBeInTheDocument();
    });

    it('should handle whitespace-only content', () => {
      const whitespaceOnly = '<p class="ix_paragraph">   </p>';

      render(<ContextCell text={whitespaceOnly} />);

      const visibleContent = document.querySelector('[data-testid="flowbite-tooltip-target"]');
      expect(visibleContent).toBeInTheDocument();
    });

    it('should handle nested HTML with multiple levels', () => {
      const nestedHTML =
        '<div><p class="ix_adjacent_paragraph">Outer context</p><div><p class="ix_matching_paragraph">Inner <span class="ix_match">match</span> content</p></div><p class="ix_adjacent_paragraph">More outer context</p></div>';

      render(<ContextCell text={nestedHTML} />);

      const visibleContent = document.querySelector('[data-testid="flowbite-tooltip-target"]');
      expect(visibleContent?.textContent).toContain('Outer context');
      expect(visibleContent?.textContent).toContain('match');
      expect(visibleContent?.textContent).toContain('More outer context');
    });

    it('should handle mixed content types (text, HTML, special characters)', () => {
      const mixedContent =
        '<p class="ix_adjacent_paragraph">Text with &amp; entities &lt;tags&gt;</p><p class="ix_matching_paragraph">Special chars: <span class="ix_match">@#$%</span> and numbers 123</p><p class="ix_adjacent_paragraph">Unicode: 中文 العربية</p>';

      render(<ContextCell text={mixedContent} />);

      const visibleContent = document.querySelector('[data-testid="flowbite-tooltip-target"]');
      expect(visibleContent?.textContent).toContain('@#$%');
      expect(visibleContent?.textContent).toContain('123');
    });
  });
});
