import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';
import selectors from '../helpers/selectors.js';

const nightmare = createNightmare();

const getInnerText = selector => document.querySelector(selector).innerText;

describe('toc path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin', async () => {
      await nightmare.login('admin', 'admin');
    });
  });

  describe('search for document', () => {
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
      selectors.documentView.firstTocEntry = '#pageContainer1 > div.textLayer > div:nth-child(152)';
      selectors.documentView.secondTocEntry = '#pageContainer3 > div.textLayer > div:nth-child(11)';
      selectors.documentView.secondTocSubEntry = '#pageContainer3 > div.textLayer > div:nth-child(108)';
      selectors.documentView.secondTocSubEntry2 = '#pageContainer4 > div.textLayer > div:nth-child(20)';
      selectors.documentView.thirdTocEntry = '#pageContainer5 > div.textLayer > div:nth-child(55)';

      selectors.documentView.addToTocButton = '#app > div.content > div > div > div.ContextMenu.ContextMenu-center > div > div:nth-child(3)';
      selectors.documentView.saveTocButton = '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active'
                                            + '> div.sidepanel-footer > button';

      const doc = selectors.documentView;

      await nightmare
      .scrollElement(selectors.documentView.viewer, 850)
      .selectText(doc.firstTocEntry)
      .waitToClick(doc.addToTocButton)
      // .scrollElement(selectors.documentView.viewer, 2250)
      // .selectText(doc.secondTocEntry)
      // .waitToClick(doc.addToTocButton)
      // .scrollElement(selectors.documentView.viewer, 2930)
      // .selectText(doc.secondTocSubEntry)
      // .waitToClick(doc.addToTocButton)
      // .scrollElement(selectors.documentView.viewer, 3500)
      // .selectText(doc.secondTocSubEntry2)
      // .waitToClick(doc.addToTocButton)
      // .scrollElement(selectors.documentView.viewer, 4700)
      // .selectText(doc.thirdTocEntry)
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
});
