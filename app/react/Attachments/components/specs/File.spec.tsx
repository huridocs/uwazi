import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { LocalForm } from 'app/Forms/Form';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import { File, FileProps } from '../File';

describe('file', () => {
  let component: ShallowWrapper<File>;
  let props: FileProps;

  beforeEach(() => {
    const file: FileType = {
      originalname: 'Human_name_1.pdf',
      filename: 'random.ext',
      language: 'eng',
      status: 'ready',
      _id: 'fileId',
    };
    const entity = { title: 'The humans', _id: '123', language: 'en' };

    props = {
      file,
      entity,
      updateFile: jasmine.createSpy('updateFile'),
      deleteFile: jasmine.createSpy('deleteFile'),
      mainContext: { confirm: jasmine.createSpy('confirm') },
    };
  });

  const render = () => {
    //eslint-disable-next-line react/jsx-props-no-spreading
    component = shallow(<File {...props} />);
  };

  it('should render the file originalName and language', () => {
    render();
    const title = component.find('.file-originalname').text();
    expect(title).toBe('Human_name_1.pdf');

    const language = component.find('.badge').find(Translate).props().children;
    expect(language).toBe('english');
  });

  describe('read only', () => {
    it('should render the edit button by default', () => {
      render();
      expect(component.exists('.file-edit')).toBe(true);
    });
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
      expect(props.mainContext.confirm).toHaveBeenCalled();
      (props.mainContext.confirm as jasmine.Spy).calls.argsFor(0)[0].accept();
      expect(props.deleteFile).toHaveBeenCalledWith(props.file, props.entity);
    });

    it('should check authorization roles to upload files', () => {
      render();
      const button = component.find('.file-edit');
      expect(button.parent().props().roles).toEqual(['admin', 'editor']);
      expect(button.parent().props().orWriteAccessTo).toEqual([props.entity]);
    });
  });
});
