import { Translate } from 'app/I18N';
import React, { useState } from 'react';

interface ImageViewerProps {
  key: string;
  className: string;
  src: string;
  alt: string;
}

const ImageViewer = (props: ImageViewerProps) => {
  const [errorFlag, setErrorFlag] = useState(false);

  if (errorFlag) {
    return (
      <div className="media-error">
        <Translate>This file type is not supported on image fields</Translate>
      </div>
    );
  }

  return (
    <img
      {...props}
      onError={() => {
        setErrorFlag(true);
      }}
    />
  );
};

export { ImageViewer, type ImageViewerProps };
