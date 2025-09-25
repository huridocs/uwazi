import React from 'react';
import { Body } from './Body';
import { Footer } from './Footer';

import { Translate } from '#app/I18N/index.js';

const ExtractionConfigurationStep = {
  Body,
  Footer,
  title: () => <Translate>Extraction configuration</Translate>,
  description: () => '',
};

export { ExtractionConfigurationStep };
