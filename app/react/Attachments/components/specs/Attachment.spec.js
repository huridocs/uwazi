import React from 'react';
import {shallow} from 'enzyme';

import {Attachment, mapStateToProps} from '../Attachment';
import {NeedAuthorization} from 'app/Auth';
import UploadButton from 'app/Metadata/components/UploadButton';
import AttachmentForm from 'app/Attachments/components/AttachmentForm';

describe('Attachment', () => {
  let component;
  let props;
  let file;
  let context;

  beforeEach(() => {
    file = {originalname: 'Human name 1', filename: 'filename.ext'};

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
      isSourceDocument: false
    };

    context = {confirm: jasmine.createSpy('confirm')};
  });

  let render = () => {
    component = shallow(<Attachment {...props} />, {context});
  };

  it('should render originalname of the attachment', () => {
    render();
    expect(component.find('.attachment-name').length).toBe(1);
    expect(component.find('.attachment-name').text()).toContain('Human name 1');
  });

  describe('when its being edited (and not readOnly)', () => {
    beforeEach(() => {
      props.beingEdited = true;
      props.readOnly = false;
    });

    it('should have an edition form that renames on submit', () => {
      render();

      expect(component.find(AttachmentForm).length).toBe(1);
      expect(component.find('.item').at(0).text()).not.toContain('Human name 1');

      const submit = component.find(AttachmentForm).props().onSubmit;
      submit();

      expect(props.renameAttachment).toHaveBeenCalledWith('parentId', 'model', 'storeKey');
    });

    it('should have a cancel edit button', () => {
      render();

      const cancelButton = component.find('.item-shortcut-group').find('a').at(0);

      expect(props.resetForm).not.toHaveBeenCalled();

      cancelButton.simulate('click');

      expect(props.resetForm).toHaveBeenCalledWith('model');
    });

    it('should have a save edit button that submits form', () => {
      render();

      const saveButton = component.find('.item-shortcut-group').find('a.item-shortcut.btn-success');

      expect(props.submitForm).not.toHaveBeenCalled();

      saveButton.simulate('click');

      expect(props.submitForm).toHaveBeenCalledWith('model', 'storeKey');
    });
  });

  it('should include an authorized delete button for each file', () => {
    render();
    const deleteButton = component.find('.attachment-buttons').find('a').at(1);

    expect(deleteButton.parents().at(2).is(NeedAuthorization)).toBe(true);
    expect(deleteButton.parent().props().if).toBe(true);

    deleteButton.simulate('click');
    expect(context.confirm).toHaveBeenCalled();

    context.confirm.calls.argsFor(0)[0].accept();
    expect(props.deleteAttachment).toHaveBeenCalledWith('parentId', file, 'storeKey');
  });

  it('should hold a thumbnail for PDFs and valid images', () => {
    props.file.filename = 'document.pdf';
    render();
    expect(component.find('.attachment-thumbnail i').props().className).toContain('fa-file-pdf-o');
    expect(component.find('.attachment-thumbnail > span').text()).toBe(' pdf');

    props.file.filename = 'image.jpg';
    render();
    expect(component.find('.attachment-thumbnail img').props().src).toBe('/api/attachments/download?_id=parentId&file=image.jpg');

    props.file.filename = 'image.JPG';
    render();
    expect(component.find('.attachment-thumbnail img').props().src).toBe('/api/attachments/download?_id=parentId&file=image.JPG');

    props.file.filename = 'image.doc';
    render();
    expect(component.find('.attachment-thumbnail').children().length).toBe(0);
  });

  it('should not render the replace button', () => {
    render();

    const replaceButton = component.find('.attachment').find(UploadButton);
    expect(replaceButton.parent().props().if).toBe(false);
  });

  describe('When is sourceDocument', () => {
    beforeEach(() => {
      props.isSourceDocument = true;
    });

    it('should not render the delete button on the first item', () => {
      render();
      const deleteButton = component.find('.attachment-buttons').find('a').at(1);
      expect(deleteButton.parent().props().if).toBe(false);
    });

    it('should include an authorized replace button on the first item', () => {
      render();
      const replaceButton = component.find('.attachment-buttons').find(UploadButton);

      expect(replaceButton.props().documentId).toBe(props.parentId);
      expect(replaceButton.props().storeKey).toBe('storeKey');
      expect(replaceButton.props().documentSharedId).toBe(props.parentSharedId);
      expect(replaceButton.parents().at(2).is(NeedAuthorization)).toBe(true);
      expect(replaceButton.parent().props().if).toBe(true);
    });
  });


  it('should allow downloading the attachment', () => {
    render();
    expect(component.find('.attachment-link').props().href).toBe('/api/attachments/download?_id=parentId&file=filename.ext');
  });

  describe('mapStateToProps', () => {
    it('should map if attachment is being edited', () => {
      let state = {attachments: {edit: {attachment: {_id: 'id'}}}};
      let ownProps = {file: {_id: 'id'}};
      expect(mapStateToProps(state, ownProps).beingEdited).toEqual(true);

      ownProps = {file: {_id: 'otherId'}};
      expect(mapStateToProps(state, ownProps).beingEdited).toEqual(false);
    });
  });
});
