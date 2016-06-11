import Nightmare from 'nightmare';
import {login} from './helpers/login.js';
import config from './helpers/config.js';


describe('Smoke test', () => {
  let nightmare = new Nightmare({show: true}).viewport(1100, 600);

  let getInnerText = (selector) => {
    return document.querySelector(selector).innerText;
  };

  describe('login success', () => {
    it('should redirect to home page', (done) => {
      login(nightmare, 'admin', 'admin')
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/');
        done();
      });
    });
  });

  describe('my_account', () => {
    it('should check if user/admin nav button works', (done) => {
      nightmare
      .click('.fa-user')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/my_account');
        done();
      });
    });
  });

  describe('uploads', () => {
    it('should check if uploads nav button works', (done) => {
      nightmare
      .click('.nav .fa-cloud-upload')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/uploads');
        done();
      });
    });

    describe('when the user clicks in a document', () => {
      it('a side panel with the metadata form appears', (done) => {
        nightmare
        .click('.document-viewer .item-name')
        .exists('.side-panel.is-active')
        .then((result) => {
          expect(result).toBe(true);
          done();
        });
      });

      it('should close the side-panel by clicking on the panel cross', (done) => {
        nightmare
        .click('.side-panel .close-modal')
        .exists('.side-panel.is-hidden')
        .then((result) => {
          expect(result).toBe(true);
          done();
        });
      });

      it('the bottom right menu becomes disabled before user click on a document', (done) => {
        nightmare
        .exists('.float-btn__main.disabled')
        .then((result) => {
          expect(result).toBe(true);
          done();
        });
      });

      it('the bottom right menu becomes active when user click on a document', (done) => {
        nightmare
        .click('.document-viewer .item-name')
        .exists('.float-btn__main.cta')
        .then((result) => {
          expect(result).toBe(true);
          done();
        });
      });

      it('when the bottom right menu becomes active child elements become active on rollover', (done) => {
        nightmare
        .mouseover('.float-btn__main.cta')
        .exists('.float-btn.btn-fixed.active')
        .then((exists) => {
          expect(exists).toBe(true);
          done();
        });
      });
    });
    describe('item-metadata', () => {
      describe('when the user clicks the document-metadata of a document', () => {
        it('a window showing the status of a document should appear', () => {
          nightmare
          .click('.item-metadata')
          .click('.cancel-button')
          .wait(config.waitTime);
        });
      });
    });
  });

  describe('document-viewer', () => {
    describe('when the user clicks the file icon of a document', () => {
      it('should open the document', (done) => {
        nightmare
        .click('.fa-file-o')
        .wait(config.waitLongTime)
        .evaluate(getInnerText, '.document div')
        .then((innerText) => {
          expect(innerText).not.toBe('');
          expect(typeof innerText).not.toBe('undefined');
          done();
        });
      });

      it('there should be a menu on the bottom right of the document', (done) => {
        nightmare
        .mouseover('.float-btn__main')
        .exists('.float-btn.btn-fixed.active')
        .then((exists) => {
          expect(exists).toBe(true);
          done();
        });
      });

      it('the bottom right of the document menu should become active on rollover', (done) => {
        nightmare
        .mouseover('.float-btn.btn-fixed')
        .exists('.float-btn.btn-fixed.active')
        .then((exists) => {
          expect(exists).toBe(true);
          done();
        });
      });
    });
  });

  describe('library', () => {
    it('should check if library nav button works', (done) => {
      nightmare
      .click('.nav .fa-th')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/');
        done();
      });
    });

    describe('bottom right floating menu', () => {
      it('should check if the bottom right menu appear by clicking its icon', (done) => {
        nightmare
        .click('.float-btn__main')
        .wait(config.waitTime)
        .exists('.side-panel.is-active')
        .then((exists) => {
          expect(exists).toBe(true);
          done();
        });
      });

      it('should check if the bottom right menu checkbox for select all works', (done) => {
        nightmare
        .click('.float-btn__main.cta')
        .click('.search__filter.search__filter--type input')
        .evaluate(getInnerText, '.filters-box .title')
        .then((innerText) => {
          expect(innerText).toBe('Common filters for Decision, Ruling and Judgement');
          done();
        });
      });

      it('should untick all then check if the bottom right menu checkbox for decision works', (done) => {
        nightmare
        .click('.search__filter.search__filter--type input')
        .click('.search__filter.search__filter--type li:nth-child(3) input')
        .wait(config.waitTime)
        .evaluate(getInnerText, '.filters-box .title')
        .then((innerText) => {
          expect(innerText).toBe('Filters for Decision');
          done();
        });
      });

      it('should untick all then check if the bottom right menu checkbox for ruling works', (done) => {
        nightmare
        .click('.search__filter.search__filter--type li:nth-child(3) input')
        .click('.search__filter.search__filter--type li:nth-child(4) input')
        .wait(config.waitTime)
        .evaluate(getInnerText, '.filters-box .title')
        .then((innerText) => {
          expect(innerText).toBe('Filters for Ruling');
          done();
        });
      });

      it('should untick all then check if the bottom right menu checkbox for judgement works', (done) => {
        nightmare
        .click('.search__filter.search__filter--type li:nth-child(4) input')
        .click('.search__filter.search__filter--type li:nth-child(5) input')
        .wait(config.waitTime)
        .evaluate(getInnerText, '.filters-box .title')
        .then((innerText) => {
          expect(innerText).toBe('Filters for Judgement');
          done();
        });
      });
    });
  });

  describe('metadata', () => {
    it('should check if metadata nav button works', (done) => {
      nightmare
      .click('.nav .fa-list-alt')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/metadata');
        done();
      });
    });
    describe('document type section', () => {
      it('should click the 1st of Document Type section', (done) => {
        nightmare
        .click('.row.metadata .col-sm-4 a')
        .wait(config.waitTime)
        .evaluate(getInnerText, '.app-content .col-sm-3 h1')
        .then((innerText) => {
          expect(innerText).toBe('CONSTRUCTION BLOCKS');
          done();
        });
      });

      it('should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.panel-heading .fa-arrow-left')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        });
      });

      it('should click the add document type button', (done) => {
        nightmare
        .click('.row.metadata .col-sm-4 .fa-plus')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/templates/new');
          done();
        });
      });

      it('should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        });
      });
    });

    describe('relation types section', () => {
      it('should click the 1st of relation types section', (done) => {
        nightmare
        .click('.row.metadata .col-sm-4:nth-child(2) a')
        .wait(config.waitTime)
        .evaluate(getInnerText, '.control-label')
        .then((innerText) => {
          expect(innerText).toBe('Relation Type name');
          done();
        });
      });

      it('should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        });
      });

      it('should click the add relation type button', (done) => {
        nightmare
        .click('.row.metadata .col-sm-4:nth-child(2) .fa-plus')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/relationtypes/new');
          done();
        });
      });

      it('should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        });
      });
    });

    describe('thesauris section', () => {
      it('should click the 1st of thesauris section', (done) => {
        nightmare
        .click('.row.metadata .col-sm-4:nth-child(3) a')
        .wait(config.waitTime)
        .evaluate(getInnerText, '.control-label')
        .then((innerText) => {
          expect(innerText).toBe('Thesauri name');
          done();
        });
      });

      it('should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        });
      });

      it('should click the add thesauri button', (done) => {
        nightmare
        .click('.row.metadata .col-sm-4:nth-child(3) .fa-plus')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/thesauris/new');
          done();
        });
      });

      it('should click the back button to go back to /metadata', (done) => {
        nightmare
        .click('.fa-arrow-left')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/metadata');
          done();
        });
      });
    });
  });

  it('should close the browser', (done) => {
    nightmare.end()
    .then(done);
  });
});
