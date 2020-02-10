import React from 'react';
import { shallow } from 'enzyme';
import { ThesauriFormItem } from '../ThesauriFormItem';

describe('ThesauriFormItem', () => {
  let component;
  let props;
  beforeEach(() => {
    props = {
      value: {
        label: 'Item1',
        id: 'item1',
      },
      index: 1,
      removeValue: jest.fn(),
      onChange: jest.fn(),
    };
  });

  const render = () => {
    component = shallow(<ThesauriFormItem {...props} />);
  };

  it('should render ThesauriFormField if single item is provided', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render ThesauriFromGroup if item with values is provided', () => {
    props.value.values = [{ label: 'nested 1' }, { label: 'nested 2' }];
    render();
    expect(component).toMatchSnapshot();
  });
});
