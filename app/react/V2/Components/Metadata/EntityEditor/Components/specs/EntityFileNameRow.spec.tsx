/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { notify } from '#V2/utils/notifyBridge.js';
import { EntityFileNameRow } from '../EntityFileNameRow.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => children,
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/utils/notifyBridge.js', () => ({
  notify: jest.fn(),
}));

describe('EntityFileNameRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('notifies an error when rename rejects', async () => {
    const onRename = jest.fn().mockRejectedValue(new Error('rename failed'));

    render(
      <EntityFileNameRow
        id="file-1"
        originalname="report.pdf"
        disabled={false}
        onRename={onRename}
      />
    );

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    fireEvent.change(nameInput, { target: { value: 'renamed.pdf' } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('An error occurred', 'error');
    });
  });

  it('notifies an error when remove rejects', async () => {
    const onRemove = jest.fn().mockRejectedValue(new Error('remove failed'));

    render(
      <EntityFileNameRow
        id="file-1"
        originalname="report.pdf"
        disabled={false}
        onRename={jest.fn().mockResolvedValue(undefined)}
        onRemove={onRemove}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove file' }));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('An error occurred', 'error');
    });
  });
});
