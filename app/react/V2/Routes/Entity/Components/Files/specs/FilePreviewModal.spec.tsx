/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { isMobileOverrideAtom } from '#V2/atoms/isMobileAtom.js';
import { PaneLayoutMobile } from '#V2/Components/Layouts/PaneLayout/PaneLayoutMobile.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { FilePreviewModal } from '../FilePreviewModal.js';
import type { EntityFileRow } from '../types.js';

jest.mock('#app/I18N/index.js', () => ({
  Translate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  t: (_ctx: string, key: string) => key,
}));

jest.mock('#V2/Routes/Entity/Components/Files/FilePreviewView.js', () => ({
  FilePreviewView: () => null,
}));

jest.mock('#V2/Routes/Entity/Tabs/footers/FileDownloadButton.js', () => ({
  FileDownloadButton: () => null,
  fileDownloadUrl: () => '',
}));

const buildRow = (overrides: Partial<EntityFileRow> = {}): EntityFileRow => ({
  rowId: 'f1',
  displayName: 'Velasquez-Rodriguez_v_Honduras_Judgment_1988.pdf',
  kind: 'pdf',
  typeLabel: 'PDF',
  sizeLabel: '213 KB',
  languageKey: 'English',
  modifiedLabel: '—',
  category: 'primary',
  fileType: 'document',
  status: 'ready',
  raw: {
    _id: 'file-1',
    originalname: 'Velasquez-Rodriguez_v_Honduras_Judgment_1988.pdf',
    filename: 'doc.pdf',
    fileType: 'document',
    mimetype: 'application/pdf',
    language: 'eng',
  },
  ...overrides,
});

const renderPreview = (ui: React.ReactElement, mobile = false) =>
  render(
    <TestAtomStoreProvider initialValues={[[isMobileOverrideAtom, mobile]]}>
      {ui}
    </TestAtomStoreProvider>
  );

const stackedPreview = () => {
  const onClose = jest.fn();
  renderPreview(
    <>
      <PaneLayoutMobile requestedPane={{ index: 1, id: 1 }}>
        <div key="main">Main</div>
        <div key="side">Entity</div>
      </PaneLayoutMobile>
      <FilePreviewModal row={buildRow()} onClose={onClose} />
    </>,
    true
  );
  const sheets = screen.getAllByRole('dialog');
  const preview = sheets.find(sheet => sheet.textContent?.includes('Velasquez'));
  const entity = sheets.find(sheet => sheet.textContent?.includes('Entity'));
  const backdrop = preview?.previousElementSibling;
  if (!preview || !entity || !(backdrop instanceof HTMLElement)) {
    throw new Error('expected stacked sheets');
  }
  return { onClose, preview, entity, backdrop };
};

describe('FilePreviewModal', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('shows the name with type, size, and language for a primary document', () => {
    renderPreview(<FilePreviewModal row={buildRow()} onClose={jest.fn()} />);
    expect(
      screen.getByRole('heading', { name: 'Velasquez-Rodriguez_v_Honduras_Judgment_1988' })
    ).toBeInTheDocument();
    expect(screen.getByText('PDF · 213 KB · English')).toBeInTheDocument();
  });

  it('stacks above the open sheet and a tap outside closes only the preview', () => {
    const { onClose, preview, entity, backdrop } = stackedPreview();
    expect(Number(preview.getAttribute('data-layer'))).toBeGreaterThan(
      Number(entity.getAttribute('data-layer'))
    );
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Entity')).toBeInTheDocument();
  });

  it('shows type and size without a language for a supporting file', () => {
    renderPreview(
      <FilePreviewModal
        row={buildRow({
          displayName: 'g2505275.pdf',
          category: 'supporting',
          sizeLabel: '171 KB',
          languageKey: 'other',
          raw: {
            _id: 'file-2',
            originalname: 'g2505275.pdf',
            filename: 'g.pdf',
            fileType: 'attachment',
            mimetype: 'application/pdf',
            language: 'other',
          },
        })}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: 'g2505275' })).toBeInTheDocument();
    expect(screen.getByText('PDF · 171 KB')).toBeInTheDocument();
    expect(screen.queryByText(/other/)).not.toBeInTheDocument();
  });
});
