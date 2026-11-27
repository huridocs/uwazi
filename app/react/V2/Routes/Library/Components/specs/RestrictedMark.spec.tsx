/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RestrictedMark } from '../RestrictedMark.js';

const restricted = 'Restricted: only people it is shared with can see it';

describe('RestrictedMark', () => {
  it('names a padlock when the entity is restricted', () => {
    render(<RestrictedMark published={false} />);
    const mark = screen.getByTitle(restricted);
    const icon = mark.querySelector('svg');
    expect(icon).toHaveClass('h-[11px]', 'w-[11px]', 'text-ink-tertiary');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText(restricted)).toHaveClass('sr-only');
  });

  it('draws nothing when the entity is published', () => {
    const { container } = render(<RestrictedMark published />);
    expect(container).toBeEmptyDOMElement();
  });

  it('draws nothing when published is missing', () => {
    const { container } = render(<RestrictedMark />);
    expect(container).toBeEmptyDOMElement();
  });
});
