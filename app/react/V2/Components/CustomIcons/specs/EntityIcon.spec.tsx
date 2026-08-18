/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EntityIcon } from '../EntityIcon.js';

jest.mock('#UI/Icon/Icon.js', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="fa-icon">{icon}</span>,
}));

describe('EntityIcon', () => {
  it('renders a country flag when type is Flags', () => {
    render(<EntityIcon data={{ _id: 'USA', type: 'Flags', label: 'United States' }} />);
    expect(screen.getByRole('img', { name: 'United States' })).toBeInTheDocument();
  });

  it('renders a font icon when type is Icons', () => {
    render(<EntityIcon data={{ _id: 'star', type: 'Icons', label: 'Star' }} />);
    expect(screen.getByTestId('fa-icon')).toHaveTextContent('star');
  });

  it('renders nothing when type is Empty', () => {
    const { container } = render(<EntityIcon data={{ _id: 'USA', type: 'Empty' }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('infers a flag when type is omitted and hasCountryFlag matches', () => {
    render(<EntityIcon data={{ _id: 'USA', label: 'United States' }} />);
    expect(screen.getByRole('img', { name: 'United States' })).toBeInTheDocument();
  });

  it('renders a font icon when type is omitted and id is not a country flag', () => {
    render(<EntityIcon data={{ _id: 'star' }} />);
    expect(screen.getByTestId('fa-icon')).toHaveTextContent('star');
  });
});
