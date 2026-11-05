import React, { type SVGProps } from 'react';
import { strokeSvg } from './strokeSvg.js';

const FileTextStrokeIcon = (props: SVGProps<SVGSVGElement>) =>
  strokeSvg(
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>,
    props
  );

export { FileTextStrokeIcon };
