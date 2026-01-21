import React from 'react';
import { shallow } from 'enzyme';


import UploadSupportingFile from '#app/Attachments/components/UploadSupportingFile.jsx';
import AttachmentsList from '#app/Attachments/components/AttachmentsList.jsx';
import Immutable from 'immutable';

// Removed destructuring - use Immutable.fromJS directly
describe('AttachmentsList', () => {
  let component;
  let props;
  let files;

  beforeEach(() => {
    files = Immutable.List([
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
      props.files = Immutable.fromJS([]);
      render();
      expect(component).toMatchSnapshot();
    });

    it('should add button in Downloads section', () => {
      props.files = Immutable.fromJS([]);
      props.user = Immutable.fromJS({ _id: 'user' });
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
