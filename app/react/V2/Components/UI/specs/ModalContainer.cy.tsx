import React from 'react';
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { mount } from '@cypress/react18';
import { modalAtom, showModalAtom } from 'V2/atoms';
import { Button } from 'V2/Components/UI';
import { ModalContainer } from '../ModalContainer';
import { Modal } from '../Modal';

describe('ModalContainer.cy.tsx', () => {
  const Component = () => {
    const setModal = useSetRecoilState(modalAtom);
    const setShowModal = useSetRecoilState(showModalAtom);

    setModal({
      size: 'md',
      children: (
        <>
          <Modal.Header>
            <h3 className="text-xl font-medium text-gray-900">Important information</h3>
            <Modal.CloseButton onClick={() => setShowModal(false)} />
          </Modal.Header>
          <Modal.Body>Testing Components with Cypress is super cool!</Modal.Body>
          <Modal.Footer>
            <Button onClick={() => setShowModal(false)}>Awesome!</Button>
          </Modal.Footer>
        </>
      ),
    });

    const onClick = () => {
      setShowModal(true);
    };

    return (
      <>
        <ModalContainer />
        <button type="button" id="show-modal" onClick={onClick}>
          Show Modal
        </button>
      </>
    );
  };

  beforeEach(() => {
    mount(
      <RecoilRoot>
        <Component />
      </RecoilRoot>
    );
  });

  it('Should show the modal on click', () => {
    cy.get('#show-modal').click();
    cy.get('[data-testid="modal"]').contains('Testing Components with Cypress is super cool!');
    cy.get('[data-testid="modal"]').should('be.visible');
  });

  it('Should hide the modal', () => {
    cy.get('#show-modal').click();
    cy.contains('button', 'Awesome!').click();
    cy.get('[data-testid="modal"]').should('not.be.visible');
  });
});
