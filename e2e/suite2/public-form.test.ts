import { ensure } from 'shared/tsUtils';
import { ElementHandle } from 'puppeteer';
import { selectDate, uploadFileInMetadataField } from '../helpers/formActions';
import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { refreshIndex } from '../helpers/elastichelpers';
import { goToRestrictedEntities } from '../helpers/publishedFilter';
import { checkStringValuesInSelectors, getContentBySelector } from '../helpers/selectorUtils';

const buttonForFotografia =
  'div.content > div > div > main > div > div > form > div > div:nth-child(2) > div:nth-child(4) > ul > li.wide > div > div > div > button';
const buttonForVideo =
  'div.content > div > div > main > div > div > form > div > div:nth-child(2) > div.form-group.media > ul > li.wide > div > div > div > button';
const buttonForImagenAdicional =
  'div.content > div > div > main > div > div > form > div > div:nth-child(2) > div:nth-child(6) > ul > li.wide > div > div > div > button';

const waitForTemplateToBeLoaded = async () => {
  await page.waitForFunction('document.querySelector(".markdownEditor textarea").value !== ""');
};

const createMenuLinkToPublicForm = async (linkText: string) => {
  const element = await page.waitForSelector('.alert-info a.pull-right[target="_blank"]');
  const value = (
    await ensure<ElementHandle>(element).evaluate(el =>
      el instanceof HTMLAnchorElement ? el.href : ''
    )
  ).replace('http://localhost:3000', '');
  await expect(page).toClick('a', { text: 'Menu' });
  await expect(page).toClick('button', { text: 'Add link' });
  await expect(page).toFill('input[name="settings.navlinksData.links[0].title"]', linkText);
  await expect(page).toFill('input[name="settings.navlinksData.links[0].url"]', value);
  await expect(page).toClick('button', { text: 'Save' });
  await expect(page).toClick('.alert.alert-success');
};

describe('Public forms', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
  });

  afterAll(async () => {
    await logout();
  });

  it('should white list the templates', async () => {
    await adminLogin();
    await expect(page).toClick('a', { text: 'Settings' });
    await expect(page).toClick('a', { text: 'Collection' });
    await expect(page).toClick(
      '#collectionSettings > div:nth-child(16) > div > div.toggle-children-button'
    );
    await expect(page).toClick('span', { text: ' more' });
    await expect(page).toClick('span', { text: 'Mecanismo' });
    await expect(page).toClick('span', { text: 'Reporte' });
    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('.alert.alert-success');
  });

  it('should create a page with a public form', async () => {
    await expect(page).toClick('a', { text: 'Pages' });
    await expect(page).toClick('a', { text: 'Add page' });
    await expect(page).toFill('input[name="page.data.title"]', 'Public Form Page');
    await expect(page).toFill(
      '.markdownEditor textarea',
      '<PublicForm template="58ada34c299e82674854504b" />'
    );

    await expect(page).toClick('button', { text: 'Save' });
    await expect(page).toClick('.alert.alert-success');
    await createMenuLinkToPublicForm('Public Form Link');
  });

  it('should visit the page and do a submit for the first template', async () => {
    await expect(page).toClick('a', { text: 'Public Form Link' });

    await expect(page).toFill('input[name="publicform.title"]', 'Test public submit entity');
    await expect(page).toFill(
      'input[name="publicform.metadata.resumen"]',
      'This was submited via public form'
    );
    await expect(page).toClick('span', { text: 'Bahamas' });
    await expect(page).toFill('.captcha input', '42hf');
    await expect(page).toClick('button', { text: 'Submit' });
    await expect(page).toClick('.alert.alert-success');
  });

  describe('public form with image and media files', () => {
    it('should go back a use the other template for the form', async () => {
      await expect(page).toClick('a', { text: 'Settings' });
      await expect(page).toClick('a', { text: 'Pages' });
      await expect(page).toClick('a', { text: 'Public Form Page' });
      await waitForTemplateToBeLoaded();
      await expect(page).toFill(
        '.markdownEditor textarea',
        '<PublicForm template="624b29b432bdcda07b3854b9" />'
      );

      await expect(page).toClick('button', { text: 'Save' });
      await expect(page).toClick('.alert.alert-success');
    });

    it('should revisit the page and fill the text, select and date fields', async () => {
      await expect(page).toClick('a', { text: 'Public Form Link' });

      await expect(page).toFill(
        'input[name="publicform.title"]',
        'Entity with image and media fields'
      );
      await expect(page).toSelect('select', 'Amnistía');
      await selectDate(
        '.form-group.date > ul > li.wide > div > div.react-datepicker-wrapper > div > input',
        '2022/02/10'
      );
      await expect(page).toFill('textarea', 'A description for the report');
    });

    it('should fill the media and image fields', async () => {
      await expect(page).toClick(buttonForFotografia);
      await uploadFileInMetadataField(
        `${__dirname}/../test_files/batman.jpg`,
        'input[aria-label=fileInput]'
      );
      await expect(page).toClick(buttonForVideo);
      await uploadFileInMetadataField(
        `${__dirname}/../test_files/short-video.mp4`,
        'input[aria-label=fileInput]'
      );
      await expect(page).toClick(buttonForImagenAdicional);
      await uploadFileInMetadataField(
        `${__dirname}/../test_files/batman.jpg`,
        'input[aria-label=fileInput]'
      );
    });

    it('should submit the form', async () => {
      await expect(page).toFill('.captcha input', '42hf');
      await expect(page).toClick('button', { text: 'Submit' });
      await expect(page).toClick('.alert.alert-success');
    });
  });

  describe('check created entities', () => {
    beforeAll(async () => {
      await refreshIndex();
      await goToRestrictedEntities();
    });

    it('should check the first entity', async () => {
      await expect(page).toClick('.item-name span', {
        text: 'Test public submit entity',
      });
      await expect(page).toMatchElement('.metadata-name-resumen', {
        text: 'This was submited via public form',
      });
      await expect(page).toMatchElement('.metadata-name-paises', {
        text: 'Bahamas',
      });
    });

    it('should check the second entity with files', async () => {
      await expect(page).toClick('.item-name span', {
        text: 'Entity with image and media fields',
      });
      await expect(page).toMatchElement('.metadata-name-descriptor', {
        text: 'Amnistía',
      });
      await expect(page).toMatchElement('.metadata-name-date', {
        text: 'Feb 10, 2022',
      });
      await expect(page).toMatchElement('.metadata-name-descripci_n', {
        text: 'A description for the report',
      });

      const [fotografiaFieldSource] = await page.$$eval(
        '.metadata-name-fotograf_a > dd > img',
        el => el.map(x => x.getAttribute('src'))
      );
      const [videoFieldSource] = await page.$$eval(
        '.metadata-name-video > dd > div > div > div > div:nth-child(1) > div > video',
        el => el.map(x => x.getAttribute('src'))
      );
      const [ImagenAdicionalFieldSource] = await page.$$eval(
        '.metadata-name-imagen_adicional > dd > img',
        el => el.map(x => x.getAttribute('src'))
      );

      await checkStringValuesInSelectors([
        { selector: fotografiaFieldSource, expected: /^\/api\/files\/\w+\.jpg$/ },
        { selector: videoFieldSource, expected: /^\/api\/files\/\w+\.mp4$/ },
        { selector: ImagenAdicionalFieldSource, expected: /^\/api\/files\/\w+\.jpg$/ },
      ]);

      const fileList = await getContentBySelector('.attachment-name span:not(.attachment-size)');
      expect(fileList).toEqual(['batman.jpg', 'batman.jpg', 'short-video.mp4']);
    });
  });
});
