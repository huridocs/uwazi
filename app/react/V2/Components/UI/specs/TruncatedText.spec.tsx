/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TruncatedText } from '../TruncatedText';

describe('TruncatedText', () => {
  it.each([
    ['Short text', 20, false],
    ['This is a medium length text', 10, true],
    [
      'This is a very long text that should definitely be truncated because it exceeds the maximum length',
      20,
      true,
    ],
  ])(
    'renders text "%s" with maxLength %i (should truncate: %s)',
    async (text, maxLength, shouldTruncate) => {
      render(<TruncatedText maxLength={maxLength}>{text}</TruncatedText>);

      if (shouldTruncate) {
        expect(screen.getByText('[...]')).toBeInTheDocument();
        await act(async () => {
          await fireEvent.mouseOver(screen.getByText('[...]'));
        });
        expect(screen.getByText(text)).toBeInTheDocument();
      } else {
        expect(screen.getByText(text)).toBeInTheDocument();
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
      <TruncatedText maxLength={20}>
        <div className={className}>{text}</div>
      </TruncatedText>
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
        <TruncatedText maxLength={20}>
          <div className={className}>{longText}</div>
        </TruncatedText>
      );
    });

    expect(screen.getByText('[...]')).toBeInTheDocument();
    const element = screen.getByText('This is a');
    expect(element).toHaveClass(...className.split(' '));
  });

  it('handles text with special characters', async () => {
    const textWithSpecialChars = 'Text with dots... and more text that should be truncated';
    render(<TruncatedText maxLength={20}>{textWithSpecialChars}</TruncatedText>);

    expect(screen.getByText('[...]')).toBeInTheDocument();
    await act(async () => {
      await fireEvent.mouseOver(screen.getByText('[...]'));
    });
    expect(screen.getByText(textWithSpecialChars)).toBeInTheDocument();
  });
});
