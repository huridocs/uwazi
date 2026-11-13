/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewClamp } from '../PreviewClamp.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PreviewClamp', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows Show more under overflowing content, then Show less', async () => {
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(200);
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    const user = userEvent.setup();
    render(
      <PreviewClamp>
        <p>long established fact</p>
      </PreviewClamp>
    );

    expect(screen.getByText('long established fact').closest('.max-h-24')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
    expect(screen.getByText('long established fact').closest('.max-h-24')).toBeNull();
  });

  it('shows Show more when the content overflows sideways', () => {
    jest.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(40);
    jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    jest.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(400);
    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(80);
    render(
      <PreviewClamp>
        <p>wide line</p>
      </PreviewClamp>
    );

    expect(screen.getByRole('button', { name: 'Show more' })).toBeInTheDocument();
  });
});
