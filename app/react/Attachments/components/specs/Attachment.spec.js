/**
 * @jest-environment jsdom
 */

import React from 'react';
import { shallow } from 'enzyme';

import AttachmentForm from 'app/Attachments/components/AttachmentForm';

import { Icon } from 'UI';

import { Attachment, mapStateToProps } from '../Attachment';

describe('Attachment', () => {
  let component;
  let props;
  let file;

  beforeEach(() => {
    file = { originalname: 'Human name 1', filename: 'filename.ext' };

    props = {
      file,
      parentId: 'parentId',
      storeKey: 'storeKey',
      model: 'model',
      parentSharedId: 'parentSharedId',
      deleteAttachment: jasmine.createSpy('deleteAttachment'),
      renameAttachment: jasmine.createSpy('renameAttachment'),
      loadForm: jasmine.createSpy('loadForm'),
      submitForm: jasmine.createSpy('submitForm'),
      resetForm: jasmine.createSpy('resetForm'),
      isSourceDocument: false,
      entity: { sharedID: 'parentSharedId' },
      mainContext: { confirm: jasmine.createSpy('confirm') },
    };
  });

  const render = () => {
    component = shallow(<Attachment {...props} />);
  };

  it('should render originalname of the attachment', () => {
    render();
    expect(component.find('.attachment-name').length).toBe(1);
    expect(component.find('.attachment-name').text()).toContain('Human name 1');
  });

  it('should hold a thumbnail for PDFs and valid images', () => {
    props.file.filename = 'document.pdf';
    render();
    expect(component.find('.attachment-thumbnail').find(Icon).props().icon).toContain('file-pdf');
    expect(component.find('.attachment-thumbnail > span').text()).toContain(' pdf');

    props.file.filename = 'image.jpg';
    render();
    expect(component.find('.attachment-thumbnail img').props().src).toBe('/api/files/image.jpg');

    props.file.filename = 'image.JPG';
    render();
    expect(component.find('.attachment-thumbnail img').props().src).toBe('/api/files/image.JPG');

    props.file.filename = 'image.doc';
    render();
    expect(component.find('.attachment-thumbnail').children().length).toBe(0);
  });

  it('should allow downloading the attachment', () => {
    render();
    expect(component.find('.attachment-link').props().href).toBe('/api/files/filename.ext');
  });

  it('should check authorization roles to listed attachment', () => {
    render();
    const authorizationProps = component.find('.attachment').children().at(1).props();
    expect(authorizationProps.roles).toEqual(['admin', 'editor']);
    expect(authorizationProps.orWriteAccessTo).toEqual([props.entity]);
  });

  describe('when its being edited (and not readOnly)', () => {
    beforeEach(() => {
      props.beingEdited = true;
      props.readOnly = false;
    });

    it('should have an edition form that renames on submit', () => {
      render();

      expect(component.find(AttachmentForm).length).toBe(1);
      expect(component.find('.attachment-name').at(0).text()).not.toContain('Human name 1');

      const submit = component.find(AttachmentForm).props().onSubmit;
      const newFile = { originalname: 'something new' };
      submit(newFile);

      expect(props.renameAttachment).toHaveBeenCalledWith(
        'parentSharedId',
        'model',
        'storeKey',
        newFile
      );
    });

    it('should have a cancel edit button', () => {
      render();

      const cancelButton = component.find('.item-shortcut-group').find('button').at(0);

      expect(props.resetForm).not.toHaveBeenCalled();

      cancelButton.simulate('click');

      expect(props.resetForm).toHaveBeenCalledWith('model');
    });

    it('should have a save edit button that submits form', () => {
      render();

      const saveButton = component
        .find('.item-shortcut-group')
        .find('button.item-shortcut.btn-success');

      expect(props.submitForm).not.toHaveBeenCalled();

      saveButton.simulate('click');

      expect(props.submitForm).toHaveBeenCalledWith('model', 'storeKey');
    });

    it('should include an authorized delete button for each file', () => {
      render();
      const deleteButton = component.find('.dropdown-menu').find('.is--delete');

      deleteButton.simulate('click');
      expect(props.mainContext.confirm).toHaveBeenCalled();

      props.mainContext.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteAttachment).toHaveBeenCalledWith('parentSharedId', file, 'storeKey');
    });

    it('should check authorization roles to listed attachment', () => {
      render();
      const attachmentButtons = component.find('.item-shortcut-group').children();
      const attachmentButtonsAuthorizationProps = attachmentButtons.at(0).props();
      expect(attachmentButtonsAuthorizationProps.roles).toEqual(['admin', 'editor']);
      expect(attachmentButtonsAuthorizationProps.orWriteAccessTo).toEqual([props.entity]);
    });
  });

  describe('read only', () => {
    it('should not display the delete or rename buttons', () => {
      props.readOnly = true;
      render();
      expect(component.exists({ children: 'Rename' })).toBe(false);
      expect(component.exists({ children: 'Delete' })).toBe(false);
    });
  });

  describe('mapStateToProps', () => {
    it('should map if attachment is being edited', () => {
      const state = { attachments: { edit: { attachment: { _id: 'id' } } } };
      let ownProps = { file: { _id: 'id' } };
      expect(mapStateToProps(state, ownProps).beingEdited).toEqual(true);

      ownProps = { file: { _id: 'otherId' } };
      expect(mapStateToProps(state, ownProps).beingEdited).toEqual(false);
    });
  });
});
