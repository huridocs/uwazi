import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import selectors from '../helpers/selectors.js';

const nightmare = createNightmare();

const getInnerText = selector => document.querySelector(selector).innerText;

describe('toc path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  it('should log in as admin', async () => {
    await nightmare.login('admin', 'admin');
  });

  it('should find a document then open it', async () => {
    await nightmare
    .wait(selectors.libraryView.librarySecondDocumentTitle)
    .evaluate(getInnerText, selectors.libraryView.librarySecondDocumentTitle)
    .then(itemName => nightmare
    .openDocumentFromLibrary(itemName)
    .wait(selectors.documentView.documentPage)
    .isVisible(selectors.documentView.documentPage)
    .then((result) => {
      expect(result).toBe(true);
    }));
  });

  it('select a word from the document, fill the form and click the next button', async () => {
    selectors.documentView.firstTocEntry = '#page-1 > div > div.textLayer > span:nth-child(215)';
    selectors.documentView.addToTocButton = '#app > div.content > div > div > div.ContextMenu.ContextMenu-center > div > div:nth-child(3)';
    selectors.documentView.saveTocButton = '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active' +
      '> div.sidepanel-footer > button';

    const doc = selectors.documentView;

    await nightmare
    .scrollElement(selectors.documentView.viewer, 850)
    .selectText(doc.firstTocEntry)
    .waitToClick(doc.addToTocButton)
    .waitToClick(doc.addToTocButton)
    .waitToClick(doc.saveTocButton);
  });

  it('should save the toc for other languages too as fallback', async () => {
    await nightmare
    .waitToClick(selectors.navigation.spanish)
    .waitToClick(selectors.documentView.tocPannelLink)
    .getInnerText(selectors.documentView.tocPannel)
    .then((text) => {
      expect(text).toContain('Frank Miller');
    });
  });
});
