import React from 'react';
import { shallow } from 'enzyme';
import { ThesauriFormGroup } from '../ThesauriFormGroup';

describe('ThesauriFormGroup', () => {
  let component;
  let instance;
  let props;
  beforeEach(() => {
    props = {
      value: {
        label: 'Group',
        id: 'group',
        values: [
          { label: 'Item1', id: 'item1' },
          { label: 'Item2', id: 'item2' },
        ],
      },
      index: 1,
      removeValue: jest.fn(),
      onChange: jest.fn(),
    };
  });

  const render = () => {
    component = shallow(<ThesauriFormGroup {...props} />);
    instance = component.instance();
  };

  describe('render', () => {
    it('should render group field and DragAndDropContainer for nested items', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should render each item as a ThesauriFormField specifying the groupIndex', () => {
      render();
      const renderedItem = instance.renderItem(props.value.values[0], 0);
      expect(renderedItem).toMatchSnapshot();
    });
  });

  describe('onChange', () => {
    it('should call the props.onChange function with the changed values and group index', () => {
      render();
      const values = [{ label: 'Item2' }, { label: 'Item1' }];
      instance.onChange(values);
      expect(props.onChange).toHaveBeenCalledWith(values, props.index);
    });
  });

  describe('delete button', () => {
    it('should remove group when clicked', () => {
      render();
      component
        .find('button')
        .first()
        .simulate('click');
      expect(props.removeValue).toHaveBeenCalledWith(props.index);
    });
  });
});
