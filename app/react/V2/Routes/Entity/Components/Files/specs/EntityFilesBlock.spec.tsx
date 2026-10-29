/** @jest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { EntityFileRow, FileKind } from '../types.js';
import { EntityFilesBlock } from '../EntityFilesBlock.js';

const mockEntityFiles: { primaryRows: EntityFileRow[]; supportingRows: EntityFileRow[] } = {
  primaryRows: [],
  supportingRows: [],
};

jest.mock('../EntityFilesContext', () => ({
  useEntityFiles: () => mockEntityFiles,
}));

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

const fileRow = ({
  rowId,
  displayName,
  raw,
  kind,
  typeLabel = kind,
  sizeLabel = '—',
  languageKey = '—',
}: {
  rowId: string;
  displayName: string;
  raw: EntityFileRow['raw'];
  kind: FileKind;
  typeLabel?: string;
  sizeLabel?: string;
  languageKey?: string;
}): EntityFileRow => ({
  rowId,
  displayName,
  kind,
  typeLabel,
  sizeLabel,
  languageKey,
  modifiedLabel: '—',
  category:
    raw.fileType === 'mainDocument' || raw.fileType === 'document' ? 'primary' : 'supporting',
  fileType: raw.fileType,
  raw,
});

const attachment = (rowId: string, displayName: string, filename: string) =>
  fileRow({
    rowId,
    displayName,
    raw: { fileType: 'attachment', filename, mimetype: 'text/plain' },
    kind: 'document',
  });

const linkRow = (rowId: string, displayName: string, url: string) =>
  fileRow({ rowId, displayName, raw: { fileType: 'externalURL', url }, kind: 'link' });

const primary = (rowId: string, displayName: string, filename: string) =>
  fileRow({
    rowId,
    displayName,
    raw: { fileType: 'document', filename, mimetype: 'text/plain' },
    kind: 'document',
  });

const notesRow = () =>
  fileRow({
    rowId: 's1',
    displayName: 'Notes.txt',
    raw: { fileType: 'attachment', filename: 'notes.txt', mimetype: 'text/plain' },
    kind: 'document',
    typeLabel: 'PDF',
    sizeLabel: '12 KB',
    languageKey: 'English',
  });

const expectFilesHeading = () => {
  const heading = within(screen.getByTestId('entity-files')).getByRole('heading', {
    name: 'Files',
  });
  expect(heading.tagName).toBe('H3');
  expect(heading.className).toBe(
    'text-meta font-semibold uppercase tracking-wider text-ink-secondary'
  );
};

const expectNotesRow = () => {
  expect(screen.queryByText('Primary documents')).not.toBeInTheDocument();
  expect(screen.getByText('Supporting files')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();
  const view = screen.getByTitle('Notes.txt');
  expect(view.tagName).toBe('BUTTON');
  expect(view.querySelector('[dir="ltr"]')).toHaveTextContent('Notes');
  expect(view).toHaveTextContent('PDF · 12 KB · English');
  const download = screen.getByRole('button', { name: 'Download Notes.txt' });
  expect(download).not.toHaveTextContent('Download');
};

const buttonNamed = (root: HTMLElement, name: string) => {
  const match = within(root)
    .getAllByRole('button')
    .find(button => button.textContent?.trim() === name);
  if (!match) {
    throw new Error(`missing ${name}`);
  }
  return match;
};

describe('EntityFilesBlock', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockEntityFiles.primaryRows = [];
    mockEntityFiles.supportingRows = [];
    jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders nothing when there are no files', () => {
    render(<EntityFilesBlock />);
    expect(screen.queryByTestId('entity-files')).not.toBeInTheDocument();
  });

  it('labels supporting files when there is no primary document', () => {
    mockEntityFiles.supportingRows = [notesRow()];
    render(<EntityFilesBlock />);
    expectFilesHeading();
    expectNotesRow();
  });

  it('shows both group labels when primary and supporting files are present', () => {
    mockEntityFiles.primaryRows = [primary('p1', 'Main', 'main.txt')];
    mockEntityFiles.supportingRows = [attachment('s1', 'Extra', 'extra.txt')];
    render(<EntityFilesBlock />);
    expect(screen.getByText('Primary documents')).toBeInTheDocument();
    expect(screen.getByText('Supporting files')).toBeInTheDocument();
  });

  it('hides Download all for a single downloadable file and shows it for two', () => {
    mockEntityFiles.supportingRows = [attachment('s1', 'Only', 'only.txt')];
    const { rerender } = render(<EntityFilesBlock />);
    expect(document.querySelector('[data-part="download-all"]')).toBeNull();

    mockEntityFiles.supportingRows = [
      attachment('s1', 'Only', 'only.txt'),
      attachment('s2', 'Second', 'second.txt'),
    ];
    rerender(<EntityFilesBlock />);
    expect(document.querySelector('[data-part="download-all"]')).toBeInTheDocument();
  });

  describe('folding', () => {
    it('folds seven files to five until Show all', () => {
      mockEntityFiles.supportingRows = [1, 2, 3, 4, 5, 6, 7].map(index =>
        attachment(`s${index}`, `File ${index}`, `file-${index}.txt`)
      );
      render(<EntityFilesBlock />);
      expect(screen.getByText('File 5')).toBeInTheDocument();
      expect(screen.queryByText('File 6')).not.toBeInTheDocument();
      expect(screen.queryByText('File 7')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Show all 7 files' }));
      expect(screen.getByText('File 6')).toBeInTheDocument();
      expect(screen.getByText('File 7')).toBeInTheDocument();
    });

    it('keeps a supporting file visible when primary files fill the fold', () => {
      mockEntityFiles.primaryRows = [1, 2, 3, 4, 5, 6].map(index =>
        primary(`p${index}`, `Primary ${index}`, `primary-${index}.txt`)
      );
      mockEntityFiles.supportingRows = [attachment('s1', 'Extra.pdf', 'extra.pdf')];
      render(<EntityFilesBlock />);
      expect(screen.getByText('Supporting files')).toBeInTheDocument();
      expect(screen.getByText('Extra')).toBeInTheDocument();
      expect(screen.queryByText('Primary 6')).not.toBeInTheDocument();
    });

    it('does not fold six files', () => {
      mockEntityFiles.supportingRows = [1, 2, 3, 4, 5, 6].map(index =>
        attachment(`s${index}`, `File ${index}`, `file-${index}.txt`)
      );
      render(<EntityFilesBlock />);
      expect(screen.getByText('File 6')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
    });
  });

  it('does not download or preview a file that is still processing', () => {
    const processing = attachment('s1', 'Notes.txt', 'notes.txt');
    processing.status = 'processing';
    mockEntityFiles.supportingRows = [processing];
    render(<EntityFilesBlock />);
    expect(screen.queryByRole('button', { name: 'Download Notes.txt' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Notes'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a preview modal from the file name', () => {
    mockEntityFiles.supportingRows = [attachment('s1', 'Notes.txt', 'notes.txt')];
    render(<EntityFilesBlock />);
    const notes = screen.getByTitle('Notes.txt');
    expect(notes).not.toHaveTextContent('—');
    fireEvent.click(notes);
    const dialog = screen.getByRole('dialog');
    expect(buttonNamed(dialog, 'Close')).toHaveClass('bg-warm');
    expect(buttonNamed(dialog, 'Download')).toHaveClass('bg-warm');
  });

  it('opens a link in a new window and does not show a download control', () => {
    mockEntityFiles.supportingRows = [linkRow('l1', 'Website', 'https://example.com/doc')];
    render(<EntityFilesBlock />);
    expect(screen.queryByRole('button', { name: /Download/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Website/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.open).toHaveBeenCalledWith(
      'https://example.com/doc',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('downloads each file url and skips links', () => {
    mockEntityFiles.primaryRows = [primary('p1', 'Main', 'main.txt')];
    mockEntityFiles.supportingRows = [
      attachment('s1', 'Extra', 'extra.txt'),
      linkRow('l1', 'Website', 'https://example.com/doc'),
    ];
    const clicked: string[] = [];
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordClick(
      this: HTMLAnchorElement
    ) {
      clicked.push(this.getAttribute('href') ?? '');
    });
    render(<EntityFilesBlock />);
    const downloadAll = document.querySelector('[data-part="download-all"]');
    if (!(downloadAll instanceof HTMLButtonElement)) {
      throw new Error('expected download all');
    }
    fireEvent.click(downloadAll);
    expect(clicked).toEqual([
      '/api/files/main.txt?download=true',
      '/api/files/extra.txt?download=true',
    ]);
  });
});
