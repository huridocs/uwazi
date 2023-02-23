import { setGlobalConfig } from '@storybook/testing-react';
import * as sbPreview from '../../.storybook/preview';
import '../../app/react/App/styles/globals.css';

import './commands';
import './component';

setGlobalConfig(sbPreview);

cy.configureCypressTestingLibrary();
