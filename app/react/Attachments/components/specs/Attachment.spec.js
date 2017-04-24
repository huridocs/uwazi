import React from 'react';
import {shallow} from 'enzyme';

import {Attachment} from '../Attachment';
import {NeedAuthorization} from 'app/Auth';
import UploadButton from 'app/Metadata/components/UploadButton';

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
      parentSharedId: 'parentSharedId',
      deleteAttachment: jasmine.createSpy('deleteAttachment'),
      loadForm: jasmine.createSpy('loadForm'),
      isSourceDocument: false
    };

    context = {confirm: jasmine.createSpy('confirm')};
  });

  let render = () => {
    component = shallow(<Attachment {...props} />, {context});
  };

  it('should render originalname of the attachment', () => {
    render();
    expect(component.find('.item').length).toBe(1);
    expect(component.find('.item').at(0).text()).toContain('Human name 1');
  });

  it('should include an authorized delete button for each file', () => {
    render();
    const deleteButton = component.find('.item').find('a').at(1);

    expect(deleteButton.parent().parent().is(NeedAuthorization)).toBe(true);
    expect(deleteButton.parent().props().if).toBe(true);

    deleteButton.simulate('click');
    expect(context.confirm).toHaveBeenCalled();

    context.confirm.calls.argsFor(0)[0].accept();
    expect(props.deleteAttachment).toHaveBeenCalledWith('parentId', file);
  });

  it('should not render the replace button', () => {
    render();

    const replaceButton = component.find('.item').find(UploadButton);
    expect(replaceButton.parent().props().if).toBe(false);
  });

  describe('When is sourceDocument', () => {
    beforeEach(() => {
      props.isSourceDocument = true;
    });

    it('should not render the delete button on the first item', () => {
      render();
      const deleteButton = component.find('.item').find('a').at(1);
      expect(deleteButton.parent().props().if).toBe(false);
    });

    it('should include an authorized replace button on the first item', () => {
      render();
      const replaceButton = component.find('.item').at(0).find(UploadButton);

      expect(replaceButton.props().documentId).toBe(props.parentId);
      expect(replaceButton.props().documentSharedId).toBe(props.parentSharedId);
      expect(replaceButton.parent().parent().is(NeedAuthorization)).toBe(true);
      expect(replaceButton.parent().props().if).toBe(true);
    });
  });


  it('should include a download button', () => {
    render();
    const downloadButton = component.find('.item').find('a').at(2);

    expect(downloadButton.props().href).toBe('/api/attachments/download?_id=parentId&file=filename.ext');
  });
});
