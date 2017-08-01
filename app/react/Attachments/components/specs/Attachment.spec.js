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

    it('should render an edition form that renames on submit', () => {
      render();

      expect(component.find(AttachmentForm).length).toBe(1);
      expect(component.find('.item').at(0).text()).not.toContain('Human name 1');

      const submit = component.find(AttachmentForm).props().onSubmit;
      submit();

      expect(props.renameAttachment).toHaveBeenCalledWith('parentId', 'model');
    });

    it('should render a cancel edit button', () => {
      render();

      const cancelButton = component.find('.item-shortcut-group').find('a').at(0);

      expect(props.resetForm).not.toHaveBeenCalled();

      cancelButton.simulate('click');

      expect(props.resetForm).toHaveBeenCalledWith('model');
    });

    it('should render a save edit button that submits form', () => {
      render();

      const saveButton = component.find('.item-shortcut-group').find('a.item-shortcut.btn-success');

      expect(props.submitForm).not.toHaveBeenCalled();

      saveButton.simulate('click');

      expect(props.submitForm).toHaveBeenCalledWith('model');
    });
  });

  it('should include an authorized delete button for each file', () => {
    render();
    const deleteButton = component.find('.attachment-buttons').find('a').at(1);

    expect(deleteButton.parent().parent().parent().is(NeedAuthorization)).toBe(true);
    expect(deleteButton.parent().props().if).toBe(true);

    deleteButton.simulate('click');
    expect(context.confirm).toHaveBeenCalled();

    context.confirm.calls.argsFor(0)[0].accept();
    expect(props.deleteAttachment).toHaveBeenCalledWith('parentId', file);
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
      expect(replaceButton.props().documentSharedId).toBe(props.parentSharedId);
      expect(replaceButton.parent().parent().parent().is(NeedAuthorization)).toBe(true);
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

    //it('should return hasError true when pristine and invalid', () => {
      //let state = {namespace: {$form: {model: 'namespace'}, field: {pristine: false, valid: false}}};
      //expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(true);

      //state = {namespace: {$form: {model: 'namespace'}, field: {$form: {pristine: false, valid: false}}}};
      //expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(true);
    //});

    //it('should return hasError true when submitFailed and valid false and has not been touched', () => {
      //let state = {namespace: {$form: {model: 'namespace'}, field: {submitFailed: true, valid: false, pristine: true}}};
      //expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(true);
    //});

    //it('should return hasError false when submitFailed with no errors', () => {
      //let state = {namespace: {$form: {model: 'namespace'}, field: {submitFailed: true}}};
      //expect(mapStateToProps(state, {model: 'namespace', field: 'field'}).hasError).toBe(false);
    //});
  });
});
