import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { OneUpState } from 'app/istore';
import { OneUpTitleBarBase, OneUpTitleBarProps } from '../OneUpTitleBar';

describe('EntityViewer', () => {
  let component: ShallowWrapper<OneUpTitleBarProps, {}, OneUpTitleBarBase>;
  let props: OneUpTitleBarProps;

  beforeEach(() => {
    props = {
      isPristine: true,
      oneUpState: {
        reviewThesaurusName: 'Thes',
        reviewThesaurusId: 'id-thes',
        reviewThesaurusValues: ['Topic1'],
        indexInDocs: 3,
        totalDocs: 40,
        maxTotalDocs: 40,
      } as OneUpState,
      switchOneUpEntity: jasmine.createSpy('switchOneUpEntity'),
      mainContext: { confirm: jasmine.createSpy('confirm') },
    };
  });

  const render = () => {
    component = shallow(<OneUpTitleBarBase {...props} />);
  };

  // This component mainly composes spans, so full snapshot is the best way to get it right.
  it('should render 1', () => {
    render();
    expect(component).toMatchSnapshot();
    component.find('div.content-header-title > span > .btn-default').at(0).simulate('click');
    expect(props.mainContext.confirm).toHaveBeenCalledTimes(0);
  });

  // This component mainly composes spans, so full snapshot is the best way to get it right.
  it('should render 2', () => {
    props.isPristine = false;
    props.oneUpState = {
      ...props.oneUpState,
      indexInDocs: 0,
      reviewThesaurusName: '',
      reviewThesaurusValues: [],
      totalDocs: 10,
    };
    render();
    expect(component).toMatchSnapshot();
    component.find('.btn-default').at(1).simulate('click');
    expect(props.mainContext.confirm).toHaveBeenCalled();
  });
});
