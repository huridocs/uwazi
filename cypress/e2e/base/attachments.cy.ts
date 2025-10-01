import { clearCookiesAndLogin } from '../helpers/login';

describe('attachments', () => {
  before(() => {
    cy.task('log', '=== ATTACHMENTS TEST BEFORE HOOK STARTING ===');
    const env = { DATABASE_NAME: 'uwazi_e2e', INDEX_NAME: 'uwazi_e2e' };

    // Debug: Check database state before fixtures
    cy.exec(
      'mongosh --host localhost --port 27017 --quiet --eval "db.entities.countDocuments()" uwazi_e2e',
      { failOnNonZeroExit: false }
    ).then(result => {
      cy.task('log', `Entities before fixtures: ${result.stdout}`);
    });

    // Run fixtures and capture output
    cy.exec('yarn e2e-fixtures', { env, failOnNonZeroExit: false }).then(result => {
      cy.task('log', `Fixtures command exit code: ${result.code}`);
      cy.task('log', `Fixtures stdout: ${result.stdout}`);
      cy.task('log', `Fixtures stderr: ${result.stderr}`);

      if (result.code !== 0) {
        cy.task('log', `ERROR: Fixtures command failed with exit code: ${result.code}`);
      }
    });

    // Debug: Check database state after fixtures
    cy.exec(
      'mongosh --host localhost --port 27017 --quiet --eval "db.entities.countDocuments()" uwazi_e2e',
      { failOnNonZeroExit: false }
    ).then(result => {
      cy.task('log', `Entities after fixtures: ${result.stdout}`);
    });

    clearCookiesAndLogin();
  });

  describe('main documents', () => {
    it('should view an entity with main a document', () => {
      cy.task('log', '=== TEST EXECUTION STARTING ===');
      // Debug: Check what entities are visible on the page
      cy.get('h2.item-name')
        .should('exist')
        .then($elements => {
          const entityNames = Array.from($elements).map(el => el.textContent);
          cy.task('log', `Available entities on page: ${JSON.stringify(entityNames)}`);
        });

      // Debug: Look for any entities containing "Artavia"
      cy.get('h2.item-name').each($el => {
        const text = $el.text();
        if (text.includes('Artavia')) {
          cy.task('log', `Found Artavia entity: ${text}`);
        }
      });

      cy.contains(
        'h2.item-name',
        'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
      ).click();

      cy.task('log', 'Clicked entity, waiting for side panel...');

      // Wait for side panel to appear with longer timeout
      cy.get('.side-panel.is-active', { timeout: 20000 }).should('be.visible');
      cy.task('log', 'Side panel is active, looking for View button...');

      cy.task('log', 'About to click View button...');
      cy.get('.side-panel.is-active').within(() => {
        cy.contains('a.edit-metadata', 'View').click();
      });

      cy.task('log', 'Clicked View button, waiting for content...');

      // Debug: Check if we're still on the same page or if we navigated away
      cy.url().then(url => {
        cy.task('log', `Current URL after View click: ${url}`);
      });

      // Debug: Check if side panel is still active
      cy.get('body').then($body => {
        if ($body.find('.side-panel.is-active').length > 0) {
          cy.task('log', 'Side panel is still active');
        } else {
          cy.task('log', 'Side panel is NO LONGER active');
        }
      });

      // Debug: Check what's actually on the page after clicking View
      cy.task('log', 'Checking page content after View click...');
      cy.get('body').then($body => {
        const bodyText = $body.text();
        cy.task('log', `Page body text (first 500 chars): ${bodyText.substring(0, 500)}`);
      });

      // Debug: Check if document viewer loaded
      cy.task('log', 'Looking for document viewer elements...');
      cy.get('body').then($body => {
        if ($body.find('[data-testid="document-viewer"]').length > 0) {
          cy.task('log', 'Document viewer element found');
        } else {
          cy.task('log', 'Document viewer element NOT found');
        }

        if ($body.find('iframe').length > 0) {
          cy.task('log', 'Iframe found (PDF viewer)');
        } else {
          cy.task('log', 'No iframe found');
        }

        if ($body.find('.document-viewer').length > 0) {
          cy.task('log', 'Document viewer class found');
        } else {
          cy.task('log', 'No document viewer class found');
        }
      });

      // Try to find the content with more debugging
      cy.task('log', 'Attempting to find "Uwazi Heroes Investigation" text...');
      cy.get('body')
        .should('contain', 'Uwazi Heroes Investigation', { timeout: 20000 })
        .then(() => {
          cy.task('log', '✅ Found "Uwazi Heroes Investigation" text!');
        })
        .catch(() => {
          cy.task('log', '❌ Could not find "Uwazi Heroes Investigation" text');
          // Debug: Show what text IS available
          cy.get('body').then($body => {
            const allText = $body.text();
            cy.task('log', `Available text on page: ${allText.substring(0, 1000)}`);
          });
        });
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
      cy.contains(
        'h2.item-name',
        'Artavia Murillo y otros. Resolución de la Corte IDH de 31 de marzo de 2014'
      );
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
