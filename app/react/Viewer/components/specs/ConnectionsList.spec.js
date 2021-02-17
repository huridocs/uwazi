import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { ConnectionsList } from 'app/Viewer/components/ConnectionsList';

describe('ConnectionsList', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      references: Immutable.fromJS([
        {
          _id: 'ref1',
          relationType: 'rel1',
          associatedRelationship: { entityData: { _id: '1' } },
          reference: {
            selectionRectangles: [{ top: 30, left: 20, height: 20, width: 42, page: '2' }],
            text: '',
          },
        },
        {
          _id: 'ref2',
          relationType: 'rel1',
          associatedRelationship: { entityData: { _id: '1' } },
          reference: {
            selectionRectangles: [{ top: 5, left: 20, height: 20, width: 42, page: '1' }],
            text: '',
          },
        },
        {
          _id: 'ref3',
          relationType: 'rel1',
          associatedRelationship: { entityData: { _id: '1' } },
          reference: {
            selectionRectangles: [{ top: 23, left: 20, height: 20, width: 42, page: '2' }],
            text: '',
          },
        },
        {
          _id: 'ref4',
          relationType: 'rel1',
          associatedRelationship: { entityData: { _id: '1' } },
          reference: {
            selectionRectangles: [{ top: 0, left: 20, height: 20, width: 42, page: '1' }],
            text: '',
          },
        },
      ]),
      referencedDocuments: Immutable.fromJS([
        { title: 'doc1', _id: '1' },
        { title: 'doc2', _id: '2' },
      ]),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      closePanel: jasmine.createSpy('closePanel'),
    };
  });

  const render = () => {
    component = shallow(<ConnectionsList {...props} />);
  };

  it('should merge and render references in order with the proper document titles', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when there are no references', () => {
    it('should render a blank state message', () => {
      props.references = Immutable.fromJS([]);
      render();
      expect(component).toMatchSnapshot();

      props.references = Immutable.fromJS([]);
      props.referencesSection = 'references';
      render();
      expect(component).toMatchSnapshot();
    });
  });
});
