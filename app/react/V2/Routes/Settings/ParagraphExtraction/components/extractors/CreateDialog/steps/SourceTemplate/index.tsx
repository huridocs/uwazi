import React from 'react';
import { Body } from './Body';
import { Footer } from './Footer';
import { Translate } from 'app/I18N';

const SourceTemplateStep = {
  Body,
  Footer,
  title: () => <Translate>Source template</Translate>,
  description: () => <Translate>Select the template with the source documents.</Translate>,
};

export { SourceTemplateStep };
