import React from 'react';

import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { mapStateToProps, MarkersComponent } from '../Markers.js';
import * as helper from '../helper';

describe('Markers component', () => {
  const state = { templates: Immutable.fromJS(['templates']) };
  const entities = Immutable.fromJS(['entities']);

  let props;

  beforeEach(() => {
    spyOn(helper, 'getMarkers').and.callFake((_entities, templates) =>
      _entities.toJS().concat(templates.toJS())
    );
    props = mapStateToProps(state);
  });

  it('should return processed markers from entities and templates', () => {
    const resultMarkers = [];

    shallow(
      <MarkersComponent {...props} entities={entities}>
        {markers => markers.map(m => resultMarkers.push(m))}
      </MarkersComponent>
    );

    expect(resultMarkers).toMatchSnapshot();
  });
});
