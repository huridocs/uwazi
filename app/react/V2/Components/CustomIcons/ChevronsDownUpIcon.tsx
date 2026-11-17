import React, { type SVGProps } from 'react';
import { strokeSvg } from './strokeSvg.js';

const ChevronsDownUpIcon = (props: SVGProps<SVGSVGElement>) =>
  strokeSvg(
    <>
      <path d="m7 20 5-5 5 5" />
      <path d="m7 4 5 5 5-5" />
    </>,
    props
  );

export { ChevronsDownUpIcon };
