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

      clickOnEditEntity();
      cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
      // Click on a date field to open the datepicker
      cy.get('.react-datepicker-wrapper').first().click();

      // Wait for datepicker to be visible
      cy.get('.react-datepicker').should('be.visible');

      // Check that month is in English (e.g., "October", "November", "December")
      cy.get('.react-datepicker__current-month')
        .invoke('text')
        .should('satisfy', (text: string) => {
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
          return englishMonths.some(month => text.includes(month));
        });

      // Check that day names are in English
      cy.get('.react-datepicker__day-name')
        .first()
        .invoke('text')
        .should('satisfy', (text: string) => {
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
          return englishDays.some(day => text.includes(day));
        });

      // Close the datepicker
      cy.get('body').click(0, 0);
    });

    // eslint-disable-next-line max-statements
    it('should display datepicker in Arabic for RTL language', () => {
      // Handle page reload errors when changing language
      cy.on('uncaught:exception', err => {
        if (err.message.includes('Hydration failed') || err.message.includes('Script error')) {
          return false;
        }
        return true;
      });

      changeLanguage('العربية');

      // Wait for the page to be fully loaded after language change
      cy.get('.item-document').should('exist');

      // Click on first entity
      cy.get('.item-document').first().click();

      // Edit the entity - wait for Arabic button to be clickable
      cy.contains('button', 'تحرير', { timeout: 10000 })
        .should('be.visible')
        .should('not.be.disabled')
        .click();

      // Wait for the metadata form to be fully loaded and stable
      cy.get('#metadataForm').should('be.visible');

      // Wait for form to stabilize after opening
      cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

      cy.get('.react-datepicker-wrapper input')
        .first()
        .should('be.visible')
        .should('not.be.disabled');

      // Click on the date field input to open the datepicker
      cy.get('.react-datepicker-wrapper input').first().click();

      // Wait for datepicker to open and be fully rendered
      cy.get('.react-datepicker').should('be.visible');
      cy.get('.react-datepicker__current-month').should('be.visible');

      // Check that month is in Arabic (e.g., "أكتوبر" for October)
      cy.get('.react-datepicker__current-month')
        .invoke('text')
        .should('satisfy', (text: string) => {
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
          return arabicMonths.some(month => text.includes(month));
        });

      // Check that day names are in Arabic
      cy.get('.react-datepicker__day-name')
        .first()
        .invoke('text')
        .should('satisfy', (text: string) => {
          // Arabic short day names
          const arabicDays = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
          return arabicDays.some(day => text.includes(day));
        });

      // Check aria-labels are also in Arabic
      cy.get('.react-datepicker__day-name')
        .first()
        .invoke('attr', 'aria-label')
        .should('satisfy', (label: string | undefined) => {
          if (!label) return false;
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
          return arabicDaysFull.some(day => label.includes(day));
        });

      // Close the datepicker
      cy.get('body').click(0, 0);

      // Change back to English for cleanup
      changeLanguage('English');
    });
  });
});
