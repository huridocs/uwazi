/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Image } from '../Image.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

describe('Image', () => {
  it('retries the new src after a previous image failed to load', () => {
    const { rerender } = render(
      <Image values={[{ value: '/api/files/en.png', alt: 'en' }]} imageStyle="contain" />
    );

    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Error loading your image')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    rerender(<Image values={[{ value: '/api/files/es.png', alt: 'es' }]} imageStyle="contain" />);

    expect(screen.queryByText('Error loading your image')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/api/files/es.png');
  });
});
