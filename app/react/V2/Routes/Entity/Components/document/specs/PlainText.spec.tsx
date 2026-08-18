/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import * as scroller from '#V2/helpers/scrollIntoView.js';
import { PAGE_SEPARATOR, PlainText } from '../PlainText.js';
import { scrollToPlaintextPage } from '../scrollToPlaintextPage.js';

describe('scrollToPlaintextPage', () => {
  let scrollIntoView: jest.SpyInstance;

  beforeEach(() => {
    scrollIntoView = jest.spyOn(scroller, 'scrollIntoView').mockImplementation(() => undefined);
  });

  afterEach(() => {
    scrollIntoView.mockRestore();
  });

  it('scrolls the matching plaintext page container', () => {
    const { getByRole } = render(
      <PlainText text={['first', 'second', 'third'].join(PAGE_SEPARATOR)} />
    );

    scrollToPlaintextPage(3);

    expect(scrollIntoView).toHaveBeenCalledWith(getByRole('region', { name: 'Page 3' }), {
      block: 'start',
    });
  });

  it('does nothing when the page container is missing', () => {
    render(<PlainText text="only page one" />);

    scrollToPlaintextPage(4);

    expect(scrollIntoView).toHaveBeenCalledWith(null, { block: 'start' });
  });
});

describe('PlainText', () => {
  let scrollIntoView: jest.SpyInstance;

  beforeEach(() => {
    scrollIntoView = jest.spyOn(scroller, 'scrollIntoView').mockImplementation(() => undefined);
  });

  afterEach(() => {
    scrollIntoView.mockRestore();
  });

  it('renders a container per page and keeps page ids', () => {
    const { getByRole, getByTestId } = render(
      <PlainText text={['alpha', 'beta'].join(PAGE_SEPARATOR)} />
    );

    expect(getByTestId('entity-plaintext')).toBeInTheDocument();
    expect(getByRole('region', { name: 'Page 1' })).toHaveAttribute('id', 'page1');
    expect(getByRole('region', { name: 'Page 1' })).toHaveAttribute('data-plaintext-page', '1');
    expect(getByRole('region', { name: 'Page 1' })).toHaveClass(
      'rounded-md',
      'border',
      'border-border-soft',
      'bg-paper'
    );
    expect(getByRole('region', { name: 'Page 2' })).toHaveAttribute('id', 'page2');
    expect(getByRole('region', { name: 'Page 2' })).toHaveClass('border-border-soft', 'bg-paper');
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls to the given page after render', () => {
    const { getByRole, rerender } = render(
      <PlainText page={2} text={['one', 'two', 'three'].join(PAGE_SEPARATOR)} />
    );

    expect(scrollIntoView).toHaveBeenCalledWith(getByRole('region', { name: 'Page 2' }), {
      block: 'start',
    });

    scrollIntoView.mockClear();
    rerender(<PlainText page={3} text={['one', 'two', 'three'].join(PAGE_SEPARATOR)} />);

    expect(scrollIntoView).toHaveBeenCalledWith(getByRole('region', { name: 'Page 3' }), {
      block: 'start',
    });
  });
});
