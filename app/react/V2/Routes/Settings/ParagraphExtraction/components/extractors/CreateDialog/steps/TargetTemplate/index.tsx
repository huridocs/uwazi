import React from 'react';
import { Body } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/TargetTemplate/Body.js';
import { Footer } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/TargetTemplate/Footer.js';

import { Translate } from '#app/I18N/index.js';

const TargetTemplateStep = {
  Body,
  Footer,
  title: () => <Translate>Target template</Translate>,
  description: () => <Translate>Select the template to store the extracted paragraphs.</Translate>,
};

export { TargetTemplateStep };
