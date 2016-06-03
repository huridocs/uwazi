import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';
import SocketMock from 'socket-io-mock';
import {UploadsList, mapStateToProps} from 'app/Uploads/components/UploadsList';
import UploadDoc from 'app/Uploads/components/UploadDoc';

describe('DocumentsList', () => {
  let component;
  let props;
  let socket = new SocketMock();
  let documents = Immutable.fromJS([{title: 'Document one', _id: '1'}, {title: 'Document two', _id: '2'}]);

  beforeEach(() => {
    let conversionComplete = jasmine.createSpy('conversionComplete');
    let updateDocument = jasmine.createSpy('updateDocument');
    props = {documents, socket, conversionComplete, updateDocument};
    component = shallow(<UploadsList {...props} />);
  });

  it('should render a UploadDoc element for each document', () => {
    let docs = component.find(UploadDoc);
    expect(docs.length).toBe(2);
    expect(docs.first().props().doc).toEqual(documents.get(0));
    expect(docs.last().props().doc).toEqual(documents.get(1));
  });

  describe('when socket event documentProcessed', () => {
    it('should call conversionComplete with the id', () => {
      socket.socketClient.emit('documentProcessed', 'doc_id_1');
      expect(props.conversionComplete).toHaveBeenCalledWith('doc_id_1');
    });
  });

  describe('when socket event conversionFailed', () => {
    it('should call updateDocument with the doc processed false', () => {
      socket.socketClient.emit('conversionFailed', 'doc_id_1');
      expect(props.updateDocument).toHaveBeenCalledWith({_id: 'doc_id_1', processed: false});
    });
  });

  describe('maped state', () => {
    it('should contain the documents', () => {
      let store = {
        uploads: {
          documents
        }
      };
      let state = mapStateToProps(store);
      expect(state).toEqual({documents});
    });
  });
});
