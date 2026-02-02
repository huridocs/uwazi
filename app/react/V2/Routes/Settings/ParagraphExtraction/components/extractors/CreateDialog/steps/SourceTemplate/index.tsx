import React from 'react';
import { Body } from './Body.js';
import { Footer } from './Footer.js';
import { Translate } from '#app/I18N/index.js';

const SourceTemplateStep = {
  Body,
  Footer,
  title: () => <Translate>Source template</Translate>,
  description: () => <Translate>Select the template with the source documents.</Translate>,
};

export { SourceTemplateStep };
