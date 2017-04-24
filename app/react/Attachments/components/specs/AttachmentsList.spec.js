import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {AttachmentsList} from '../AttachmentsList';
import Attachment from '../Attachment';

describe('AttachmentsList', () => {
  let component;
  let props;
  let files;

  beforeEach(() => {
    files = Immutable([
      {originalname: 'Human name 1', filename: 'filename1.ext'},
      {originalname: 'A Human name 2', filename: 'filename2.ext'}
    ]);

    props = {
      files,
      parentId: 'parentId',
      parentSharedId: 'parentSharedId',
      isDocumentAttachments: false,
      readOnly: false
    };
  });

  let render = () => {
    component = shallow(<AttachmentsList {...props} />);
  };

  it('should render a sorted list of attachments (files)', () => {
    render();
    expect(component.find(Attachment).length).toBe(2);
    expect(component.find(Attachment).at(1).props().file).toEqual(files.toJS()[0]);
    expect(component.find(Attachment).at(0).props().file).toEqual(files.toJS()[1]);
  });

  it('should pass props to every attachment', () => {
    render();
    expect(component.find(Attachment).at(0).props().parentId).toBe('parentId');
    expect(component.find(Attachment).at(0).props().parentSharedId).toBe('parentSharedId');
    expect(component.find(Attachment).at(0).props().isSourceDocument).toBe(false);
    expect(component.find(Attachment).at(0).props().readOnly).toBe(false);
  });


  describe('when files is empty', () => {
    it('should render nothing', () => {
      props.files = Immutable([]);
      render();
      expect(component.find(Attachment).length).toBe(0);
    });
  });

  describe('When isDocumentAttachments', () => {
    beforeEach(() => {
      props.isDocumentAttachments = true;
      render();
    });

    it('should pass isSourceDocument true to the first attachment', () => {
      expect(component.find(Attachment).at(0).props().isSourceDocument).toBe(true);
      expect(component.find(Attachment).at(1).props().isSourceDocument).toBe(false);
    });
  });
});
