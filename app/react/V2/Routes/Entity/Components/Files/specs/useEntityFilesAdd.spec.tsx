/** @jest-environment jsdom */
import React, { useEffect } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useEntityFilesAdd } from '../useEntityFilesAdd.js';

const Probe = ({ mode }: { mode: 'main' | 'translation' }) => {
  const { requestAddFile, fileInputRef, handleFileInputChange, pendingAddFiles } =
    useEntityFilesAdd({
      entitySharedId: 'shared',
      refreshEntity: async () => undefined,
    });

  useEffect(() => {
    requestAddFile(mode);
  }, [mode, requestAddFile]);

  return (
    <div>
      <input aria-label="files" ref={fileInputRef} type="file" onChange={handleFileInputChange} />
      <ul>
        {pendingAddFiles.map(file => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
};

const choose = (files: { name: string; type: string }[]) => {
  fireEvent.change(screen.getByLabelText('files'), {
    target: {
      files: files.map(file => new File(['x'], file.name, { type: file.type })),
    },
  });
};

describe('useEntityFilesAdd', () => {
  it('keeps every file chosen in the dialog', () => {
    render(<Probe mode="main" />);
    expect(screen.getByLabelText('files')).toHaveProperty('multiple', true);
    choose([
      { name: 'a.pdf', type: 'application/pdf' },
      { name: 'b.txt', type: 'text/plain' },
    ]);
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
  });

  it('appends files chosen in a later dialog', () => {
    render(<Probe mode="main" />);
    choose([{ name: 'a.pdf', type: 'application/pdf' }]);
    choose([{ name: 'b.txt', type: 'text/plain' }]);
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
  });

  it('keeps only pdfs when adding a translation', () => {
    render(<Probe mode="translation" />);
    choose([
      { name: 'notes.txt', type: 'text/plain' },
      { name: 'brief.pdf', type: 'application/pdf' },
    ]);
    expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
    expect(screen.getByText('brief.pdf')).toBeInTheDocument();
  });
});
