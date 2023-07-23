import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/PDF.stories';

const { Basic } = composeStories(stories);

describe('MultiSelect', () => {
  describe('Rendering', () => {
    it('should render the PDF file', () => {
      mount(<Basic fileUrl="app/react/stories/assets/sample.pdf" />);
    });
  });
});
