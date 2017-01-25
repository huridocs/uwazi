import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {AttachmentsList} from '../AttachmentsList';
import {NeedAuthorization} from 'app/Auth';
import UploadButton from 'app/Metadata/components/UploadButton';

fdescribe('AttachmentsList', () => {
  let component;
  let props;
  let files;
  let context;

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
      deleteAttachment: jasmine.createSpy('deleteAttachment')
    };

    context = {confirm: jasmine.createSpy('confirm')};
  });

  let render = () => {
    component = shallow(<AttachmentsList {...props} />, {context});
  };

  it('should render a sorted list of attachments (files)', () => {
    render();
    expect(component.find('.item').length).toBe(2);
    expect(component.find('.item').at(0).text()).toContain('A Human name 2');
    expect(component.find('.item').at(1).text()).toContain('Human name 1');
  });

  it('should include an authorized delete button for each file', () => {
    render();
    const delete1 = component.find('.item').at(0).find('a').at(0);
    const delete2 = component.find('.item').at(1).find('a').at(0);

    expect(delete1.parent().parent().is(NeedAuthorization)).toBe(true);
    expect(delete1.parent().props().if).toBe(true);

    delete1.simulate('click');
    expect(context.confirm).toHaveBeenCalled();

    context.confirm.calls.argsFor(0)[0].accept();
    expect(props.deleteAttachment).toHaveBeenCalledWith('parentId', files.get(1).toJS());

    delete2.simulate('click');
    context.confirm.calls.argsFor(1)[0].accept();
    expect(props.deleteAttachment).toHaveBeenCalledWith('parentId', files.get(0).toJS());
  });

  it('should not render the replace button', () => {
    render();

    const replace1 = component.find('.item').at(0).find(UploadButton);
    expect(replace1.parent().props().if).toBe(false);
  });

  describe('When isDocumentAttachments', () => {
    beforeEach(() => {
      props.isDocumentAttachments = true;
      render();
    });

    it('should not render the delete button on the first item', () => {
      const delete1 = component.find('.item').at(0).find('a').at(0);
      const delete2 = component.find('.item').at(1).find('a').at(0);
      expect(delete1.parent().props().if).toBe(false);
      expect(delete2.parent().props().if).toBe(true);
    });

    it('should include an authorized replace button on the first item', () => {
      render();
      const replace1 = component.find('.item').at(0).find(UploadButton);
      const replace2 = component.find('.item').at(1).find(UploadButton);

      expect(replace1.props().documentId).toBe(props.parentId);
      expect(replace1.props().documentSharedId).toBe(props.parentSharedId);
      expect(replace1.parent().parent().is(NeedAuthorization)).toBe(true);
      expect(replace1.parent().props().if).toBe(true);

      expect(replace2.parent().parent().is(NeedAuthorization)).toBe(true);
      expect(replace2.parent().props().if).toBe(false);
    });
  });


  it('should include a download button', () => {
    render();
    const download1 = component.find('.item').at(0).find('a').at(1);
    const download2 = component.find('.item').at(1).find('a').at(1);

    expect(download1.props().href).toBe('/api/attachments/download?_id=parentId&file=filename2.ext');
    expect(download2.props().href).toBe('/api/attachments/download?_id=parentId&file=filename1.ext');
  });
});
