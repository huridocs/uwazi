import React, { type SVGProps } from 'react';
import { strokeSvg } from './strokeSvg.js';

const Settings2StrokeIcon = (props: SVGProps<SVGSVGElement>) =>
  strokeSvg(
    <>
      <path d="M14 17H5" />
      <path d="M19 7h-9" />
      <circle cx="17" cy="17" r="3" />
      <circle cx="7" cy="7" r="3" />
    </>,
    props
  );

export { Settings2StrokeIcon };
