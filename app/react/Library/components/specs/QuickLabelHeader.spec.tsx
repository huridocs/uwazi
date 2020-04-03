import { shallow, ShallowWrapper } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';
import { QuickLabelHeaderBase, QuickLabelHeaderProps } from '../QuickLabelHeader';
import { thesauri } from '../../actions/specs/fixtures';

describe('QuickLabelPanel', () => {
  let component: ShallowWrapper<QuickLabelHeaderProps, {}, QuickLabelHeaderBase>;
  let props: Partial<QuickLabelHeaderProps>;

  beforeEach(() => {
    props = {
      quickLabelThesaurus: Immutable.fromJS(thesauri[0]),
    };
  });

  const render = () => {
    component = shallow(<QuickLabelHeaderBase {...props} />);
  };

  it('should render with thesaurus', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render without thesaurus', () => {
    props.quickLabelThesaurus = undefined;
    render();
    expect(component).toMatchSnapshot();
  });
});
