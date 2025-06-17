/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Truncate } from '../Truncate';

describe('Truncate', () => {
  it.each([
    ['Short text', 20, false, 'Short text'],
    ['This is a medium length text', 10, true, 'This'],
    [
      'This is a very long text that should definitely be truncated because it exceeds the maximum length',
      20,
      true,
      'This is a',
    ],
  ])(
    'renders text "%s" with maxLength %i (should truncate: %s)',
    async (text, maxLength, shouldTruncate, expectedTruncatedText) => {
      render(
        <Truncate maxLength={maxLength} ellipsisPosition="center">
          {text}
        </Truncate>
      );

      if (shouldTruncate) {
        expect(screen.getByText('[...]')).toBeInTheDocument();
        expect(screen.getByText(expectedTruncatedText)).toBeInTheDocument();
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent(text);
      } else {
        expect(screen.getByText(text)).toBeVisible();
        expect(screen.queryByText('[...]')).not.toBeInTheDocument();
      }
    }
  );

  it.each([
    ['Simple text', 'text-white'],
    ['Text with primary background', 'bg-primary-400 text-white'],
    ['Text with orange background', 'bg-orange-400 text-white'],
  ])('renders styled text "%s" with classes %s', (text, className) => {
    render(
      <Truncate maxLength={40} ellipsisPosition="center">
        <div className={className}>{text}</div>
      </Truncate>
    );

    const element = screen.getByText(text);
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass(...className.split(' '));
  });

  it('preserves styles when text is truncated', async () => {
    const longText = 'This is a very long text that should be truncated';
    const className = 'px-1 bg-primary-400 text-white';

    await act(async () => {
      render(
        <Truncate maxLength={20} ellipsisPosition="center">
          <div className={className}>{longText}</div>
        </Truncate>
      );
    });

    expect(screen.getByText('[...]')).toBeInTheDocument();
    const element = screen.getByText('This is a');
    expect(element).toHaveClass(...className.split(' '));
  });

  it('handles text with special characters', async () => {
    const textWithSpecialChars = 'Text with dots... and more text that should be truncated';
    render(
      <Truncate maxLength={20} ellipsisPosition="center">
        {textWithSpecialChars}
      </Truncate>
    );
    expect(screen.getByText('[...]')).toBeInTheDocument();
    expect(screen.getByText(textWithSpecialChars)).toBeInTheDocument();
  });

  it('should add the ellipsis at the end by default', () => {
    const longText = 'This is a very long text that should be truncated at the end';
    render(<Truncate maxLength={20}>{longText}</Truncate>);

    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByText('This is a very long')).toBeInTheDocument();
    expect(screen.queryByText('at the end')).not.toBeInTheDocument();
  });

  it('should render nested tags as a single string', () => {
    render(
      <Truncate maxLength={50}>
        <div className="custom-class">
          This has a variety{' '}
          <span>
            of nested <b>elements</b>
          </span>{' '}
          some nested{' '}
          <div>
            <i>
              some inside a div <b>and then some</b>
            </i>
          </div>
        </div>
      </Truncate>
    );

    expect(
      screen.getByText('This has a variety of nested elements some nested')
    ).toBeInTheDocument();
    expect(screen.queryByText('...')).toBeInTheDocument();
  });
});
