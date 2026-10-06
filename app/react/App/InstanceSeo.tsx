import React from 'react';
import { useAtomValue } from 'jotai';
import { Helmet } from 'react-helmet';
import { requestOriginAtom, settingsAtom } from '#V2/atoms/index.js';
import { getInstanceSeoMeta } from './instanceSeo.js';

const getBrowserOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '');

const InstanceSeo = () => {
  const settings = useAtomValue(settingsAtom);
  const requestOrigin = useAtomValue(requestOriginAtom);
  const { defaultTitle, titleTemplate, meta } = getInstanceSeoMeta(
    settings,
    requestOrigin || getBrowserOrigin()
  );

  return <Helmet defaultTitle={defaultTitle} titleTemplate={titleTemplate} meta={meta} />;
};

export { InstanceSeo };
