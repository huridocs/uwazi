import { adminLogin, logout } from '../helpers/login';
import proxyMock from '../helpers/proxyMock';
import insertFixtures from '../helpers/insertFixtures';
import { changeLanguage } from '../helpers/changeLanguage';
import { prepareToMatchImageSnapshot, testSelectorShot } from '../helpers/regression';

prepareToMatchImageSnapshot();

describe('DatePicker', () => {
  beforeAll(async () => {
    await insertFixtures();
    await proxyMock();
    await adminLogin();
  });

  describe('RTL Support', () => {
    it('Should allow add a date property for a LTR language', async () => {
      await changeLanguage('English');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.btn-footer-hover-success');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toSelect('select:first-of-type', 'Reporte');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.react-datepicker-wrapper');
      await testSelectorShot('.metadata-sidepanel');
    });

    it('Should allow add a date property for a RTL language', async () => {
      await changeLanguage('العربية');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.btn-footer-hover-success');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toSelect('select:first-of-type', 'Reporte');
      // @ts-expect-error TS(2304): Cannot find name 'page'.
      await expect(page).toClick('.react-datepicker-wrapper');
      await testSelectorShot('.metadata-sidepanel');
    });
  });

  afterAll(async () => {
    await changeLanguage('English');
    await logout();
  });
});
