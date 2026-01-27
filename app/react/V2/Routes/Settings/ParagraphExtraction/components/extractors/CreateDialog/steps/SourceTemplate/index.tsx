import React from 'react';
import { Body } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/SourceTemplate/Body.js';
import { Footer } from '#V2/Routes/Settings/ParagraphExtraction/components/extractors/CreateDialog/steps/SourceTemplate/Footer.js';

import { Translate } from '#app/I18N/index.js';

const SourceTemplateStep = {
  Body,
  Footer,
  title: () => <Translate>Source template</Translate>,
  description: () => <Translate>Select the template with the source documents.</Translate>,
};

export { SourceTemplateStep };
