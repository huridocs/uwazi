import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { File, FileProps } from '../File';

describe('file', () => {
  let component: ShallowWrapper<File>;
  let props: FileProps;
  let context: any;

  beforeEach(() => {
    const file = { originalname: 'Human_name_1.pdf', filename: 'random.ext', language: 'eng' };

    props = {
      file,
      entitySharedId: 'parentId',
      readonly: false,
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

    const language = component.find('.file-language').text();
    expect(language).toBe('english');
  });

  describe('editing the file', () => {
    // it('should render a form', () => {
    //   const editButton = component.find('.file-edit');
    //   editButton.simulate('click');
    //   expect(component).toMatchSnapshot();
    // });
  });
});
