import React, { type SVGProps } from 'react';
import { strokeSvg } from './strokeSvg.js';

const PlusStrokeIcon = (props: SVGProps<SVGSVGElement>) =>
  strokeSvg(
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>,
    props
  );

export { PlusStrokeIcon };
