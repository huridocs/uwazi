import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/CodeEditor.stories';

const { HTMLEditor, JSEditor } = composeStories(stories);

describe('Code editor', () => {
  it('should render the editor with existing HTML', () => {
    mount(<HTMLEditor />);
    cy.contains('<h1>Main Heading</h1>').should('exist');
    cy.get('.view-lines').children().should('have.length', 21);
  });

  it('should be able to edit', () => {
    mount(<HTMLEditor />);
    cy.contains('<p>Subtitle or tagline goes here</p>').then(element => {
      cy.wrap(element).click();
      cy.wrap(element).focused().type('{ctrl}a');
      cy.wrap(element).focused().type('{del}');
    });

    cy.contains('<h1>Main Heading</h1>').should('not.exist');
  });

  it('should mount an empty editor if there is no code', () => {
    JSEditor.args.intialValue = undefined;
    mount(<JSEditor />);
    cy.get('.view-lines').children().should('have.length', 1);
  });

  it('should get the updated code when clicking the save button', () => {
    HTMLEditor.args.intialValue = '<h1>Original HTML code</h1>';
    mount(<HTMLEditor />);

    cy.get('[role="code"]').then(() => {
      cy.contains('button', 'Save').click();
      cy.contains('pre', '<h1>Original HTML code</h1>').should('exist');
      cy.contains('<h1>Original HTML code</h1>').then(element => {
        cy.wrap(element).click();
        cy.wrap(element).focused().type('{ctrl}a');
        cy.wrap(element).focused().type('{del}');
        cy.wrap(element).focused().type('<h1>My new code</h1>');
      });
    });

    cy.contains('button', 'Save').click();
    cy.contains('pre', '<h1>My new code</h1>').should('exist');
  });
});
