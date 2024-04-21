import 'cypress-axe';
import { clearCookiesAndLogin } from '../helpers/login';

describe('customization', () => {
  before(() => {
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

  it('should rename a file', () => {
    cy.contains('td', 'batman.jpg').parent().contains('button', 'Edit').click();
    cy.contains('Edit File');
    cy.checkA11y();
    cy.get('aside').within(() => {
      cy.get('#filename').clear();
      cy.get('#filename').type('Batman - superhero pic', { delay: 0 });
      cy.contains('button', 'Save').click();
    });
    cy.contains('td', 'Batman - superhero pic.jpg');
  });

  it('should delete a file', () => {
    cy.contains('td', 'short-video.mp4').parent().contains('button', 'Delete').click();
    cy.contains('li', 'short-video.mp4');
    cy.contains('button', 'Accept').click();
    cy.contains('button', 'Dismiss').click();
    cy.contains('short-video.mp4').should('not.exist');
  });

  it('should delete multiple files', () => {
    cy.contains('span', 'Select all')
      .parent()
      .within(() => {
        cy.get('input').click();
      });
    cy.get('[data-testid="settings-content-footer"]').within(() => {
      cy.contains('button', 'Delete').click();
    });
    cy.contains('li', 'Batman - superhero pic.jpg');
    cy.contains('li', 'sample.pdf');
    cy.contains('li', 'valid.pdf');
    cy.contains('li', 'short-video-thumbnail.jpg');
    cy.contains('button', 'Accept').click();
    cy.contains('button', 'Dismiss').click();
    cy.get('tbody').children().should('have.length', 0);
  });
});
