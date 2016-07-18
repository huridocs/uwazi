import Nightmare from 'nightmare';
import {login} from '../helpers/login.js';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';


describe('Smoke test,', () => {
  let nightmare = new Nightmare({show: true}).viewport(1100, 600);

  describe('while logged in,', () => {
    describe('login success,', () => {
      it('should redirect to library view', (done) => {
        login(nightmare, 'admin', 'admin')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('library view', () => {
      it('should check if documents loaded correctly', (done) => {
        nightmare
        .wait('.item-group')
        .exists('.item-group')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking on a document a side panel should appear', (done) => {
        nightmare
        .wait('.fa-th')
        .click('.fa-th')
        // the two lines above are a walk around to the bug issue /huridocs/uwazi/issues/104 as documents aint loading
        .wait('.item-group .item')
        .click('.item-group .item')
        .wait('.side-panel.is-active')
        .exists('.side-panel.is-active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking the side panels cross it should disappear', (done) => {
        nightmare
        .click('.fa-close')
        .wait('.side-panel.is-hidden')
        .exists('.side-panel.is-hidden')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking the filters menu it should appear', (done) => {
        nightmare
        .click('.float-btn')
        .wait('.side-panel.is-active')
        .exists('.side-panel.is-active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking the filters menu cross it should disappear', (done) => {
        nightmare
        .click('.fa-close')
        .wait('.side-panel.is-hidden')
        .exists('.side-panel.is-hidden')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('when clicking on a document view button the document should open', (done) => {
        nightmare
        .wait('.item-group .item .item-shortcut')
        .click('.item-group .item .item-shortcut')
        .wait('.page')
        .exists('.page')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    it('to return to library from a document should click on library nav button', (done) => {
      nightmare
      .click('.fa-th')
      .wait('.item-group')
      .exists('.item-group')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('metadata view', () => {
      it('click on metadata nav button', (done) => {
        nightmare
        .wait('.fa-list-alt')
        .click('.fa-list-alt')
        .wait('.row.metadata')
        .exists('.row.metadata')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('on document type section click the first item', (done) => {
        nightmare
        .wait('.list-group-item a')
        .click('.list-group-item a')
        .wait('.metadataTemplate-heading')
        .exists('.metadataTemplate-heading')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('from the first item of Document Type section should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait('.list-group-item a')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        })
        .catch(catchErrors(done));
      });

      it('on document type section should click the add document type button', (done) => {
        nightmare
        .wait('.fa-plus')
        .click('.fa-plus')
        .wait('.metadataTemplate-heading')
        .exists('.metadataTemplate-heading')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('from add new document type should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait('.list-group-item a')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        })
        .catch(catchErrors(done));
      });

      it('on relation types section should click the first item', (done) => {
        nightmare
        .wait('.metadata>div:nth-child(2) .list-group-item a')
        .click('.metadata>div:nth-child(2) .list-group-item a')
        .wait('#relationTypeName')
        .exists('#relationTypeName')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('from relation type item should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait('.list-group-item a')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        })
        .catch(catchErrors(done));
      });

      it('on relation type section should click the add relation type button', (done) => {
        nightmare
        .wait('.metadata>div:nth-child(2) .fa-plus')
        .click('.metadata>div:nth-child(2) .fa-plus')
        .wait('#relationTypeName')
        .exists('#relationTypeName')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('from add new relation type should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait('.list-group-item a')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        })
        .catch(catchErrors(done));
      });

      it('on thesauris section should click the first item', (done) => {
        nightmare
        .wait('.metadata>div:nth-child(3) .list-group-item a')
        .click('.metadata>div:nth-child(3) .list-group-item a')
        .wait('#thesauriName')
        .exists('#thesauriName')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('from thesauri should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait('.list-group-item a')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        })
        .catch(catchErrors(done));
      });

      it('on thesauris section should click the add thesauri button', (done) => {
        nightmare
        .wait('.metadata>div:nth-child(3) .fa-plus')
        .click('.metadata>div:nth-child(3) .fa-plus')
        .wait('#thesauriName')
        .exists('#thesauriName')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('from add new thesauri  should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait('.list-group-item a')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('uploads view', () => {
      it('click on uploads nav button', (done) => {
        nightmare
        .wait('.fa-cloud-upload')
        .click('.fa-cloud-upload')
        .wait('.item-info')
        .exists('.item-info')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('click on a document then a side panel with the metadata form should appear', (done) => {
        nightmare
        .click('.item-group .item')
        .wait('.side-panel.is-active')
        .exists('.side-panel.is-active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('the bottom right menu should become active on roll over', (done) => {
        nightmare
        .mouseover('.float-btn')
        .wait('.float-btn.active')
        .exists('.float-btn.active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('clicking on the panel cross should close the side-panel', (done) => {
        nightmare
        .click('.close-modal')
        .wait('.side-panel.is-hidden')
        .exists('.side-panel.is-hidden')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('Ssettings view', () => {
      it('should check if user settings view loads', (done) => {
        nightmare
        .click('.fa-cog')
        .wait('input[type="email"]')
        .exists('input[type="email"]')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('closing browser', () => {
      it('should close the browser', (done) => {
        nightmare.end()
        .then(done);
      });
    });
  });
});
