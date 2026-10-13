import React from 'react';
import { logoFrameClass, useTrimmedLogo } from '#V2/theme/logoFrame.js';

const ThemePreviewLogo = ({ siteLogo }: { siteLogo: string }) => {
  const src = useTrimmedLogo(siteLogo);
  return <img src={src} alt="" className={logoFrameClass('preview')} />;
};

export { ThemePreviewLogo };
