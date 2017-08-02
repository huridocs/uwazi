import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';
import {NeedAuthorization} from 'app/Auth';

import {AttachmentsList} from '../AttachmentsList';
import Attachment from '../Attachment';
import UploadAttachment from '../UploadAttachment';

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
      readOnly: false,
      storeKey: 'storeKey'
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

  it('should include and authorized UploadAttachment button', () => {
    render();
    expect(component.find(UploadAttachment).props().entityId).toBe('parentId');
    expect(component.find(UploadAttachment).props().storeKey).toBe('storeKey');
    expect(component.find(UploadAttachment).parent().parent().is(NeedAuthorization)).toBe(true);
    expect(component.find(UploadAttachment).parent().parent().props().roles).toEqual(['admin', 'editor']);
  });

  describe('When parent is Target Document', () => {
    beforeEach(() => {
      props.isTargetDoc = true;
      render();
    });

    it('should treat all Attachments as read only', () => {
      expect(component.find(Attachment).at(0).props().readOnly).toBe(true);
      expect(component.find(Attachment).at(1).props().readOnly).toBe(true);
    });

    it('should not include an UploadAttachment button', () => {
      expect(component.find(UploadAttachment).length).toBe(0);
    });
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

    it('should pass isSourceDocument true to the first attachment and the entity id', () => {
      expect(component.find(Attachment).at(0).props().isSourceDocument).toBe(true);
      expect(component.find(Attachment).at(0).props().file._id).toBe('parentId');
      expect(component.find(Attachment).at(1).props().isSourceDocument).toBe(false);
    });
  });
});
