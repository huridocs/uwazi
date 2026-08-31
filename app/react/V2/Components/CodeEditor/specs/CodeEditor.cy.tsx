import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import * as stories from '#app/stories/CodeEditor.stories.js';

const { HTMLEditor, JSEditor } = stories;

class NoopWorker extends EventTarget implements Worker {
  onerror: AbstractWorker['onerror'] = null;

  onmessage: Worker['onmessage'] = null;

  onmessageerror: Worker['onmessageerror'] = null;

  constructor(_scriptURL: string | URL, _options?: WorkerOptions) {
    super();
  }

  postMessage(
    _message: unknown,
    _transferOrOptions?: Transferable[] | StructuredSerializeOptions
  ) {}

  terminate() {}
}

describe('Code editor', () => {
  beforeEach(() => {
    cy.window().then(win => {
      win.Worker = NoopWorker;
    });
  });

  it('should render the editor with existing HTML and the correct layout properties', () => {
    mount(<HTMLEditor.Component />);
    cy.contains('<h1>Main Heading</h1>').should('exist');
    cy.get('div[role="code"]').should('exist');
    cy.get('div[dir="ltr"]').should('exist');
  });

  it('should be able to edit', () => {
    mount(<HTMLEditor.Component />);
    cy.get('div[role="code"]').should('exist');
    cy.get('div[dir="ltr"]').should('exist');
    cy.contains('<h1>Main Heading</h1>').should('exist');
    cy.get('div[dir="ltr"]').click();
    cy.get('body').type('{ctrl}a');
    cy.get('body').type('{del}');
    cy.contains('<h1>Main Heading</h1>').should('not.exist');
  });

  it('should mount an empty editor if there is no code', () => {
    JSEditor.composed.args.intialValue = undefined;
    mount(<JSEditor.Component />);
    cy.get('.view-lines').children().should('have.length', 1);
  });

  it('should get the updated code when clicking the save button', () => {
    HTMLEditor.composed.args.intialValue = '<h1>Original HTML code</h1>';
    mount(<HTMLEditor.Component />);

    cy.get('[role="code"]').should('exist');
    cy.contains('button', 'Save').click();
    cy.contains('pre', '<h1>Original HTML code</h1>').should('exist');
    cy.window().then(win => {
      (win as { __codeEditor?: { setValue: (v: string) => void } }).__codeEditor?.setValue(
        '<h1>My new code</h1>'
      );
    });
    cy.contains('button', 'Save').click();
    cy.contains('pre', '<h1>My new code</h1>').should('exist');
  });

  it('should render the fallback element when an error occurs', () => {
    HTMLEditor.composed.args.fallbackElement = (
      <textarea
        className="w-full h-full"
        data-test-id="fallback"
        value="<h1>Original HTML code</h1>"
        onChange={() => {}}
      />
    );
    //@ts-ignore force monaco to fail
    HTMLEditor.composed.args.intialValue = {};

    mount(<HTMLEditor.Component />);

    cy.contains('<h1>Original HTML code</h1>').should('exist');
    cy.get('div[role="code"]').should('not.exist');
    cy.get('[data-test-id="fallback"]').should('exist');
  });
});
