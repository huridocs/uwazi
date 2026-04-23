import '@4tw/cypress-drag-drop';
import 'cypress-real-events';
import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command';
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
  cy.wrap(subject).trigger('mousedown', { button: 0 }).then(fn).trigger('mouseup', { button: 0 });
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

Cypress.Commands.add('clearAndType', (selector, value, options) => {
  cy.get(selector).clear(options);
  cy.get(selector).type(value, options);
});

// eslint-disable-next-line prefer-arrow-callback
Cypress.Commands.addQuery('getByTestId', function getByTestId(id) {
  const getFn = cy.now('get', `[data-testid="${id}"]`);
  return subject => getFn(subject);
});

Cypress.Commands.add('addTimeLink', (duration, label, index = 0, seconds = -1, minutes = -1) => {
  cy.get('.timelinks-form').scrollIntoView();
  let hasVideoElement = false;
  cy.get('body').then($body => {
    hasVideoElement = $body.find('video').length > 0;
  });
  cy.then(() => {
    if (hasVideoElement) {
      cy.get('video', { timeout: 2000 }).then(async $video => {
        await $video[0].play();
      });
      cy.get('video')
        .wait(duration)
        .then(async $video => {
          $video[0].pause();
        });
    }
  });

  cy.contains('button', 'Add timelink').should('be.visible');
  cy.contains('button', 'Add timelink').click();
  cy.get('input[name^="timelines."][name$=".label"]').then($inputs => {
    const availableIndexes = [...$inputs]
      .map(input => {
        const match = input.getAttribute('name')?.match(/^timelines\.(\d+)\.label$/);
        return match ? Number(match[1]) : null;
      })
      .filter(current => current !== null);
    const targetIndex =
      availableIndexes.includes(index) && availableIndexes.length
        ? index
        : (availableIndexes.at(-1) ?? 0);
    if (seconds !== -1) {
      cy.clearAndType(`input[name="timelines.${targetIndex}.timeMinutes"`, seconds, { delay: 0 });
      cy.clearAndType(`input[name="timelines.${targetIndex}.timeSeconds"`, minutes, { delay: 0 });
    }
    cy.get(`input[name="timelines.${targetIndex}.label"`).type(label);
  });
});

Cypress.Commands.add('blankState', () => {
  const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
  cy.exec('yarn blank-state --force', { env, failOnNonZeroExit: false }).then(result => {
    if (result.exitCode === 1) {
      cy.exec('yarn blank-state --force', { env, failOnNonZeroExit: false });
    }
  });
});

Cypress.Commands.add('realDragAndDrop', (subject, target) => {
  subject
    .realMouseDown({ button: 'left', position: 'center' })
    .realMouseMove(0, 0, { position: 'center' })
    .wait(100);
  target.realMouseMove(0, 0, { position: 'center' }).realMouseUp().wait(100);
});

Cypress.Commands.add('realDrag', (subject, distanceX, distanceY) => {
  subject.then($el => {
    const rect = $el[0].getBoundingClientRect();
    const startX = rect.x + rect.width / 2;
    const startY = rect.y + rect.height / 2;

    cy.wrap($el).realMouseDown({ button: 'left', position: 'center' });

    cy.get('body').realMouseMove(startX + distanceX, startY + distanceY, { position: 'topLeft' });

    cy.get('body').realMouseUp({ button: 'left' });
  });
});

Cypress.Commands.add('waitForLegacyNotifications', () => {
  cy.get('.alert-wrapper').each(element => {
    cy.wrap(element).should('be.empty');
  });
});

Cypress.Commands.add('waitForMarkdownChartSettled', () => {
  cy.get('.markdown-viewer', { timeout: 30000 }).should('be.visible');
  cy.get('.markdown-viewer .recharts-surface, .markdown-viewer .ListChart', {
    timeout: 20000,
  }).should('exist');
  cy.window().then({ timeout: 25000 }, win => {
    return new Cypress.Promise((resolve, reject) => {
      const root = win.document.querySelector('.markdown-viewer');
      if (!root) {
        win.setTimeout(resolve, 2000);
        return;
      }
      const bars = root.querySelectorAll('.recharts-bar-rectangle');
      if (bars.length === 0) {
        win.setTimeout(resolve, 2000);
        return;
      }
      const deadline = Date.now() + 20000;
      let lastSig = '';
      let stableMs = 0;
      const tick = () => {
        const list = win.document.querySelectorAll('.markdown-viewer .recharts-bar-rectangle');
        if (list.length === 0) {
          resolve();
          return;
        }
        const sig = Array.from(list)
          .map(r => r.getBoundingClientRect().height.toFixed(3))
          .join('|');
        if (Date.now() > deadline) {
          reject(new Error('waitForMarkdownChartSettled: bar heights did not stabilize in time'));
          return;
        }
        if (sig === lastSig) {
          stableMs += 50;
          if (stableMs >= 400) {
            resolve();
            return;
          }
        } else {
          lastSig = sig;
          stableMs = 0;
        }
        win.setTimeout(tick, 50);
      };
      tick();
    });
  });
  cy.get('body').realMouseMove(12, 12, { position: 'topLeft' });
  cy.get('.markdown-viewer').then($root => {
    const $tip = $root.find('.recharts-tooltip-wrapper').first();
    if ($tip.length) {
      cy.wrap($tip).should('have.css', 'visibility', 'hidden');
    }
  });
});

addMatchImageSnapshotCommand({
  comparisonMethod: 'ssim',
  failureThreshold: 0.08,
  failureThresholdType: 'percent',
  disableTimersAndAnimations: true,
});

export {};
