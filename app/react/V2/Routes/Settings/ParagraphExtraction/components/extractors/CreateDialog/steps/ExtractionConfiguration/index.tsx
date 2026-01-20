import React from 'react';
import { Body } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/ExtractionConfiguration/Body.jsx';
import { Footer } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/ExtractionConfiguration/Footer.jsx';

import { Translate } from '#app/I18N/index.js';

const ExtractionConfigurationStep = {
  Body,
  Footer,
  title: () => <Translate>Extraction configuration</Translate>,
  description: () => '',
};

export { ExtractionConfigurationStep };
