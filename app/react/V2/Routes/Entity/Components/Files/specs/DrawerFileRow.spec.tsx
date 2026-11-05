/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DrawerFileRow } from '../DrawerFileRow.js';
import type { EntityFileRow } from '../types.js';

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  EntityWriteAuthorization: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('../FileThumbnail', () => ({
  FileThumbnail: () => <div data-testid="thumb" />,
}));

jest.mock('../ViewFileButton', () => ({
  ViewFileButton: ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      View
    </button>
  ),
}));

jest.mock('#V2/Components/UI/index.js', () => ({
  UwaziLoader: () => null,
  LanguageSelect: ({
    value,
    onChange,
    'aria-label': ariaLabel,
  }: {
    value: string;
    onChange: (value: string) => void;
    'aria-label'?: string;
  }) => (
    <select aria-label={ariaLabel} value={value} onChange={e => onChange(e.target.value)}>
      <option value="eng">EN</option>
      <option value="other">other</option>
    </select>
  ),
}));

const buildRow = (overrides: Partial<EntityFileRow> = {}): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'doc.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '1 KB',
  languageKey: 'EN',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  status: 'ready',
  raw: {
    _id: 'file-1',
    originalname: 'doc.pdf',
    filename: 'doc.pdf',
    fileType: 'document',
    mimetype: 'application/pdf',
    language: 'eng',
  },
  ...overrides,
});

describe('DrawerFileRow', () => {
  it('puts the language beside the size and does not repeat the type', () => {
    render(
      <DrawerFileRow
        row={buildRow()}
        editing={false}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={jest.fn()}
      />
    );
    expect(screen.getByText('1 KB · EN')).toBeInTheDocument();
    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });

  it('shows size only for a supporting file', () => {
    render(
      <DrawerFileRow
        row={buildRow({ category: 'supporting', languageKey: 'other' })}
        editing={false}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={jest.fn()}
      />
    );
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.queryByText(/other/)).not.toBeInTheDocument();
  });

  it('edits a primary name and language without the type', () => {
    render(
      <DrawerFileRow
        row={buildRow()}
        editing
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={jest.fn()}
      />
    );
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
  });

  it('edits a supporting file without a language selector or type', () => {
    render(
      <DrawerFileRow
        row={buildRow({ category: 'supporting', languageKey: 'other' })}
        editing
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={jest.fn()}
      />
    );
    expect(screen.queryByLabelText('Language')).not.toBeInTheDocument();
    expect(screen.queryByText('PDF')).not.toBeInTheDocument();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('downloads a file and hides download for a link', () => {
    const clicked: string[] = [];
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordClick(
      this: HTMLAnchorElement
    ) {
      clicked.push(this.getAttribute('href') ?? '');
    });
    const { rerender } = render(
      <DrawerFileRow
        row={buildRow()}
        editing={false}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Download doc.pdf' }));
    expect(clicked).toEqual(['/api/files/doc.pdf?download=true']);

    rerender(
      <DrawerFileRow
        row={buildRow({
          kind: 'link',
          displayName: 'Website',
          raw: {
            _id: 'file-1',
            originalname: 'Website',
            url: 'https://example.com',
            fileType: 'externalURL',
          },
        })}
        editing={false}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={jest.fn()}
      />
    );
    expect(screen.queryByRole('button', { name: /Download/ })).not.toBeInTheDocument();
  });

  it('disables view while the file is processing', () => {
    render(
      <DrawerFileRow
        row={buildRow({ status: 'processing' })}
        editing={false}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'View' })).toBeDisabled();
  });

  it('commits trimmed name and language when save is clicked', async () => {
    const onCommit = jest.fn().mockResolvedValue(undefined);
    render(
      <DrawerFileRow
        row={buildRow()}
        editing
        onView={jest.fn()}
        onEdit={jest.fn()}
        onCancelEdit={jest.fn()}
        onCommit={onCommit}
      />
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  renamed.pdf  ' } });
    fireEvent.click(screen.getByLabelText('Save'));

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalledWith({
        _id: 'file-1',
        originalname: 'renamed.pdf',
        language: 'eng',
      });
    });
  });
});
