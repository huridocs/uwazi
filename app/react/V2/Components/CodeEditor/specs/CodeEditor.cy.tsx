import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/CodeEditor.stories';

const { HTMLEditor, JSEditor } = composeStories(stories);

describe('Code editor', () => {
  it('should render the editor with existing HTML and the correct layout properties', () => {
    mount(<HTMLEditor />);
    cy.contains('<h1>Main Heading</h1>').should('exist');
    cy.get('div[role="code"]').should('exist');
    cy.get('div[dir="ltr"]').should('exist');
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

  it('should render the fallback element when an error occurs', () => {
    HTMLEditor.args.fallbackElement = (
      <textarea
        className="w-full h-full"
        data-test-id="fallback"
        value="<h1>Original HTML code</h1>"
      />
    );
    //@ts-ignore force monaco to fail
    HTMLEditor.args.intialValue = {};

    mount(<HTMLEditor />);

    cy.contains('<h1>Original HTML code</h1>').should('exist');
    cy.get('div[role="code"]').should('not.exist');
    cy.get('[data-test-id="fallback"]').should('exist');
  });
});
