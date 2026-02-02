import React from 'react';
import { Body } from './Body.js';
import { Footer } from './Footer.js';
import { Translate } from '#app/I18N/index.js';

const TargetTemplateStep = {
  Body,
  Footer,
  title: () => <Translate>Target template</Translate>,
  description: () => <Translate>Select the template to store the extracted paragraphs.</Translate>,
};

export { TargetTemplateStep };
