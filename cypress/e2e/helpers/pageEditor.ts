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

const typeMonaco = (selector: string, value: string, blurAndVerify?: string) => {
  const typeDelay = blurAndVerify ? 15 : 0;
  cy.get(selector).first().realClick().realType(escapeRealType(value), { delay: typeDelay });
  if (blurAndVerify) {
    cy.contains('[role="tab"]', 'Basic').realClick();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(600);
    const panel = selector.includes('panel-Advanced') ? 'Advanced' : 'Code';
    const tabLabel = panel === 'Advanced' ? 'Javascript' : 'Markdown';
    cy.contains('[role="tab"]', tabLabel).click();
    cy.get(selector).closest(`#panel-${panel}`).should('contain.text', blurAndVerify);
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
    if ($body.find('[data-testid="modal"]').length) {
      cy.contains('[data-testid="modal"] button', /discard changes|discard|close|cancel|dismiss/i)
        .first()
        .click({ force: true });
    }
  });
};

export const typeInEditor = (
  mode: 'html' | 'javascript',
  value: string,
  clear = false,
  blurAndVerify?: string
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
      typeMonaco(monacoSelector, value, blurAndVerify);
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
    typeTarget(selector, value);
  });
};
