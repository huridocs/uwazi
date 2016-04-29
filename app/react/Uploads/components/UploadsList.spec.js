import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {UploadsList, mapStateToProps} from 'app/Uploads/components/UploadsList';

describe('DocumentsList', () => {
  let component;
  let documents;
  let props;

  beforeEach(() => {
    documents = [{title: 'Document one', _id: '1'}, {title: 'Document two', _id: '2'}];
    props = {documents};
    component = shallow(<UploadsList {...props} />);
  });

  //it('should render a Doc element for each document', () => {
    //let docs = component.find('.document-list');
    //expect(docs.length).toBe(2);
  //});

  describe('maped state', () => {
    it('should contain the documents', () => {
      let store = {
        uploads: {
          documents: Immutable.fromJS(documents)
        }
      };
      let state = mapStateToProps(store);
      expect(state).toEqual({documents});
    });
  });
});
