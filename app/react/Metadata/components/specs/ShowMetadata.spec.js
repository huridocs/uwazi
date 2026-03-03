import React from 'react';

import { caseTemplate, matterTemplate } from '#app/Timeline/utils/timelineFixedData.js';
import { shallow } from 'enzyme';

import { FormatMetadata } from '#app/Metadata/containers/FormatMetadata.js';
import { ShowMetadataView } from '../ShowMetadata.js';

describe('Metadata', () => {
  let props;

  beforeEach(() => {
    props = {
      entity: {},
    };
  });

  it('should render without timeline by default', () => {
    props.entity = {};

    const component = shallow(<ShowMetadataView {...props} />);
    expect(component.find('.metadata-timeline-viewer').parent().props().if).toBe(false);
  });

  it('should render templateType when showType', () => {
    props.showType = true;
    const component = shallow(<ShowMetadataView {...props} />).find('.item-info');
    expect(component).toMatchSnapshot();
  });

  it('should render title and templateType when and showTitle', () => {
    props.showTitle = true;
    const component = shallow(<ShowMetadataView {...props} />).find('.item-info');
    expect(component).toMatchSnapshot();
  });

  it('should render cejil timeline when template is cejils timeline configured templates', () => {
    props.entity = {
      template: caseTemplate,
    };

    let component = shallow(<ShowMetadataView {...props} />).find('.metadata-timeline-viewer');
    expect(component).toMatchSnapshot();

    props.entity = {
      template: matterTemplate,
    };

    component = shallow(<ShowMetadataView {...props} />).find('.metadata-timeline-viewer');
    expect(component).toMatchSnapshot();
  });

  it('should hide the label if the property is configured to', () => {
    const component = shallow(<ShowMetadataView {...props} />);
    const callback = component.find(FormatMetadata).props().renderLabel;
    expect(callback({ noLabel: true }, 'label')).toBeFalsy();
    expect(callback({}, 'label')).toBe('label');
  });
});
