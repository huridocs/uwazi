import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { OneUpEntityButtonsBase, OneUpEntityButtonsProps } from '../OneUpEntityButtons';

describe('EntityViewer', () => {
  let component: ShallowWrapper<OneUpEntityButtonsProps, {}, OneUpEntityButtonsBase>;
  let props: OneUpEntityButtonsProps;
  let context: any;

  beforeEach(() => {
    context = { confirm: jasmine.createSpy('confirm') };
    props = {
      isPristine: true,
      isLast: false,
      thesaurusName: 'name',
      switchOneUpEntity: jasmine.createSpy('switchOneUpEntity'),
    };
  });

  const render = () => {
    component = shallow(<OneUpEntityButtonsBase {...props} />, { context });
  };

  it('should render pristine', () => {
    render();
    expect(component.find('div.content-footer > button').at(0).hasClass('btn-disabled')).toBe(true);
  });

  it('should render non-pristine', () => {
    props.isPristine = false;
    render();
    expect(component.find('div.content-footer > button').at(0).hasClass('btn-disabled')).toBe(
      false
    );
  });
});
