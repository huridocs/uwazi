import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {UploadsList, mapStateToProps} from 'app/Uploads/components/UploadsList';
import UploadDoc from 'app/Uploads/components/UploadDoc';

describe('DocumentsList', () => {
  let component;
  let documents;
  let props;

  beforeEach(() => {
    documents = Immutable.fromJS([{title: 'Document one', _id: '1'}, {title: 'Document two', _id: '2'}]);
    props = {documents};
    component = shallow(<UploadsList {...props} />);
  });

  it('should render a UploadDoc element for each document', () => {
    let docs = component.find(UploadDoc);
    expect(docs.length).toBe(2);
    expect(docs.first().props().doc).toBe(documents.get(0));
    expect(docs.last().props().doc).toBe(documents.get(1));
  });

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
