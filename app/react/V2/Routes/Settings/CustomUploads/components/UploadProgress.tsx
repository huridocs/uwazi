import React from 'react';
import { Translate } from 'app/I18N';
import { useAtomValue } from 'jotai';
import { uploadProgressAtom } from './uploadProgressAtom';

type UploadProgressProps = {
  queueLength: number;
};

const UploadProgress = ({ queueLength }: UploadProgressProps) => {
  const { filename, progress } = useAtomValue(uploadProgressAtom);

  return filename ? (
    <div className="flex grow">
      <Translate>Uploading</Translate>...&nbsp;
      <span className="font-semibold">{filename}</span>&nbsp;
      {progress}%&nbsp;
      <span className="flex flex-nowrap before:content-['('] after:content-[')']">
        {queueLength + 1}&nbsp;
        <Translate>remaining files</Translate>
      </span>
    </div>
  ) : (
    <div />
  );
};

export { UploadProgress };
