import React, { MutableRefObject, useRef } from 'react';

export type SelectFileButtonProps = {
  onFileImported: (file: File) => any;
  children: any;
  id: string;
};

export const SelectFileButton = ({ onFileImported, children, id }: SelectFileButtonProps) => {
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
      <label htmlFor={id} style={{ display: 'none' }}>
        {id}
      </label>
      <input
        ref={fileInputRef}
        type="file"
        accept="text/csv"
        style={{ display: 'none' }}
        onChange={select}
        id={id}
      />
    </div>
  );
};
