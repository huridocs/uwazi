import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { LocalForm } from 'react-redux-form';
import { FileType } from 'shared/types/fileType';
import { File, FileProps } from '../File';
import { Translate } from 'app/I18N';

describe('file', () => {
  let component: ShallowWrapper<File>;
  let props: FileProps;
  let context: any;

  beforeEach(() => {
    const file: FileType = {
      originalname: 'Human_name_1.pdf',
      filename: 'random.ext',
      language: 'eng',
      status: 'ready',
    };
    const entity = { title: 'The humans', _id: '123', language: 'en' };

    props = {
      file,
      entity,
      readOnly: false,
      storeKey: 'library',
      updateFile: jasmine.createSpy('updateFile'),
      deleteFile: jasmine.createSpy('deleteFile'),
    };

    context = { confirm: jasmine.createSpy('confirm') };
  });

  const render = () => {
    component = shallow(<File {...props} />, { context });
  };

  it('should render the file originalName and language', () => {
    render();
    const title = component.find('.file-originalname').text();
    expect(title).toBe('Human_name_1.pdf');

    const language = component
      .find('.file-language')
      .find(Translate)
      .props().children;
    expect(language).toBe('english');
  });

  describe('editing the file', () => {
    it('should render a form with the file', () => {
      render();
      const editButton = component.find('.file-edit');
      editButton.simulate('click');
      expect(component.find(LocalForm).props().initialState).toEqual(props.file);
    });

    it('should call updateFile on submit', () => {
      render();
      const editButton = component.find('.file-edit');
      editButton.simulate('click');
      const form = component.find(LocalForm);
      form.simulate('submit', props.file);
      expect(props.updateFile).toHaveBeenCalledWith(props.file, props.entity);
    });

    it('should confirm the delete', () => {
      render();
      component.find('.file-edit').simulate('click');
      component.find('.btn-outline-danger').simulate('click');
      expect(context.confirm).toHaveBeenCalled();
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteFile).toHaveBeenCalledWith(props.file, props.entity);
    });
  });
});
