import React, { useRef, useState } from 'react';
import { mount } from '@cypress/react18';
import { useOnClickOutside } from '../useOnClickOutside';

describe('useOnClickOutside', () => {
  const TestingComponent = () => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    useOnClickOutside(ref, () => setCount(count + 1));

    return (
      <div className="tw-content" style={{ height: '100%', width: '100%' }}>
        <div className="flex gap-2" data-testid="flex-container">
          <div className="border rounded p-2" ref={ref}>
            <p>Column 1</p>
            <br />
            <p>Number of callback calls {count}</p>
          </div>
          <div className="border rounded p-2">
            <p>Column 2</p>
          </div>
          <div className="border rounded p-2">
            <p>Column 3</p>
          </div>
        </div>
      </div>
    );
  };

  beforeEach(() => mount(<TestingComponent />));

  it('should execute the callback when clicking outside Column 1', () => {
    cy.contains('p', 'Number of callback calls 0');

    cy.contains('p', 'Column 2').click();
    cy.contains('p', 'Number of callback calls 1');

    cy.contains('p', 'Column 3').click();
    cy.contains('p', 'Number of callback calls 2');
  });

  it('should not execute the callback when clicking outside Column 1', () => {
    cy.contains('p', 'Number of callback calls 0');
    cy.contains('p', 'Column 2').click();
    cy.get('[data-testid="flex-container"]').click();
    cy.contains('p', 'Number of callback calls 2');

    cy.contains('p', 'Column 1').click();
    cy.contains('p', 'Number of callback calls 2').click();

    cy.contains('p', 'Number of callback calls 2');
  });
});
