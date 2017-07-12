import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

const nightmare = createNightmare();

let getInnerText = (selector) => {
  return document.querySelector(selector).innerText;
};

let getValue = (selector) => {
  return document.querySelector(selector).value;
};

fdescribe('attachments path', () => {
  describe('login', () => {
    it('should log in as admin', (done) => {
      nightmare
      .login('admin', 'admin')
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  describe('main document pdf', () => {
    it('should open the second document', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.librarySecondDocumentLink)
      .wait(selectors.documentView.documentPage)
      .isVisible(selectors.documentView.documentPage)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should show the source document as attachment in the attachments tab', (done) => {
      nightmare
      .waitToClick(selectors.documentView.sidePanelAttachmentsTab)
      .wait(selectors.documentView.sidePanelFirstAttachmentTitle)
      .evaluate(getInnerText, selectors.documentView.sidePanelFirstAttachmentTitle)
      .then(attachmentName => {
        expect(attachmentName).toBe('Batman - Wikipedia.pdf');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow entering edit mode for the title, keeping the original text as first value', (done) => {
      nightmare
      .waitToClick(selectors.documentView.sidePanelFirstAttachmentEditTitleButton)
      .wait(selectors.documentView.attachmentFormInput)
      .evaluate(getValue, selectors.documentView.attachmentFormInput)
      .then(inputValue => {
        expect(inputValue).toBe('Batman - Wikipedia.pdf');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow changing the name of the title', (done) => {
      nightmare
      .clearInput(selectors.documentView.attachmentFormInput)
      .insert(selectors.documentView.attachmentFormInput, 'Batman - the whole story.pdf')
      .waitToClick(selectors.documentView.attachmentFormSubmit)
      .wait(selectors.documentView.sidePanelFirstAttachmentTitle)
      .evaluate(getInnerText, selectors.documentView.sidePanelFirstAttachmentTitle)
      .then(attachmentName => {
        expect(attachmentName).toBe('Batman - the whole story.pdf');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow canceling a name edit of the title', (done) => {
      nightmare
      .waitToClick(selectors.documentView.sidePanelFirstAttachmentEditTitleButton)
      .wait(selectors.documentView.attachmentFormInput)
      .type(selectors.documentView.attachmentFormInput, '\u0008\u0008\u0008')
      .insert(selectors.documentView.attachmentFormInput, 'jpg')
      .evaluate(getValue, selectors.documentView.attachmentFormInput)
      .then(inputValue => {
        expect(inputValue).toEqual('Batman - the whole story.jpg');

        return nightmare
        .waitToClick(selectors.documentView.attachmentFormCancel)
        .wait(selectors.documentView.sidePanelFirstAttachmentTitle)
        .evaluate(getInnerText, selectors.documentView.sidePanelFirstAttachmentTitle)
        .then(attachmentName => {
          expect(attachmentName).toBe('Batman - the whole story.pdf');
          done();
        });
      })
      .catch(catchErrors(done));
    });
  });

  describe('entity attachment', () => {
    it('should go into the entity viewer for the desired entity', (done) => {
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

    it('should show the first attachment in the attachments tab', (done) => {
      nightmare
      .waitToClick(selectors.entityView.sidePanelAttachmentsTab)
      .wait(selectors.entityView.sidePanelFirstAttachmentTitle)
      .evaluate(getInnerText, selectors.entityView.sidePanelFirstAttachmentTitle)
      .then(attachmentName => {
        expect(attachmentName).toBe('ManBatCv3.jpg');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow entering edit mode for the title, keeping the original text as first value', (done) => {
      nightmare
      .waitToClick(selectors.entityView.sidePanelFirstAttachmentEditTitleButton)
      .wait(selectors.entityView.attachmentFormInput)
      .evaluate(getValue, selectors.entityView.attachmentFormInput)
      .then(inputValue => {
        expect(inputValue).toBe('ManBatCv3.jpg');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should allow changing the name of the title', (done) => {
      nightmare
      .clearInput(selectors.entityView.attachmentFormInput)
      .insert(selectors.entityView.attachmentFormInput, 'Only known picture.jpg')
      .waitToClick(selectors.entityView.attachmentFormSubmit)
      .wait(selectors.entityView.sidePanelFirstAttachmentTitle)
      .evaluate(getInnerText, selectors.entityView.sidePanelFirstAttachmentTitle)
      .then(attachmentName => {
        expect(attachmentName).toBe('Only known picture.jpg');
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
