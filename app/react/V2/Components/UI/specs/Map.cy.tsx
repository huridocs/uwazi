import React from 'react';
import { mount } from '@cypress/react18';
import { Provider } from 'react-redux';
import { LEGACY_createStore as createStore } from '../../../testing/reduxStore';
import { LMap } from '../../../../Map/LMap';

describe('LMap Component', () => {
  beforeEach(() => {
    mount(
      <Provider store={createStore()}>
        <div className="scrollable-content" style={{ height: '500px', overflow: 'auto' }}>
          <span>
            {'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In nec libero'.repeat(100)}
          </span>
          <LMap
            showControls
            height={500}
            startingPoint={[{ lat: 40, lon: 15 }]}
            templatesInfo={{}}
            tilesProvider="mapbox"
            mapApiKey=""
            onClick={() => ({})}
          />
          <span>{'MORE CONTENT / '.repeat(200)}</span>
          <span className="ending-content">ENDING</span>
        </div>
      </Provider>
    );
  });
  it('should render the map on a larger page and scroll to the bottom', () => {
    cy.get('.leaflet-container').should('exist');
    cy.get('div').realMouseWheel({ deltaY: 1500, scrollBehavior: 'bottom' });
    cy.contains('ENDING').should('be.visible');

    cy.get('div.scrollable-content').then($div => {
      const scrollTop = $div.scrollTop();
      const scrollHeight = $div.prop('scrollHeight');
      const clientHeight = $div.prop('clientHeight');

      expect(scrollTop + clientHeight).to.be.equal(scrollHeight);
    });
  });

  it('should enable scrollWheelZoom on click', () => {
    cy.get('.leaflet-container').scrollIntoView();
    cy.get('.leaflet-container').click();
    cy.get('div').realMouseWheel({ deltaY: 1500, scrollBehavior: 'bottom' });
    cy.get('div.scrollable-content').then($div => {
      const scrollTop = $div.scrollTop();
      const scrollHeight = $div.prop('scrollHeight');
      const clientHeight = $div.prop('clientHeight');
      expect(scrollTop + clientHeight).to.be.lessThan(scrollHeight - 400);
    });
  });
});
