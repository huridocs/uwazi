import { catchErrors } from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

const getInnerText = selector => document.querySelector(selector).innerText;

const getValue = selector => document.querySelector(selector).value;

describe('attachments path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('login', () => {
    it('should log in as admin', done => {
      nightmare
        .login('admin', 'admin')
        .then(() => {
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('main document pdf', () => {
    it('should open the second document', done => {
      nightmare
        .waitToClick(selectors.libraryView.librarySecondDocumentLink)
        .wait(selectors.documentView.documentPage)
        .isVisible(selectors.documentView.documentPage)
        .then(result => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should show the source document as file in the Downloads section', done => {
      nightmare
        .waitToClick(selectors.documentView.sidePanelInfoTab)
        .wait(selectors.documentView.sidePanelFirstDocumentTitle)
        .evaluate(getInnerText, selectors.documentView.sidePanelFirstDocumentTitle)
        .then(attachmentName => {
          expect(attachmentName).toBe('Batman - Wikipedia.pdf');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should allow entering edit mode for the title, keeping the original text as first value', done => {
      nightmare
        .waitToClick(selectors.documentView.sidePanelFirstDocumentEditButton)
        .wait(selectors.documentView.fileFormInput)
        .evaluate(getValue, selectors.documentView.fileFormInput)
        .then(inputValue => {
          expect(inputValue).toBe('Batman - Wikipedia.pdf');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should allow changing the name of the title', done => {
      nightmare
        .clearInput(selectors.documentView.fileFormInput)
        .insert(selectors.documentView.fileFormInput, 'Batman - the whole story.pdf')
        .waitToClick(selectors.documentView.fileFormSubmit)
        .wait(500) //wait to save
        .wait(selectors.documentView.sidePanelFirstDocumentTitle)
        .evaluate(getInnerText, selectors.documentView.sidePanelFirstDocumentTitle)
        .then(attachmentName => {
          expect(attachmentName).toBe('Batman - the whole story.pdf');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should allow canceling a name edit of the title', done => {
      nightmare
        .waitToClick(selectors.documentView.sidePanelFirstDocumentEditButton)
        .wait(selectors.documentView.fileFormInput)
        .type(selectors.documentView.fileFormInput, '\u0008\u0008\u0008')
        .insert(selectors.documentView.fileFormInput, 'jpg')
        .evaluate(getValue, selectors.documentView.fileFormInput)
        .then(inputValue => {
          expect(inputValue).toEqual('Batman - the whole story.jpg');

          return nightmare
            .waitToClick(selectors.documentView.fileFormCancel)
            .wait(selectors.documentView.sidePanelFirstDocument)
            .evaluate(getInnerText, selectors.documentView.sidePanelFirstDocumentTitle)
            .then(attachmentName => {
              expect(attachmentName).toBe('Batman - the whole story.pdf');
              done();
            });
        })
        .catch(catchErrors(done));
    });
  });

  describe('entity attachment', () => {
    it('should go into the entity viewer for the desired entity', done => {
      const entityTitle = 'Man-bat';

      nightmare
        .gotoLibrary()
        .openEntityFromLibrary(entityTitle)
        .getInnerText(selectors.entityView.contentHeader)
        .then(headerText => {
          expect(headerText).toContain(entityTitle);
          done();
        })
        .catch(catchErrors(done));
    });

    it('should show the first attachment in the main entity view', done => {
      nightmare
        .wait(selectors.entityView.firstAttachmentTitle)
        .evaluate(getInnerText, selectors.entityView.firstAttachmentTitle)
        .then(attachmentName => {
          expect(attachmentName).toBe('ManBatCv3.jpg');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should allow entering edit mode for the title, keeping the original text as first value', done => {
      nightmare
        .waitToClick(selectors.entityView.firstAttachmentEditTitleButton)
        .wait(selectors.entityView.attachmentFormInput)
        .evaluate(getValue, selectors.entityView.attachmentFormInput)
        .then(inputValue => {
          expect(inputValue).toBe('ManBatCv3.jpg');
          done();
        })
        .catch(catchErrors(done));
    });

    it('should allow changing the name of the title', done => {
      nightmare
        .clearInput(selectors.entityView.attachmentFormInput)
        .insert(selectors.entityView.attachmentFormInput, 'Only known picture.jpg')
        .waitToClick(selectors.entityView.attachmentFormSubmit)
        .wait(selectors.entityView.firstAttachmentTitle)
        .evaluate(getInnerText, selectors.entityView.firstAttachmentTitle)
        .then(attachmentName => {
          expect(attachmentName).toBe('Only known picture.jpg');
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
