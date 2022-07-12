import { Translate } from 'app/I18N';
import React, { useRef } from 'react';

const handlePDFUpload = (event: React.FormEvent<HTMLInputElement>) => {
  const { files } = event.target as HTMLInputElement;
  if (files && files.length > 0) {
    const data = { data: URL.createObjectURL(files[0]), originalFile: files[0] };
    console.log(data);
  }
};

const PDFUpload = () => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadButtonClicked = () => {
    inputFileRef.current?.click();
  };

  return (
    <>
      <h2>
        <Translate>Primary Documents</Translate>
      </h2>
      <button type="button" onClick={handleUploadButtonClicked}>
        Upload PDF
      </button>
      <input
        aria-label="pdfInput"
        type="file"
        onChange={handlePDFUpload}
        style={{ display: 'none' }}
        ref={inputFileRef}
        accept="application/pdf"
      />
    </>
  );
};

export { PDFUpload };
