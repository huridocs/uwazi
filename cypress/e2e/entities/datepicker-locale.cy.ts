import { clearCookiesAndLogin } from '../helpers/login';
import { changeLanguage, clickOnEditEntity } from '../helpers';

describe('DatePicker Locale', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('RTL Support', () => {
    it('should display datepicker in English for LTR language', () => {
      changeLanguage('English');

      // Navigate to library and click on first entity
      cy.contains('a', 'Library').click();
      cy.get('.item-document').first().click();

      // Edit the entity to open the metadata form
      clickOnEditEntity();

      // Click on a date field to open the datepicker
      cy.get('.react-datepicker-wrapper').first().click();

      // Wait for datepicker to be visible
      cy.get('.react-datepicker').should('be.visible');

      // Check that month is in English (e.g., "October", "November", "December")
      cy.get('.react-datepicker__current-month')
        .invoke('text')
        .then(text => {
          // English month names
          const englishMonths = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ];
          const hasEnglishMonth = englishMonths.some(month => text.includes(month));
          expect(hasEnglishMonth).to.be.true;
        });

      // Check that day names are in English
      cy.get('.react-datepicker__day-name')
        .first()
        .invoke('text')
        .then(text => {
          // English short day names
          const englishDays = [
            'Su',
            'Mo',
            'Tu',
            'We',
            'Th',
            'Fr',
            'Sa',
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
          ];
          const hasEnglishDay = englishDays.some(day => text.includes(day));
          expect(hasEnglishDay).to.be.true;
        });

      // Close the datepicker
      cy.get('body').click(0, 0);
    });

    it('should display datepicker in Arabic for RTL language', () => {
      // Handle page reload errors when changing language
      cy.on('uncaught:exception', err => {
        if (err.message.includes('Hydration failed') || err.message.includes('Script error')) {
          return false;
        }
        return true;
      });

      changeLanguage('العربية');

      // Wait for page to reload after language change
      cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

      // Click on first entity (should already be on library page)
      cy.get('.item-document').first().click();

      // Edit the entity to open the metadata form (wait for it to appear)
      cy.contains('button', 'تحرير', { timeout: 10000 }).click(); // "Edit" in Arabic

      // Wait for the metadata form to load
      cy.get('#metadataForm').should('be.visible');

      // Click on a date field input to open the datepicker
      cy.get('.react-datepicker-wrapper input').first().click({ force: true });

      // Wait for datepicker to be visible
      cy.get('.react-datepicker', { timeout: 10000 }).should('be.visible');

      // Check that month is in Arabic (e.g., "أكتوبر" for October)
      cy.get('.react-datepicker__current-month')
        .invoke('text')
        .then(text => {
          // Arabic month names
          const arabicMonths = [
            'يناير',
            'فبراير',
            'مارس',
            'أبريل',
            'مايو',
            'يونيو',
            'يوليو',
            'أغسطس',
            'سبتمبر',
            'أكتوبر',
            'نوفمبر',
            'ديسمبر',
          ];
          const hasArabicMonth = arabicMonths.some(month => text.includes(month));
          expect(hasArabicMonth, 'Month should be in Arabic').to.be.true;
        });

      // Check that day names are in Arabic
      cy.get('.react-datepicker__day-name')
        .first()
        .invoke('text')
        .then(text => {
          // Arabic short day names
          const arabicDays = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
          const hasArabicDay = arabicDays.some(day => text.includes(day));
          expect(hasArabicDay, 'Day names should be in Arabic').to.be.true;
        });

      // Check aria-labels are also in Arabic
      cy.get('.react-datepicker__day-name')
        .first()
        .should('have.attr', 'aria-label')
        .then(label => {
          // Check if aria-label contains Arabic text
          const arabicDaysFull = [
            'السبت',
            'الأحد',
            'الاثنين',
            'الثلاثاء',
            'الأربعاء',
            'الخميس',
            'الجمعة',
          ];
          const hasArabicLabel = arabicDaysFull.some(day => label.includes(day));
          expect(hasArabicLabel, 'Aria-label should be in Arabic').to.be.true;
        });

      // Close the datepicker
      cy.get('body').click(0, 0);

      // Change back to English for cleanup
      changeLanguage('English');
    });
  });
});
