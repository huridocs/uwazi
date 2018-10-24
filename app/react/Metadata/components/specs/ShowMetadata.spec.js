import React from 'react';

import { caseTemplate, matterTemplate } from 'app/Timeline/utils/timelineFixedData';
import { shallow } from 'enzyme';

import { ShowMetadata } from '../ShowMetadata';


describe('Metadata', () => {
  let props;

  beforeEach(() => {
    props = {
      entity: {}
    };
  });

  it('should render without timeline by default', () => {
    props.entity = {};

    const component = shallow(<ShowMetadata {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should render templateType when showType', () => {
    props.showType = true;
    const component = shallow(<ShowMetadata {...props} />).find('.item-info');
    expect(component).toMatchSnapshot();
  });

  it('should render title and templateType when and showTitle', () => {
    props.showTitle = true;
    const component = shallow(<ShowMetadata {...props} />).find('.item-info');
    expect(component).toMatchSnapshot();
  });

  it('should render cejil timeline when template is cejils timeline configured templates', () => {
    props.entity = {
      template: caseTemplate
    };

    let component = shallow(<ShowMetadata {...props} />).find('.metadata-timeline-viewer');
    expect(component).toMatchSnapshot();

    props.entity = {
      template: matterTemplate
    };

    component = shallow(<ShowMetadata {...props} />).find('.metadata-timeline-viewer');
    expect(component).toMatchSnapshot();
  });
});
