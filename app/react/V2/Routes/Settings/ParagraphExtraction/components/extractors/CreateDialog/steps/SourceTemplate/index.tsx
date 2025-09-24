import React from 'react';
import { Body } from './Body';
import { Footer } from './Footer';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';

const SourceTemplateStep = {
  Body,
  Footer,
  title: () => <Translate>Source template</Translate>,
  description: () => <Translate>Select the template with the source documents.</Translate>,
};

export { SourceTemplateStep };
