import '@4tw/cypress-drag-drop';
import 'cypress-real-events';
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.on('window:before:load', window => {
  window.document.head.insertAdjacentHTML(
    'beforeend',
    `
    <style>
      /* Disable CSS transitions. */
      *, *::before, *::after {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        transition: none !important;
      }
      /* Disable CSS animations. */
      *, *::before, *::after {
        -webkit-animation: none !important;
        -moz-animation: none !important;
        -o-animation: none !important;
        animation: none !important;
      }
      #nprogress {
        visibility: hidden !important;
      }
      </style>
  `
  );
});

function getTextNode(el, match) {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  if (!match) {
    return walk.nextNode();
  }
  let node;
  while ((node = walk.nextNode())) {
    if (node.wholeText.includes(match)) {
      return node;
    }
  }
}

function setBaseAndExtent(...args) {
  const document = args[0].ownerDocument;
  document.getSelection().removeAllRanges();
  document.getSelection().setBaseAndExtent(...args);
}

Cypress.Commands.add('selection', { prevSubject: true }, (subject, fn) => {
  // eslint-disable-next-line cypress/unsafe-to-chain-command
  cy.wrap(subject).trigger('mousedown').then(fn).trigger('mouseup');

  cy.document().trigger('selectionchange');
  return cy.wrap(subject);
});

Cypress.Commands.add('setSelection', { prevSubject: true }, (subject, query, endQuery) =>
  cy.wrap(subject).selection($el => {
    if (typeof query === 'string') {
      const anchorNode = getTextNode($el[0], query);
      const focusNode = endQuery ? getTextNode($el[0], endQuery) : anchorNode;
      const anchorOffset = anchorNode.wholeText.indexOf(query);
      const focusOffset = endQuery
        ? focusNode.wholeText.indexOf(endQuery) + endQuery.length
        : anchorOffset + query.length;
      setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    } else if (typeof query === 'object') {
      const el = $el[0];
      const anchorNode = getTextNode(el.querySelector(query.anchorQuery));
      const anchorOffset = query.anchorOffset || 0;
      const focusNode = query.focusQuery
        ? getTextNode(el.querySelector(query.focusQuery))
        : anchorNode;
      const focusOffset = query.focusOffset || 0;
      setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
    }
  })
);

//Sourced from https://github.com/cypress-io/cypress/discussions/21150#discussioncomment-2620947
Cypress.Commands.add(
  'shouldNotBeActionable',
  { prevSubject: 'element' },
  (subject, done, { position, timeout = 100, ...clickOptions } = {}) => {
    cy.once('fail', err => {
      expect(err.message).to.include('`cy.click()` failed because this element');
      expect(err.message).to.include('is being covered by another element');
      done();
    });

    const chainable = position
      ? cy.wrap(subject).click(position, { timeout, ...clickOptions })
      : cy.wrap(subject).click({ timeout, ...clickOptions });

    chainable.then(() =>
      done(new Error('Expected element NOT to be clickable, but click() succeeded'))
    );
  }
);

Cypress.on('window:before:load', window => {
  window.document.head.insertAdjacentHTML(
    'beforeend',
    `
    <style>
      /* Disable CSS transitions. */
      *, *::before, *::after { -webkit-transition: none !important; -moz-transition: none !important; -o-transition: none
         !important; transition: none !important; }
      /* Disable CSS animations. */
      *, *::before, *::after { -webkit-animation: none !important; -moz-animation: none !important; -o-animation: none 
        !important; animation: none !important; }
    </style>
  `
  );
});

Cypress.Commands.add('clearAndType', (selector, value) => {
  cy.get(selector).clear();
  cy.get(selector).type(value);
});

// eslint-disable-next-line prefer-arrow-callback
Cypress.Commands.addQuery('getByTestId', function getByTestId(id) {
  const getFn = cy.now('get', `[data-testid="${id}"]`);
  return subject => getFn(subject);
});

Cypress.Commands.add('addTimeLink', (duration, label, index = 0) => {
  cy.get('.timelinks-form').scrollIntoView();
  cy.get('video', { timeout: 2000 }).then(async $video => {
    await $video[0].play();
  });
  cy.get('video')
    .wait(duration)
    .then(async $video => {
      $video[0].pause();
    });

  cy.contains('button', 'Add timelink').should('be.visible').click();
  const timeLinkSelector = `input[name="timelines.${index}.label"`;
  cy.get(timeLinkSelector).type(label);
});

export {};
