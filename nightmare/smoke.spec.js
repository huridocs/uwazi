import Nightmare from 'nightmare';
import {login} from './helpers/login.js';
import config from './helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';


describe('Smoke test,', () => {
  let nightmare = new Nightmare({show: true}).viewport(1100, 600);

  let getInnerText = (selector) => {
    return document.querySelector(selector).innerText;
  };

  let isElementVisible = (selector) => {
    let rect = document.querySelector(selector).getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  describe('while logged out,', () => {
    it('/my_account should get redirected to /login', (done) => {
      nightmare
      .goto(config.url + '/logout')
      .wait(config.waitTime)
      .goto(config.url + '/my_account')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/login');
        done();
      })
      .catch(catchErrors(done));
    });

    it('/uploads should get redirected to /login', (done) => {
      nightmare
      .goto(config.url + '/logout')
      .goto(config.url + '/uploads')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/login');
        done();
      })
      .catch(catchErrors(done));
    });

    it('/metadata should get redirected to /login', (done) => {
      nightmare
      .goto(config.url + '/logout')
      .goto(config.url + '/metadata')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/login');
        done();
      })
      .catch(catchErrors(done));
    });

    it('/templates/new should get redirected to /login', (done) => {
      nightmare
      .goto(config.url + '/logout')
      .goto(config.url + '/templates/new')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/login');
        done();
      })
      .catch(catchErrors(done));
    });

    it('/relationtypes/new should get redirected to /login', (done) => {
      nightmare
      .goto(config.url + '/logout')
      .goto(config.url + '/relationtypes/new')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/login');
        done();
      })
      .catch(catchErrors(done));
    });

    it('/thesauris/new should get redirected to /login', (done) => {
      nightmare
      .goto(config.url + '/logout')
      .goto(config.url + '/thesauris/new')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/login');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('library,', () => {
      it('should check if library nav button works', (done) => {
        nightmare
        .goto(config.url + '/logout')
        .click('.nav .fa-power-off')
        .click('.nav .fa-th')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/');
          done();
        });
      });

      describe('bottom right floating menu,', () => {
        it('should check if the filters bottom right menu appear by clicking its icon', (done) => {
          nightmare
          .click('.float-btn__main')
          .wait(config.waitTime)
          .exists('.side-panel.is-active')
          .then((exists) => {
            expect(exists).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });
  });

  describe('while logged in,', () => {
    describe('login success,', () => {
      it('should redirect to home page', (done) => {
        login(nightmare, 'admin', 'admin')
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('my_account,', () => {
      it('should check if user/admin nav button works', (done) => {
        nightmare
        .click('.fa-user')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/my_account');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('uploads,', () => {
      it('should check if uploads nav button works', (done) => {
        nightmare
        .click('.nav .fa-cloud-upload')
        .wait(config.waitTime)
        .url()
        .then((url) => {
          expect(url).toBe(config.url + '/uploads');
          done();
        })
        .catch(catchErrors(done));
      });

      describe('when the user clicks in a document,', () => {
        it('a side panel with the metadata form should appear', (done) => {
          nightmare
          .click('.document-viewer .item-name')
          .exists('.side-panel.is-active')
          .then((result) => {
            expect(result).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });

        it('clicking on the panel cross should close the side-panel', (done) => {
          nightmare
          .click('.side-panel .close-modal')
          .exists('.side-panel.is-hidden')
          .then((result) => {
            expect(result).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });

        it('the bottom right menu should become active', (done) => {
          nightmare
          .click('.document-viewer .item-name')
          .exists('.side-panel.is-active')
          .then((result) => {
            expect(result).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });

        it('while the bottom right menu becomes active, child elements should become active on rollover', (done) => {
          nightmare
          .mouseover('.float-btn__main.cta')
          .exists('.float-btn.btn-fixed.active')
          .then((exists) => {
            expect(exists).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });

    describe('document-viewer,', () => {
      describe('when the user clicks the file icon of a document,', () => {
        it('it should open the document', (done) => {
          nightmare
          .click('.fa-file-o')
          .wait(config.waitLongTime)
          .evaluate(getInnerText, '.document div')
          .then((innerText) => {
            expect(innerText).not.toBe('');
            expect(typeof innerText).not.toBe('undefined');
            done();
          })
          .catch(catchErrors(done));
        });

        it('there should be a menu on the bottom right of the document', (done) => {
          nightmare
          .mouseover('.float-btn__main')
          .exists('.float-btn.btn-fixed.active')
          .then((exists) => {
            expect(exists).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });

        it('the bottom right menu should become active on rollover', (done) => {
          nightmare
          .mouseover('.float-btn.btn-fixed')
          .exists('.float-btn.btn-fixed.active')
          .then((exists) => {
            expect(exists).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });

    describe('library,', () => {
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
    });

    describe('metadata,', () => {
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
      describe('document type section,', () => {
        it('should click the 1st of Document Type section', (done) => {
          nightmare
          .click('.row.metadata .col-sm-4 a')
          .wait(config.waitTime)
          .evaluate(getInnerText, '.app-content .col-sm-3 h1')
          .then((innerText) => {
            expect(innerText).toBe('CONSTRUCTION BLOCKS');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the back button to go back to /metadata', (done) => {
          nightmare
          .click('.panel-heading .fa-arrow-left')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/metadata');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the add document type button', (done) => {
          nightmare
          .click('.row.metadata .col-sm-4 .fa-plus')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/templates/new');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the back button to go back to /metadata', (done) => {
          nightmare
          .click('.fa-arrow-left')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/metadata');
            done();
          })
          .catch(catchErrors(done));
        });
      });

      describe('relation types section,', () => {
        it('should click the 1st of relation types section', (done) => {
          nightmare
          .click('.row.metadata .col-sm-4:nth-child(2) a')
          .wait(config.waitTime)
          .evaluate(getInnerText, '.control-label')
          .then((innerText) => {
            expect(innerText).toBe('Relation Type name');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the back button to go back to /metadata', (done) => {
          nightmare
          .click('.fa-arrow-left')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/metadata');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the add relation type button', (done) => {
          nightmare
          .click('.row.metadata .col-sm-4:nth-child(2) .fa-plus')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/relationtypes/new');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the back button to go back to /metadata', (done) => {
          nightmare
          .click('.fa-arrow-left')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/metadata');
            done();
          })
          .catch(catchErrors(done));
        });
      });

      describe('thesauris section,', () => {
        it('should click the 1st of thesauris section', (done) => {
          nightmare
          .click('.row.metadata .col-sm-4:nth-child(3) a')
          .wait(config.waitTime)
          .evaluate(getInnerText, '.control-label')
          .then((innerText) => {
            expect(innerText).toBe('Thesauri name');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should check if the user can see last value by scrolling down', (done) => {
          nightmare
          .scrollTo(0, 9000)
          .evaluate(isElementVisible, 'input[name="values[41].label"]')
          .then((result) => {
            expect(result).toBe(true);
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the back button to go back to /metadata', (done) => {
          nightmare
          .click('.fa-arrow-left')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/metadata');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the add thesauri button', (done) => {
          nightmare
          .click('.row.metadata .col-sm-4:nth-child(3) .fa-plus')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/thesauris/new');
            done();
          })
          .catch(catchErrors(done));
        });

        it('should click the back button to go back to /metadata', (done) => {
          nightmare
          .click('.fa-arrow-left')
          .wait(config.waitTime)
          .url()
          .then((url) => {
            expect(url).toBe(config.url + '/metadata');
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });

    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
