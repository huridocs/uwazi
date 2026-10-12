import React from 'react';
import { useTrimmedLogo, useLogoFrame } from '#V2/theme/logoFrame.js';

const ThemePreviewLogo = ({ siteLogo }: { siteLogo: string }) => {
  const src = useTrimmedLogo(siteLogo);
  const logo = useLogoFrame(src, 'preview');
  return <img src={src} alt="" className={logo.className} />;
};

export { ThemePreviewLogo };
