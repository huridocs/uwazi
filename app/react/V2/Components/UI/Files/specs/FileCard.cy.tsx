import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { FileCard, EntityFile } from '../FileCard';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y.js';
import { mockPdfFile, mockAudioFile } from './testHelpers';

describe('FileCard', () => {
  const onFileSelect = () => cy.stub();

  it('should be accessible', () => {
    mount(
      <div role="list">
        <FileCard file={mockPdfFile} index={0} onFileSelect={onFileSelect()} />
      </div>
    );
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should render file information', () => {
    mount(<FileCard file={mockPdfFile} index={0} onFileSelect={onFileSelect()} />);
    cy.contains('Test Document.pdf').should('exist');
    cy.contains('PDF').should('exist');
    cy.contains('1 MB').should('exist');
  });

  it('should call onFileSelect when clicked', () => {
    const stub = onFileSelect().as('onFileSelect');
    mount(<FileCard file={mockPdfFile} index={0} onFileSelect={stub} />);
    cy.get('[role="listitem"]').click({ force: true });
    cy.get('@onFileSelect').should('have.been.calledWith', Cypress.sinon.match.object);
  });

  it('should call onFileSelect when Enter key is pressed', () => {
    const stub = onFileSelect().as('onFileSelect');
    mount(<FileCard file={mockPdfFile} index={0} onFileSelect={stub} />);
    cy.get('[role="listitem"]').focus();
    cy.get('[role="listitem"]').type('{enter}');
    cy.get('@onFileSelect').should('have.been.called');
  });

  it('should call onFileSelect when Space key is pressed', () => {
    const stub = onFileSelect().as('onFileSelect');
    mount(<FileCard file={mockPdfFile} index={0} onFileSelect={stub} />);
    cy.get('[role="listitem"]').focus();
    cy.get('[role="listitem"]').type(' ');
    cy.get('@onFileSelect').should('have.been.called');
  });

  it('should display download link', () => {
    mount(<FileCard file={mockPdfFile} index={0} onFileSelect={onFileSelect()} />);
    cy.get('a[aria-label="Download Test Document.pdf"]')
      .should('exist')
      .and('have.attr', 'href', '/api/files/test-document.pdf?download=true');
  });

  it('should display duration for media files', () => {
    mount(<FileCard file={mockAudioFile} index={0} onFileSelect={onFileSelect()} />);
    cy.contains('Duration').should('exist');
  });

  it('should display translations count when provided', () => {
    const translations = [
      { ...mockPdfFile, language: 'en' },
      { ...mockPdfFile, language: 'es' },
    ];
    mount(
      <FileCard
        file={mockPdfFile}
        index={0}
        onFileSelect={onFileSelect()}
        translations={translations}
      />
    );
    cy.contains('Translations').should('exist');
    cy.contains('2/2').should('exist');
  });

  it('should handle external URL files', () => {
    const externalFile: EntityFile = {
      ...mockPdfFile,
      url: 'https://example.com/document.pdf',
      fileType: 'externalURL',
    };
    mount(<FileCard file={externalFile} index={0} onFileSelect={onFileSelect()} />);
    cy.contains('Link').should('exist');
  });

  it('should have proper aria-label', () => {
    mount(<FileCard file={mockPdfFile} index={0} onFileSelect={onFileSelect()} />);
    cy.get('[role="listitem"]')
      .should('have.attr', 'aria-label')
      .and('include', 'Select Test Document.pdf')
      .and('include', 'PDF')
      .and('match', /1[\s.]*MB/);
  });
});
