import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { mapStateToProps, MarkersComponent } from '../Markers.js';
import * as helper from '../helper';

describe('Markers component', () => {
  const externalTemplates = Immutable.fromJS(['templates']);
  const state = { templates: externalTemplates };
  const entities = Immutable.fromJS(['entities']);

  let props = { entities };

  beforeEach(() => {
    spyOn(helper, 'getMarkers').and.callFake((_entities, templates) =>
      _entities.toJS().concat(templates.toJS())
    );
    props = mapStateToProps(state, props);
  });

  it('should return processed markers from entities and templates', () => {
    const resultMarkers = [];

    shallow(
      <MarkersComponent {...props} entities={entities} templates={externalTemplates}>
        {markers => markers.map(m => resultMarkers.push(m))}
      </MarkersComponent>
    );

    expect(resultMarkers).toMatchSnapshot();
  });
});
