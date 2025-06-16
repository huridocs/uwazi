import { configureActions } from '@storybook/addon-actions';
import '../app/react/App/styles/globals.css';

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
}
