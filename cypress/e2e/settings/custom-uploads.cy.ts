import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('customization', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn blank-state --force', { env });
    clearCookiesAndLogin('admin', 'change this password now');
    cy.injectAxe();
    cy.contains('a', 'Settings').click();
  });

  it('should navigate to the custom uploads page', () => {
    cy.contains('a', 'Uploads').click();
    cy.contains('Custom Uploads');
  });

  it('should upload some files', () => {
    cy.contains('Import asset').click();
    cy.contains('Browse files to upload');
    cy.get('input[type=file]').selectFile(
      [
        './cypress/test_files/batman.jpg',
        './cypress/test_files/sample.pdf',
        './cypress/test_files/short-video.mp4',
      ],
      {
        force: true,
      }
    );
    cy.checkA11y();
    cy.contains('button', 'Add').click();
  });

  it('should check the uploaded files', () => {
    cy.checkA11y();
    cy.get('tbody').within(() => {
      cy.contains('batman.jpg');
      cy.contains('sample.pdf');
      cy.contains('short-video.mp4');
    });
    cy.contains('button', 'Dismiss').click();
  });

  describe('uploading progress and blocking', () => {
    it('should show progress and number of files left', () => {
      cy.contains('Import asset').click();
      cy.contains('Browse files to upload');
      cy.get('input[type=file]').selectFile(
        ['./cypress/test_files/valid.pdf', './cypress/test_files/short-video-thumbnail.jpg'],
        {
          force: true,
        }
      );
      cy.contains('button', 'Add').click();
      cy.contains(/Uploading\.\.\. valid.pdf \d+% \d remaining files/gm);
      cy.contains('button', 'Dismiss').click();
    });
  });
});
