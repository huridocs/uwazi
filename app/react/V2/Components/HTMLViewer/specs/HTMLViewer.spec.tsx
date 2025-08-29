/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HTMLViewer } from '../HTMLViewer';

const htmlString =
  '<p class="regular-text">Some paragraph <span class="bold-text">with text nested in span</span></p>';

const multipleItems = '<p class="regular-text">Text 1</p><p class="red-text">Text 2</p>';

const withScript1 =
  '<script src="/some.js"></script> <p class="regular-text">Text 1</p> <script src="/another.js" />';

const withScript2 = '<p class="regular-text">Text 1 <script src="/another.js" /></p>';

const invalidHTML = '<object>Text 1 <p class="regular-text">Nested valid</p></object>';

describe('HTMLViewer', () => {
  it('should display the provided html', () => {
    render(<HTMLViewer>{htmlString}</HTMLViewer>);
    expect(screen.getByText('Some paragraph')).toHaveClass('regular-text');
    expect(screen.getByText('with text nested in span')).toHaveClass('bold-text');
  });

  it('should render multiple items', () => {
    render(<HTMLViewer>{multipleItems}</HTMLViewer>);
    expect(screen.getByText('Text 1').parentElement).toMatchSnapshot();
  });

  it('should render simple string', () => {
    render(<HTMLViewer>Some basic string</HTMLViewer>);
    expect(screen.getByText('Some basic string')).toMatchSnapshot();
  });

  it('should not render script tags', () => {
    render(<HTMLViewer>{withScript1}</HTMLViewer>);
    expect(screen.getByText('Text 1')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('should not render script tags when nested on valid tags', () => {
    render(<HTMLViewer>{withScript2}</HTMLViewer>);
    expect(screen.getByText('Text 1')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('should not render unsafe html tags', () => {
    render(<HTMLViewer>{invalidHTML}</HTMLViewer>);
    expect(screen.getByText('Nested valid')).toBeInTheDocument();
    expect(screen.getByText('Text 1').tagName).toBe('DIV');
  });
});
