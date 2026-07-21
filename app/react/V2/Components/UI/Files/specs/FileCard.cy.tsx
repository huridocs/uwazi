import React from 'react';
import 'cypress-axe';
import { mount } from 'cypress/react';
import { Provider, useSetAtom } from 'jotai';
import { FileCard, EntityFile } from '../FileCard.js';
import { settingsAtom } from '../../../../../../../app/react/V2/atoms/index.js';
import { FileType } from '../../../../../../shared/types/fileType.js';
import { logA11yViolations } from '../../../../../../../cypress/support/helpers/a11y.js';
import { mockPdfFile, mockAudioFile } from './testHelpers.js';

describe('FileCard', () => {
  const createOnFileSelectStub = () => cy.stub();

  const FileCardComponent = ({
    file,
    index,
    onFileSelect,
    translations,
  }: {
    file: EntityFile;
    index: number;
    onFileSelect: (file: FileType) => void;
    translations?: FileType[];
  }) => {
    return (
      <div className="tw-content">
        <FileCard
          file={file}
          index={index}
          onFileSelect={onFileSelect}
          translations={translations}
        />
      </div>
    );
  };

  it('should be accessible', () => {
    mount(
      <div role="list">
        <FileCardComponent file={mockPdfFile} index={0} onFileSelect={createOnFileSelectStub()} />
      </div>
    );
    cy.injectAxe();
    cy.checkA11y(undefined, undefined, logA11yViolations);
  });

  it('should render file information', () => {
    mount(
      <FileCardComponent file={mockPdfFile} index={0} onFileSelect={createOnFileSelectStub()} />
    );
    cy.contains('Sample Document.pdf').should('exist');
    cy.contains('PDF').should('exist');
    cy.contains('1 MB').should('exist');
  });

  it('should call onFileSelect when clicked', () => {
    const stub = createOnFileSelectStub().as('onFileSelect');
    mount(<FileCardComponent file={mockPdfFile} index={0} onFileSelect={stub} />);
    cy.get('[role="listitem"]').click({ force: true });
    cy.get('@onFileSelect').should('have.been.calledWith', Cypress.sinon.match.object);
  });

  it('should call onFileSelect when Enter key is pressed', () => {
    const stub = createOnFileSelectStub().as('onFileSelect');
    mount(<FileCardComponent file={mockPdfFile} index={0} onFileSelect={stub} />);
    cy.get('[role="listitem"]').focus();
    cy.get('[role="listitem"]').type('{enter}');
    cy.get('@onFileSelect').should('have.been.called');
  });

  it('should call onFileSelect when Space key is pressed', () => {
    const stub = createOnFileSelectStub().as('onFileSelect');
    mount(<FileCardComponent file={mockPdfFile} index={0} onFileSelect={stub} />);
    cy.get('[role="listitem"]').focus();
    cy.get('[role="listitem"]').type(' ');
    cy.get('@onFileSelect').should('have.been.called');
  });

  it('should display download link', () => {
    mount(
      <FileCardComponent file={mockPdfFile} index={0} onFileSelect={createOnFileSelectStub()} />
    );
    cy.get('a[aria-label="Download Sample Document.pdf"]')
      .should('exist')
      .and('have.attr', 'href', '/api/files/sample.pdf?download=true');
  });

  it('should display duration for media files', () => {
    mount(
      <FileCardComponent file={mockAudioFile} index={0} onFileSelect={createOnFileSelectStub()} />
    );
    cy.contains('Duration').should('exist');
  });

  it('should display translations count when provided', () => {
    const translations = [
      { ...mockPdfFile, language: 'en' },
      { ...mockPdfFile, language: 'es' },
    ];
    const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
      const setSettings = useSetAtom(settingsAtom);
      React.useEffect(() => {
        setSettings({
          languages: [
            { _id: '1', label: 'English', key: 'en', default: true, ISO639_3: 'eng' },
            { _id: '2', label: 'Spanish', key: 'es', default: false, ISO639_3: 'spa' },
          ],
        } as any);
      }, [setSettings]);
      return <>{children}</>;
    };
    mount(
      <Provider>
        <SettingsProvider>
          <FileCardComponent
            file={mockPdfFile}
            index={0}
            onFileSelect={createOnFileSelectStub()}
            translations={translations}
          />
        </SettingsProvider>
      </Provider>
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
    mount(
      <FileCardComponent file={externalFile} index={0} onFileSelect={createOnFileSelectStub()} />
    );
    cy.contains('Link').should('exist');
  });

  it('should have proper aria-label', () => {
    mount(
      <FileCardComponent file={mockPdfFile} index={0} onFileSelect={createOnFileSelectStub()} />
    );
    cy.get('[role="listitem"]')
      .should('have.attr', 'aria-label')
      .and('include', 'Select Sample Document.pdf')
      .and('include', 'PDF')
      .and('match', /1[\s.]*MB/);
  });
});
