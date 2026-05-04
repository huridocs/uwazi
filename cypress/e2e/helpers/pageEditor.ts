const getTextareaSelector = (mode: 'html' | 'javascript') =>
  mode === 'javascript'
    ? 'textarea[name="metadata.script"]'
    : 'textarea[name="metadata.markdown"], textarea[name="metadata.content"]';

const getMonacoSelector = (mode: 'html' | 'javascript') =>
  `#panel-${mode === 'html' ? 'Code' : 'Advanced'} .monaco-editor textarea`;

const escapeRealType = (s: string) => s.replace(/\{/g, '{{}');

const clearMonaco = (selector: string) => {
  cy.get(selector).first().realClick().realPress(['Control', 'a']).realPress('Backspace');
};

const pasteMonaco = (selector: string, value: string) => {
  cy.get(selector).first().realClick();
  cy.window().then(async win => win.navigator.clipboard.writeText(value));
  cy.get(selector).first().realPress(['Control', 'v']);
};

const getPanelFromSelector = (selector: string) =>
  selector.includes('panel-Advanced') ? 'Advanced' : 'Code';

const selectedPanelSelector = '[data-headlessui-state="selected"]';

const typeMonaco = (selector: string, value: string, blurAndVerify?: string, paste = false) => {
  if (paste) {
    pasteMonaco(selector, value);
  } else {
    const typeDelay = blurAndVerify ? 15 : 0;
    cy.get(selector).first().realClick().realType(escapeRealType(value), { delay: typeDelay });
  }
  if (blurAndVerify) {
    cy.contains('[role="tab"]', 'Basic').realClick();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(600);
    const panel = getPanelFromSelector(selector);
    const tabLabel = panel === 'Advanced' ? 'Javascript' : 'Markdown';
    cy.contains('[role="tab"]', tabLabel).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    cy.get(selectedPanelSelector)
      .filter(':has(.monaco-editor)')
      .find('.monaco-editor')
      .first()
      .invoke('text')
      .then((text: string) => {
        expect(text, `expected editor to contain "${blurAndVerify}"`).to.include(blurAndVerify);
      });
  }
};

const clearTarget = (selector: string) => {
  cy.get(selector).type('{selectAll}{backspace}', { delay: 0 });
};

const typeTarget = (selector: string, value: string) => {
  cy.get(selector).type(value, {
    parseSpecialCharSequences: false,
    delay: 0,
  });
};

export const dismissModalIfVisible = () => {
  cy.get('body').then($body => {
    if (!$body.find('[data-testid="modal"]').length) return;
    const close = $body.find('[data-testid="modal"] button[aria-label="Close modal"]').first();
    if (close.length) {
      cy.wrap(close).click({ force: true });
      return;
    }
    cy.contains('[data-testid="modal"] button', /discard changes|discard|close|cancel|dismiss/i)
      .first()
      .click({ force: true });
  });
};

export const typeInEditor = (
  mode: 'html' | 'javascript',
  value: string,
  clear = false,
  blurAndVerify?: string,
  paste = false
) => {
  const monacoSelector = getMonacoSelector(mode);
  const textareaSelector = getTextareaSelector(mode);
  cy.get('body', { timeout: 20000 }).should($body => {
    expect($body.find(`${monacoSelector}, ${textareaSelector}`).length).to.be.greaterThan(0);
  });
  cy.get('body').then($body => {
    if ($body.find(monacoSelector).length) {
      if (clear) {
        clearMonaco(monacoSelector);
      }
      typeMonaco(monacoSelector, value, blurAndVerify, paste);
      return;
    }
    let selector = 'textarea[name="metadata.content"]';
    if (mode === 'javascript' || $body.find('textarea[name="metadata.markdown"]').length) {
      selector =
        mode === 'javascript'
          ? 'textarea[name="metadata.script"]'
          : 'textarea[name="metadata.markdown"]';
    }
    if (clear) {
      clearTarget(selector);
    }
    if (paste) {
      cy.get(selector).invoke('val', value).trigger('input');
    } else {
      typeTarget(selector, value);
    }
  });
};
