/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { FilesToolbar, foldFilesActionBar } from '../FilesToolbar.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  EntityWriteAuthorization: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const props = {
  totalCount: 2,
  selectedCount: 2,
  downloadCount: 2,
  onAddFile: jest.fn(),
  onSelectAll: jest.fn(),
  onDeselectAll: jest.fn(),
  onDeleteSelected: jest.fn(),
  onDownloadSelected: jest.fn(),
};

describe('foldFilesActionBar', () => {
  it('folds only a measured bar narrower than 480', () => {
    expect(foldFilesActionBar(0)).toBe(false);
    expect(foldFilesActionBar(479)).toBe(true);
    expect(foldFilesActionBar(480)).toBe(false);
  });
});

const expectFoldedSelection = () => {
  expect(screen.getByRole('button', { name: 'Deselect all' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Select all' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Download 2 files' }));
  expect(props.onDownloadSelected).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Delete 2 files' })).toBeInTheDocument();
  expect(screen.getByText('2 of 2')).toBeInTheDocument();
};

const renderToolbar = (width: number, showBulkActions = true) => {
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  render(
    <FilesToolbar
      totalCount={props.totalCount}
      selectedCount={props.selectedCount}
      downloadCount={props.downloadCount}
      showBulkActions={showBulkActions}
      onAddFile={props.onAddFile}
      onSelectAll={props.onSelectAll}
      onDeselectAll={props.onDeselectAll}
      onDeleteSelected={props.onDeleteSelected}
      onDownloadSelected={props.onDownloadSelected}
    />
  );
};

describe('FilesToolbar', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows labeled download and delete when the bar is wide', () => {
    renderToolbar(640);
    fireEvent.click(screen.getByRole('button', { name: 'Download 2' }));
    expect(props.onDownloadSelected).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Add file/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select all' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deselect all' })).toBeInTheDocument();
  });

  it('shows add and select controls without the selection count or bulk actions', () => {
    renderToolbar(640, false);
    expect(screen.queryByRole('button', { name: 'Download 2' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Selected/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add file/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Select all' })).toBeInTheDocument();
  });

  it('folds add, select, download and delete to icons when the bar is narrow', () => {
    renderToolbar(400);
    expect(screen.queryByText('Add file')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add file' }));
    expect(props.onAddFile).toHaveBeenCalled();
    expectFoldedSelection();
  });
});
