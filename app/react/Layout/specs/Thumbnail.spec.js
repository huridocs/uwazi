import React from 'react';

import { shallow } from 'enzyme';

import { Thumbnail } from '../Thumbnail';

describe('Thumbnail', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = shallow(<Thumbnail {...props} />);
  };

  it('should render an image when file has image extension', () => {
    props.file = 'image.jpg';
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render pdf icon when .pdf extension', () => {
    props.file = 'pdf.pdf';
    render();
    expect(component).toMatchSnapshot();
  });

  it('should render generic file as default', () => {
    props.file = 'document.doc';
    render();
    expect(component).toMatchSnapshot();
  });
});
