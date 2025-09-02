/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContextCell } from '../ContextCell';

describe('ContextCell', () => {
  it('should not render script tags', () => {
    render(
      <ContextCell text='<script src="/some.js"></script> <p class="regular-text">Text 1</p> <script src="/another.js" />' />
    );
    expect(screen.getByText('Text 1')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('should not render script tags when nested on valid tags', () => {
    render(<ContextCell text='<p class="regular-text">Text 1 <script src="/another.js" /></p>' />);
    expect(screen.getByText('Text 1')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('should not render unsafe html tags', () => {
    render(<ContextCell text='<object>Text 1 <p class="regular-text">Nested valid</p></object>' />);
    expect(screen.getByText('Nested valid')).toBeInTheDocument();
    expect(screen.getByText('Text 1').tagName).toBe('DIV');
  });

  it('should return a truncated string if it is not html', () => {
    render(
      <ContextCell
        text="Duis volutpat leo eu interdum euismod. Maecenas luctus ut lacus dapibus euismod. Vestibulum
        massa leo, hendrerit vitae metus aliquet, posuere finibus justo. Praesent sed molestie
        risus, vitae laoreet elit. Cras dapibus, neque a eleifend iaculis, nulla arcu euismod metus,
        et condimentum nisl eros eu odio."
      />
    );

    expect(screen.getByText('[...]'));
  });

  it('should return the html with the correct classes', () => {
    render(
      <ContextCell text='<p class="ix_matching_paragraph">Some primary text <span class="ix_match">with matching</span> words</p>' />
    );

    expect(screen.getByText('Some primary text', { exact: false }).className).toBe(
      'ix_matching_paragraph text-gray-900'
    );
    expect(screen.getByText('with matching').className).toBe('ix_match text-orange-600');
  });
});
