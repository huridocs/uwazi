import React, { type SVGProps } from 'react';
import { strokeSvg } from './strokeSvg.js';

const ChevronsUpDownIcon = (props: SVGProps<SVGSVGElement>) =>
  strokeSvg(
    <>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </>,
    props
  );

export { ChevronsUpDownIcon };
