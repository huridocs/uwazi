import React from 'react';
import { shallow } from 'enzyme';
import { fromJS as Immutable } from 'immutable';

import UploadSupportingFile from 'app/Attachments/components/UploadSupportingFile';
import AttachmentsList from '../AttachmentsList';

describe('AttachmentsList', () => {
  let component;
  let props;
  let files;

  beforeEach(() => {
    files = Immutable([
      { originalname: 'Human name 1', filename: 'filename1.ext' },
      { originalname: 'A Human name 2', filename: 'filename2.ext' },
    ]);

    props = {
      files,
      parentId: 'parentId',
      parentSharedId: 'parentSharedId',
      isDocumentAttachments: false,
      readOnly: false,
      storeKey: 'storeKey',
      entity: { sharedId: 'parentId' },
    };
  });

  const render = () => {
    component = shallow(<AttachmentsList {...props} />);
  };

  it('should render a sorted list of attachments (files)', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('When parent is Target Document', () => {
    beforeEach(() => {
      props.isTargetDoc = true;
      render();
    });

    it('should treat all Attachments as read only', () => {
      expect(component).toMatchSnapshot();
    });
  });

  describe('when it is read only', () => {
    it('should not display the upload button', () => {
      props.readOnly = true;
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('when files is empty', () => {
    it('should render nothing if user not logged in', () => {
      props.files = Immutable([]);
      render();
      expect(component).toMatchSnapshot();
    });

    it('should add button in Downloads section', () => {
      props.files = Immutable([]);
      props.user = Immutable({ _id: 'user' });
      render();
      expect(component).toMatchSnapshot();
    });
  });

  it('should check authorization roles to upload files', () => {
    render();
    const authorizationProps = component.find(UploadSupportingFile).parents().at(1).props();
    expect(authorizationProps.roles).toEqual(['admin', 'editor']);
    expect(authorizationProps.orWriteAccessTo).toEqual([props.entity]);
  });
});
