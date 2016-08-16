import Nightmare from 'nightmare';
import {login} from '../helpers/login.js';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';


describe('Smoke test,', () => {
  let nightmare = new Nightmare({show: true, typeInterval: 10}).viewport(1100, 600);

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
