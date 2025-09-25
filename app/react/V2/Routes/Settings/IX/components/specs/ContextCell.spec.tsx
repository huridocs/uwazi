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
      'ix_matching_paragraph text-black'
    );
    expect(screen.getAllByText('with matching')[0].className).toBe(
      'ix_match bg-[#FFE29A] text-black'
    );
  });

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
    expect(screen.getByText('Duis volutpat leo eu...').className).toBe(
      'ix_paragraph text-gray-500'
    );
  });
});
