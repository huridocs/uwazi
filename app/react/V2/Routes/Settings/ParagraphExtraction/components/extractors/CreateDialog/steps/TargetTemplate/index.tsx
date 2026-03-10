import React from 'react';
import { Body } from './Body';
import { Footer } from './Footer';
import { Translate } from 'app/I18N';

const TargetTemplateStep = {
  Body,
  Footer,
  title: () => <Translate>Target template</Translate>,
  description: () => <Translate>Select the template to store the extracted paragraphs.</Translate>,
};

export { TargetTemplateStep };
