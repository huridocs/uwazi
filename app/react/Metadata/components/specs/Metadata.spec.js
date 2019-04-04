import React from 'react';

import { shallow } from 'enzyme';

import Metadata from '../Metadata';


describe('Metadata', () => {
  let props;

  function testSnapshot() {
    const component = shallow(<Metadata {...props} />);
    expect(component).toMatchSnapshot();
  }

  beforeEach(() => {
    props = {};
  });

  const prepareMultivalueMetadata = () => [
    { label: 'label array', value: [{ value: 'first_value', url: 'url1' }, { value: 'second_value', url: 'url2' }] }
  ];

  const testMetadata = (metadata) => {
    props.metadata = metadata;
    testSnapshot();
  };

  it('should not render metadata without value', () => {
    testMetadata([
      { label: 'Label', value: 'string value', name: 'label' },
      { label: 'Label2', name: 'label2' }
    ]);
  });

  it('should render string values', () => {
    testMetadata([{ label: 'Label', value: 'string value', name: 'label' }]);
  });

  it('should render array values separated by ", "', () => {
    testMetadata([{ name: 'label_array', label: 'label array', value: [{ value: 'first_value' }, { value: 'second_value' }] }]);
  });

  it('should render an image field', () => {
    testMetadata([{ name: 'image_label', label: 'Image Label', value: 'http://some.url.com/image.jpg', type: 'image', style: 'cover' }]);
  });

  it('should render a media field', () => {
    testMetadata([{ name: 'media_label', label: 'Media Label', value: 'http://youtube.com/videoid', type: 'media' }]);
  });

  it('should render a Markdown when the metadata is type mardown', () => {
    testMetadata([{ name: 'label_array', label: 'label array', value: 'some markdown text', type: 'markdown' }]);
  });

  it('should render a Geolocation viewer when the metadata is type geolocation', () => {
    testMetadata([{ name: 'geolocation_label', label: 'Geolocation Label', value: [{ lat: 13, lon: 7 }], type: 'geolocation', onlyForCards: true }]);
  });

  it('should render property not have this item when type is null', () => {
    testMetadata([{ name: 'metadata_without_property', label: 'metadata without property', type: null }]);
  });

  it('should render sorted property with sorted styles', () => {
    testMetadata([{ name: 'sortedby', label: 'sortedBy', value: 'string value', sortedBy: true }]);
  });

  it('should render links when the property has url', () => {
    testMetadata([{ name: 'withurl', label: 'withUrl', value: 'string value', url: 'url' }]);
  });

  it('should render links when multiple properties have url', () => {
    testMetadata(prepareMultivalueMetadata());
  });

  it('should not render an empty list', () => {
    testMetadata([{ label: 'label array', value: [] }]);
  });

  describe('when passing compact prop', () => {
    it('should pass it to ValueList', () => {
      props.metadata = prepareMultivalueMetadata();
      props.compact = true;
      testSnapshot();
    });
  });
});
