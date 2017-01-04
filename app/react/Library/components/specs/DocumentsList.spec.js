import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {DocumentsList, mapStateToProps} from 'app/Library/components/DocumentsList';
import Doc from 'app/Library/components/Doc';
import SortButtons from 'app/Library/components/SortButtons';

describe('DocumentsList', () => {
  let component;
  let props;
  let documents = Immutable.fromJS({rows: [{title: 'Document one', _id: '1'}, {title: 'Document two', _id: '2'}], totalRows: 2});

  beforeEach(() => {
    props = {
      documents: documents.toJS(),
      searchDocuments: () => {}
    };
  });

  let render = () => {
    component = shallow(<DocumentsList {...props} />);
  };

  it('should have with-panel class', () => {
    render();
    expect(component.find('main').hasClass('with-panel')).toBe(true);
  });

  it('should render a Doc element for each document', () => {
    render();
    let docs = component.find(Doc);
    expect(docs.length).toBe(2);
    expect(docs.first().props().doc.get('title')).toBe('Document one');
  });

  it('should hold sortButtons with search callback', () => {
    render();
    expect(component.find(SortButtons).props().sortCallback).toBe(props.searchDocuments);
  });

  describe('maped state', () => {
    it('should contain the documents', () => {
      let store = {
        library: {
          documents: documents,
          ui: Immutable.fromJS({filtersPanel: 'panel', selectedDocument: 'selected'})
        }
      };
      let state = mapStateToProps(store);
      expect(state).toEqual({documents: documents.toJS(), filtersPanel: 'panel', selectedDocument: 'selected'});
    });
  });
});
