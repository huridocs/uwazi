import { clearCookiesAndLogin } from './helpers/login';

describe('attachments', () => {
  before(() => {
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };
    cy.exec('yarn e2e-fixtures', { env });
    clearCookiesAndLogin();
  });

  describe('main documents', () => {
    it('should view an entity with main a document', () => {
      cy.contains(
        'h2.item-name',
        'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
      ).click();
      cy.get('.side-panel.is-active').within(() => {
        cy.contains('a.edit-metadata', 'View').click();
      });
      cy.contains('Uwazi Heroes Investigation');
    });

    it('should show the file in the main documents section', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist > ul > li')
          .should('have.length', 1)
          .within(() => {
            cy.contains('MockPDF.pdf');
          });
      });
    });

    it('should allow editing the title', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist > ul').within(() => {
          cy.contains('button', 'Edit').click();
          cy.get('#originalname').should('have.value', 'MockPDF.pdf');
          cy.get('#originalname').clear();
          cy.get('#originalname').type('MockPDF - renamed.pdf', { delay: 0 });
          cy.contains('button', 'Save').click();
          cy.contains('MockPDF - renamed.pdf');
        });
      });
    });

    it('should cancel edition', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist > ul').within(() => {
          cy.contains('button', 'Edit').click();
          cy.get('#originalname').should('have.value', 'MockPDF - renamed.pdf');
          cy.get('#originalname').type('adding more to the name', { delay: 0 });
          cy.contains('button', 'Cancel').click();
          cy.contains('MockPDF - renamed.pdf');
        });
      });
    });

    it('should add another main document', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist').within(() => {
          cy.get('input[type=file]').selectFile('./cypress/test_files/anotherPDF.pdf');

          cy.contains('MockPDF - renamed.pdf');
          cy.contains('anotherPDF.pdf');

          cy.get('ul > li').should('have.length', 2);
        });
      });
    });

    it('should navigate to each document', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist').within(() => {
          cy.contains('div', 'anotherPDF.pdf')
            .parent()
            .within(() => {
              cy.contains('a', 'View').click();
            });
        });
      });

      cy.contains('REINTEGRO AL FONDO DE ASISTENCIA LEGAL DE VÍCTIMAS');

      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist').within(() => {
          cy.contains('div', 'MockPDF - renamed.pdf')
            .parent()
            .within(() => {
              cy.contains('a', 'View').click();
            });
        });
      });

      cy.contains('Uwazi Heroes Investigation');
    });

    it('should navigate to the spanish document when language is spanish', () => {
      cy.contains('a', 'Library').click();
      cy.get('.menuNav-language').click();
      cy.get('ul.dropdown-menu.expanded').within(() => {
        cy.contains('a', 'Español').click();
      });

      cy.contains(
        'h2.item-name',
        'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
      ).click();

      cy.get('.side-panel.is-active').within(() => {
        cy.contains('a.edit-metadata', 'Ver').click();
      });

      cy.contains('REINTEGRO AL FONDO DE ASISTENCIA LEGAL DE VÍCTIMAS');
    });

    it('should delete a document', () => {
      cy.get('.menuNav-language').click();
      cy.get('ul.dropdown-menu.expanded').within(() => {
        cy.contains('a', 'English').click();
      });

      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist').within(() => {
          cy.contains('div', 'anotherPDF.pdf')
            .parent()
            .within(() => {
              cy.contains('button', 'Edit').click();
            });
          cy.contains('button', 'Delete').click();
        });
      });

      cy.contains('Confirm deletion of file');
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('button', 'Accept').click();
      });

      cy.get('.side-panel.is-active').within(() => {
        cy.get('.filelist > ul > li')
          .should('have.length', 1)
          .within(() => {
            cy.contains('MockPDF - renamed.pdf');
          });
      });
    });
  });

  describe('supporting files', () => {
    it('should show current supporting files', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.attachments-list-parent').within(() => {
          cy.get('.attachments-list')
            .should('have.length', '1')
            .within(() => {
              cy.contains('MockPDF_again.pdf');
            });
        });
      });
    });

    it('should edit the file', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.attachment').within(() => {
          cy.get('#attachment-dropdown-actions').click();
          cy.get('ul.dropdown-menu').within(() => {
            cy.contains('Rename').click();
          });
          cy.get('input').should('have.value', 'MockPDF_again.pdf');
          cy.get('input').clear();
          cy.get('input').type('new name.pdf', { delay: 0 });
          cy.get('button.btn.btn-success').click();
          cy.contains('span', 'new name.pdf');
        });
      });
    });

    it('should delete the file', () => {
      cy.get('.side-panel.is-active').within(() => {
        cy.get('.attachment').within(() => {
          cy.get('#attachment-dropdown-actions').click();
          cy.get('ul.dropdown-menu').within(() => {
            cy.contains('Delete').click();
          });
        });
      });

      cy.contains('Confirm delete');
      cy.get('[data-testid="modal"]').within(() => {
        cy.contains('button', 'Accept').click();
      });

      cy.get('.attachment').should('not.exist');
    });
  });
});
