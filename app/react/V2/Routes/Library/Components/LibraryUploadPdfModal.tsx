import React, { useRef, useState } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { Button, DashedUploadDropzone, Modal } from '#V2/Components/UI/index.js';
import { FileUploadProgressLine } from '#V2/Routes/Entity/Components/Files/FileUploadProgressLine.js';
import { uploadPdfsAndCreateEntities } from './libraryUploadPdf.js';

type LibraryUploadPdfModalProps = {
  onClose: () => void;
  onUploaded: (sharedId?: string) => void;
};

const isPdf = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const addPdfFiles = (current: File[], incoming: File[]) => {
  const names = new Set(current.map(file => `${file.name}:${file.size}`));
  return [
    ...current,
    ...incoming.filter(file => isPdf(file) && !names.has(`${file.name}:${file.size}`)),
  ];
};

const LibraryUploadPdfModal = ({ onClose, onUploaded }: LibraryUploadPdfModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ name: string; percent: number }>();
  const [error, setError] = useState<string>();

  const addFiles = (list: FileList | File[] | undefined) => {
    if (!list) return;
    setFiles(current => addPdfFiles(current, Array.from(list)));
  };

  const upload = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const created = await uploadPdfsAndCreateEntities(
        files,
        (percent, name) => setProgress({ name, percent }),
        () => undefined
      );
      onUploaded(created.at(-1)?.sharedId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setBusy(false);
    }
  };

  return (
    <Modal size="lg" ariaLabel={t('System', 'Upload PDF', null, false)}>
      <Modal.Header>
        <Translate className="text-md font-bold">Upload PDF</Translate>
        <Modal.CloseButton onClick={onClose} disabled={busy} />
      </Modal.Header>
      <Modal.Body className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="sr-only"
          aria-label={t('System', 'Choose PDF files', null, false)}
          onChange={event => {
            addFiles(event.target.files ?? undefined);
            event.target.value = '';
          }}
        />
        <DashedUploadDropzone
          disabled={busy}
          onPick={() => inputRef.current?.click()}
          onDropFile={file => addFiles(file ? [file] : undefined)}
          title={<Translate>Click to select files</Translate>}
          subtitle={<Translate>or drag and drop PDF files here</Translate>}
        />
        {files.length ? (
          <ul className="space-y-2">
            {files.map(file => (
              <li key={`${file.name}:${file.size}`} className="text-xs text-ink-secondary">
                {file.name}
                {progress?.name === file.name ? (
                  <div className="mt-1">
                    <FileUploadProgressLine progress={progress.percent} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="warm" onClick={onClose} disabled={busy}>
          <Translate>Cancel</Translate>
        </Button>
        <Button
          type="button"
          variant="success"
          onClick={() => void upload()}
          disabled={busy || !files.length}
        >
          <Translate>Upload</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export type { LibraryUploadPdfModalProps };
export { LibraryUploadPdfModal };
