import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { File, FileProps } from '../File';

describe('file', () => {
  let component: ShallowWrapper<File>;
  let props: FileProps;

  beforeEach(() => {
    const file = { originalname: 'Human name 1', filename: 'filename.ext', language: 'eng' };

    props = {
      file,
      entitySharedId: 'parentId',
      readonly: false,
    };

    // context = { confirm: jasmine.createSpy('confirm') };
  });

  const render = () => {
    component = shallow(<File {...props} />);
  };

  it('should render the file originalName and language', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('editing the file', () => {
    const editButton = component.find('.file-edit');
    editButton.simulate('click');
  });
});
