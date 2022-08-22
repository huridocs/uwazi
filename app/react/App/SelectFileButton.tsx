import React, { MutableRefObject, useRef } from 'react';

export type SelectFileButtonProps = {
  onFileImported: (file: File) => any;
  children: any;
};

export const SelectFileButton = ({ onFileImported, children }: SelectFileButtonProps) => {
  // @ts-ignore
  const fileInputRef: MutableRefObject<HTMLInputElement> = useRef();

  const show = () => {
    if (fileInputRef.current !== null) {
      fileInputRef.current?.click();
    }
  };

  const select = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (file) {
      onFileImported(file);
    }
  };

  return (
    <div onClick={show} style={{ display: 'inline' }}>
      {children}
      <input
        ref={fileInputRef}
        type="file"
        accept="text/csv"
        style={{ display: 'none' }}
        onChange={select}
      />
    </div>
  );
};
