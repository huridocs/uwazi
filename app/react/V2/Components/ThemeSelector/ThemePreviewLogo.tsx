import React from 'react';
import { logoFrameClass } from '#V2/theme/logoFrame.js';

const ThemePreviewLogo = ({ siteLogo }: { siteLogo: string }) => (
  <img src={siteLogo} alt="" className={logoFrameClass('preview')} />
);

export { ThemePreviewLogo };
