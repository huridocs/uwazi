import React, { type SVGProps } from 'react';
import { strokeSvg } from './strokeSvg.js';

const CloudUploadStrokeIcon = (props: SVGProps<SVGSVGElement>) =>
  strokeSvg(
    <>
      <path d="M12 13v8" />
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="m8 17 4-4 4 4" />
    </>,
    props
  );

export { CloudUploadStrokeIcon };
