/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

describe('PublishDocument', () => {
  // missing test for actually upload and publish a document

  describe('metadata editing', () => {
    it('should log in as admin and go into the document viewer for the desired entity', (done) => {
      const title = 'Star Lord Wikipedia';

      nightmare
      .login('admin', 'admin')
      .openDocumentFromLibrary(title)
      .getInnerText(selectors.documentView.contentHeader)
      .then(headerText => {
        expect(headerText).toContain(title);
        done();
      })
      .catch(catchErrors(done));
    }, 10000);

    it('should allow changing the different template\'s properties', (done) => {
      selectors.docViewer = {
        form: {
          title: '#metadataForm > div:nth-child(1) > ul > li.wide > div > textarea',
          type: '#metadataForm > div:nth-child(2) > ul > li.wide > select',
          company: '#metadataForm > div:nth-child(4) > div:nth-child(1) > ul > li.wide > div > input',
          nemesis: '#metadataForm > div:nth-child(4) > div:nth-child(2) > ul > li.wide > select',
          suporPowers: {
            fly: '#metadataForm > div:nth-child(4) > div:nth-child(3) > ul > li.wide > ul > li:nth-child(5) > label > i.multiselectItem-icon.fa.fa-square-o',
            rich: '#metadataForm > div:nth-child(4) > div:nth-child(3) > ul > li.wide > ul > li:nth-child(3) > label > i.multiselectItem-icon.fa.fa-check'
          }
        },
        viewer: {
          title: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > div > div > h1',
          company: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(2) > dd',
          nemesis: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(3) > dd > a',
          superpowers: '#app > div.content > div > div > aside.side-panel.metadata-sidepanel.is-active > div.sidepanel-body > div > div.tab-content.tab-content-visible > div > dl:nth-child(4) > dd > ul'
        }
      };

      nightmare
      .openSidePanelOnDocumentViewer()
      .editDocumentFromDocumentViewer()
      .clearInput(selectors.docViewer.form.title)
      .type(selectors.docViewer.form.title, 'Star-Lord (Peter Quill)')
      .clearInput(selectors.docViewer.form.company)
      .type(selectors.docViewer.form.company, 'Marvel Comics')
      .select(selectors.docViewer.form.nemesis, '86raxe05i4uf2yb9')
      .waitToClick(selectors.docViewer.form.suporPowers.fly)
      .waitToClick(selectors.docViewer.form.suporPowers.rich)
      .saveFromDocumentViewer()
      .refresh()
      .openSidePanelOnDocumentViewer()
      //.wait(selectors.docViewer.viewer.title)
      .getInnerText(selectors.docViewer.viewer.title)
      .then(text => {
        expect(text).toBe('Star-Lord (Peter Quill)');
        return nightmare.getInnerText(selectors.docViewer.viewer.company);
      })
      .then(text => {
        expect(text).toBe('Marvel Comics');
        return nightmare.getInnerText(selectors.docViewer.viewer.nemesis);
      })
      .then(text => {
        expect(text).toBe('Daneryl');
        return nightmare.getInnerText(selectors.docViewer.viewer.superpowers);
      })
      .then(text => {
        expect(text).toBe('tricky weaponsfly');
      })
      .then(done);
    }, 20000);
  });

  it('should go to library and change the document type', (done) => {
    nightmare
    .waitForTheEntityToBeIndexed()
    .click(selectors.navigation.libraryNavButton)
    .waitToClick(selectors.libraryView.libraryThirdDocument)
    .waitToClick(selectors.libraryView.editEntityButton)
    .select(selectors.newEntity.form.type, '58ad7d240d44252fee4e6201')
    .waitToClick(selectors.libraryView.saveButton)
    .waitForTheEntityToBeIndexed()
    .refresh()
    .waitToClick(selectors.libraryView.libraryThirdDocument)
    .getInnerText(selectors.libraryView.sidePanelDocumentType)
    .then(text => {
      expect(text).toBe('Test Document');
    })
    .then(() => {
      done();
    });
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
