import React from 'react';
import { configureActions } from 'storybook/actions';
import '../app/react/App/styles/tailwind.css';

configureActions({
  depth: 100,
  limit: 20,
});

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [
  Story =>
    React.createElement(
      'div',
      { id: 'tw-container', className: 'tw-content' },
      React.createElement(Story)
    ),
];

export const tags = ['autodocs'];
