import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import EntityTitle, { mapStateToProps } from '../EntityTitle.js';

describe('EntityTitle', () => {
  let component;
  let state;
  let props;

  beforeEach(() => {
    props = {
      context: 'template1',
      entity: 'entity1SharedId',
    };

    state = {
      thesauris: Immutable.fromJS([
        { type: 'notTemplate' },
        {
          type: 'template',
          _id: 'template1',
          values: [
            { id: 'entity1SharedId', label: 'Entity 1' },
            { id: 'entity2SharedId', label: 'Entity 2' },
          ],
        },
        {
          type: 'template',
          _id: 'template2',
          values: [{ id: 'entity3SharedId', label: 'Entity 3' }],
        },
      ]),
    };
  });

  const render = () => {
    const compoundProps = Object.assign({}, props, mapStateToProps(state, { ...props }));
    component = shallow(<EntityTitle.WrappedComponent {...compoundProps} />);
  };

  it('should render the entity title as found in thesauris', () => {
    render();
    expect(component).toMatchSnapshot();

    props.entity = 'entity2SharedId';
    render();
    expect(component).toMatchSnapshot();

    props.context = 'template2';
    props.entity = 'entity3SharedId';
    render();
    expect(component).toMatchSnapshot();
  });
});
