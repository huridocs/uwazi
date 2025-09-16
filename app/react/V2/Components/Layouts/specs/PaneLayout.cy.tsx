import React from 'react';
import { BrowserRouter } from 'react-router';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { PaneLayout } from '../PaneLayout';

describe('PaneLayout', () => {
  const render = () => {
    mount(
      <div className="tw-content">
        <BrowserRouter></BrowserRouter>
      </div>
    );
  };

  describe('rendering', () => {
    it('should render two panes', () => {
      render();
    });

    it('should hide tab content if not visible by default', () => {});

    it('should allow unmounting tab content when not visible', () => {});
  });

  describe('resizing', () => {
    it('should be able to resize panes', () => {});
    it('panel should have a minimum size', () => {});
  });

  describe('mobile', () => {
    it('should render the first pane', () => {});

    it('should swipe between panes', () => {});
  });

  describe('accessibility', () => {
    it('should pass the accessibility check', () => {
      render();
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should be able to tab between panes', () => {});

    describe('mobile', () => {
      it('should pass the accessibility check', () => {
        render();
        cy.injectAxe();
        cy.checkA11y();
      });

      it('it should have hidden inputs to switch between panes', () => {});
    });
  });

  describe('snapshots', () => {
    it('should have the expected html on the layout elements', () => {});

    it('should have the expected html for mobile', () => {});
  });
});
