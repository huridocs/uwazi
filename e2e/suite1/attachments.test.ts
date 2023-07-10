import disableTransitions from '../helpers/disableTransitions';
import { clearAndType } from '../helpers/formActions';
import insertFixtures from '../helpers/insertFixtures';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import { getPropertyOfSelector } from '../helpers/selectorUtils';

const sidePanelFileElementSelector = '.side-panel.is-active .filelist ul li:first-child';
const fileNameEditInputSelector = `${sidePanelFileElementSelector} input#originalname`;
const sidePanelAttachmentElementSelector =
  '.side-panel.is-active .attachments-list .attachment:first-child';
const attachmentNameInputSelector = `${sidePanelAttachmentElementSelector} .attachment-name input`;

describe('connections', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
    await disableTransitions();
  });

  afterAll(async () => {
    await logout();
  });

  describe('Only published', () => {
    it('should show only published documents', async () => {
      await expect(page).toClick('#filtersForm .multiselectItem-name', { text: 'Restricted' });
      await page.waitForFunction(
        // eslint-disable-next-line max-len
        "!document.getElementsByClassName('documents-list')[0].textContent.includes('Resolución de la Corte IDH. Supervisión de cumplimiento de Sentencia de 29 de junio de 2005')"
      );
    });
  });

  describe('main document pdf', () => {
    it('should open the second document', async () => {
      await expect(page).toClick('.documents-list .item-group .item-document:nth-child(2) a', {
        text: 'View',
      });
      await disableTransitions();
      await page.waitForSelector('.document-viewer');
    });

    it('should show the source document as file in the Downloads section', async () => {
      await expect(page).toClick('.sidepanel-header > div > ul > li:nth-child(5)');
      const title = await getPropertyOfSelector(
        page,
        `${sidePanelFileElementSelector} .file-originalname`,
        'textContent'
      );
      expect(title).toEqual('MockPDF.pdf');
    });

    it('should allow entering edit mode for the title, keeping the original text as first value', async () => {
      await expect(page).toClick(`${sidePanelFileElementSelector} button`, {
        text: 'Edit',
      });
      const titleInEdit = await getPropertyOfSelector(
        page,
        `${sidePanelFileElementSelector} input#originalname`,
        'value'
      );
      expect(titleInEdit).toEqual('MockPDF.pdf');
    });

    it('should allow changing the name of the title', async () => {
      await clearAndType(fileNameEditInputSelector, 'MockPDF - renamed.pdf');
      await expect(page).toClick(`${sidePanelFileElementSelector} button`, {
        text: 'Save',
      });
      await page.waitForSelector('.alert-success');
      const title = await getPropertyOfSelector(
        page,
        `${sidePanelFileElementSelector} .file-originalname`,
        'textContent'
      );
      expect(title).toEqual('MockPDF - renamed.pdf');
    });

    it('should allow canceling a name edit of the title', async () => {
      await expect(page).toClick(`${sidePanelFileElementSelector} button`, {
        text: 'Edit',
      });
      await clearAndType(fileNameEditInputSelector, 'MockPDF - renamed a second time.pdf');
      await expect(page).toClick(`${sidePanelFileElementSelector} button`, {
        text: 'Cancel',
      });
      const title = await getPropertyOfSelector(
        page,
        `${sidePanelFileElementSelector} .file-originalname`,
        'textContent'
      );
      expect(title).toEqual('MockPDF - renamed.pdf');
    });

    it('should upload a second main document', async () => {
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('label[for="upload-button-input"]'),
      ]);

      await fileChooser.accept([`${__dirname}/../test_files/anotherPDF.pdf`]);
      await expect(page).toMatchElement(
        '.filelist > ul > li:nth-child(2) > .file > .file-originalname',
        { text: 'anotherPDF.pdf' }
      );
    });

    it('should switch between documents', async () => {
      await expect(page).toClick(
        '.filelist > ul > li:nth-child(2) > .file > div:nth-child(2) >  div:nth-child(2) > .btn-default',
        { text: 'View' }
      );

      // await page.reload();
      // await page.waitForSelector('#page3R_mcid6 > span');
      await expect(page).toMatchElement('span', {
        text: 'RESOLUCIÓN DE LA PRESIDENTA DE LA',
      });

      await expect(page).toClick(
        '.filelist > ul > li:nth-child(1) > .file > div:nth-child(2) >  div:nth-child(2) > .btn-default',
        { text: 'View' }
      );
      await expect(page).toMatchElement('.textLayer > span:nth-child(1)', {
        text: 'Research Paper',
      });
    });
  });

  describe('entity attachment', () => {
    it('should show the first attachment in the main entity view', async () => {
      const title = await getPropertyOfSelector(
        page,
        `${sidePanelAttachmentElementSelector} .attachment-name span`,
        'textContent'
      );
      expect(title).toEqual('MockPDF_again.pdf');
    });

    it('should allow entering edit mode for the title, keeping the original text as first value', async () => {
      await expect(page).toClick(`${sidePanelAttachmentElementSelector} button`);
      await expect(page).toClick(`${sidePanelAttachmentElementSelector} ul.dropdown-menu li span`, {
        text: 'Rename',
      });
      const titleInEdit = await getPropertyOfSelector(page, attachmentNameInputSelector, 'value');
      expect(titleInEdit).toEqual('MockPDF_again.pdf');
    });

    it('should allow changing the name of the title', async () => {
      await page.waitForSelector('.alert-success', { hidden: true });
      await clearAndType(attachmentNameInputSelector, 'MockPDF_again - renamed.pdf');
      await expect(page).toClick(`${sidePanelAttachmentElementSelector} button.btn-success`);
      await page.waitForSelector('.alert-success');
      const title = await getPropertyOfSelector(
        page,
        `${sidePanelAttachmentElementSelector} .attachment-name span`,
        'textContent'
      );
      expect(title).toEqual('MockPDF_again - renamed.pdf');
    });
  });
});
