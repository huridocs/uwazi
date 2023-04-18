/**
 * @jest-environment jsdom
 */

import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ImageViewer, ImageViewerProps } from 'app/Metadata/components/ImageViewer';

describe('ImageViewer', () => {
  let component: ShallowWrapper;
  let imageProps: ImageViewerProps;

  beforeEach(() => {
    imageProps = {
      alt: 'Image',
      className: 'class',
      key: '1',
      src: 'fixtures/image.jpg',
    };
  });

  const render = () => {
    component = shallow(<ImageViewer {...imageProps} />);
  };

  describe('render', () => {
    it('should render', () => {
      render();
      const props = component.getElement().props;
      expect(imageProps).toEqual({
        alt: props.alt,
        className: props.className,
        key: '1',
        src: props.src,
      });
    });
  });
});
