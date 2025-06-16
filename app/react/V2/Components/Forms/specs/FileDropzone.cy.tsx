import React from 'react';
import 'cypress-axe';
import { mount } from '@cypress/react18';
import { composeStories } from '@storybook/react';
import * as stories from 'app/stories/Forms/FileDropzone.stories';
import { SinonSpy } from 'cypress/types/sinon';

const { Basic } = composeStories(stories);

const files = [
  {
    contents: Cypress.Buffer.from('File 1 contents'),
    fileName: 'file1.txt',
    lastModified: 1,
  },
  {
    contents: Cypress.Buffer.from('File 2 contents'),
    fileName: 'file2.jpg',
    lastModified: 1,
  },
  {
    contents: Cypress.Buffer.from('File 3 contents'),
    fileName: 'file3.pdf',
    lastModified: 1,
  },
];

describe('File dropzone', () => {
  let onChangeSpy: SinonSpy<any>;

  beforeEach(() => {
    onChangeSpy = cy.spy().as('onChangeSpy');
    mount(<Basic onChange={onChangeSpy} />);
    cy.get('input[type=file]').selectFile(files, { force: true });
  });

  it('should list uploaded files', () => {
    cy.contains('file1.txt');
    cy.contains('file2.jpg');
    cy.contains('file3.pdf');
    cy.contains('Size: 45 Bytes');

    cy.get('@onChangeSpy').should(spy => {
      const spyCalls = (spy as unknown as SinonSpy).getCalls();
      const { args } = spyCalls[1];
      args[0].forEach((element: File, index: number) =>
        expect(element.name).to.eq(files[index].fileName)
      );
    });
  });

  it('should allow removing files', () => {
    cy.contains('file2.jpg')
      .parent()
      .within(element => {
        cy.wrap(element).get('button').click();
      });

    cy.contains('file1.txt');
    cy.contains('file2.jpg').should('not.exist');
    cy.contains('file3.pdf');
    cy.contains('Size: 30 Bytes');

    cy.get('@onChangeSpy').should(spy => {
      const spyCalls = (spy as unknown as SinonSpy).getCalls();
      const { args } = spyCalls[2];
      expect(args[0][0].name).to.eq(files[0].fileName);
      expect(args[0][1].name).to.eq(files[2].fileName);
    });
  });

  it('should be accessible', () => {
    cy.injectAxe();
    cy.checkA11y();
  });
});
