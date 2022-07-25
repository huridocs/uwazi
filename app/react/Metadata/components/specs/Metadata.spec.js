import React from 'react';
import { shallow } from 'enzyme';
import MarkdownViewer from 'app/Markdown';
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
    {
      translateContext: 'oneTranslateContext',
      name: 'label_array',
      label: 'label array',
      type: 'relationship',
      value: [
        { value: 'first_value', url: 'url1' },
        { value: 'second_value', url: 'url2' },
      ],
    },
  ];

  const testMetadata = metadata => {
    props.metadata = metadata;
    testSnapshot();
  };

  it('should not render metadata without value', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        label: 'Label',
        value: 'string value',
        name: 'label',
      },
      { translateContext: 'oneTranslateContext', label: 'Label2', name: 'label2' },
    ]);
  });

  it('should render string values', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        label: 'Label',
        value: 'string value',
        name: 'label',
      },
    ]);
  });

  it('should render array values separated by ", "', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'label_array',
        label: 'label array',
        value: [{ value: 'first_value' }, { value: 'second_value' }],
      },
    ]);
  });

  it('should render an image field', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'image_label',
        label: 'Image Label',
        value: 'http://some.url.com/image.jpg',
        type: 'image',
        style: 'cover',
      },
    ]);
  });

  it('should render a link', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'link',
        label: 'Link',
        value: { url: 'url', label: 'label' },
        type: 'link',
      },
    ]);
  });

  it('should render a media field', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'media_label',
        label: 'Media Label',
        value: 'http://youtube.com/videoid',
        type: 'media',
      },
    ]);
  });

  it('should render a Markdown when the metadata is type mardown', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'label_array',
        label: 'label array',
        value: 'some markdown text',
        type: 'markdown',
      },
    ]);
  });

  it('should render a Geolocation viewer when the metadata is type geolocation', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'geolocation_label',
        label: 'Geolocation Label',
        value: [{ lat: 13, lon: 7 }],
        type: 'geolocation',
        onlyForCards: true,
      },
    ]);
  });

  describe('when groupGeolocations flag is true', () => {
    it('should group adjacent geolocation fields', () => {
      const metadata = [
        {
          translateContext: 'oneTranslateContext',
          name: 'geolocation_label',
          label: 'Geolocation Label',
          value: [{ lat: 13, lon: 7 }],
          type: 'geolocation',
          indexInTemplate: 0,
        },
        {
          translateContext: 'otherTranslateContext',
          name: 'inherited_geolocation',
          label: 'Inherited Geolocation',
          value: [
            { lat: 15, lon: 9, label: 'One' },
            { lat: 17, lon: 11, label: 'Two' },
          ],
          type: 'geolocation',
          indexInTemplate: 1,
        },
        {
          translateContext: 'oneTranslateContext',
          name: 'geolocation_label2',
          label: 'Geolocation Label2',
          value: [{ lat: 19, lon: 13 }],
          type: 'geolocation',
          indexInTemplate: 3,
        },
      ];

      const component = shallow(<Metadata metadata={metadata} groupGeolocations />);
      const geoGroups = component.find('.metadata-type-geolocation_group');
      expect(geoGroups.length).toBe(2);
      expect(geoGroups.find({ members: [metadata[0], metadata[1]] }).length).toBe(1);
      expect(geoGroups.find({ members: [metadata[2]] }).length).toBe(1);
    });
  });

  it('should render property not have this item when type is null', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'metadata_without_property',
        label: 'metadata without property',
        type: null,
      },
    ]);
  });

  it('should render sorted property with sorted styles', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'sortedby',
        label: 'sortedBy',
        value: 'string value',
        sortedBy: true,
      },
    ]);
  });

  it('should render links when the property has url', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'withurl',
        label: 'withUrl',
        value: 'string value',
        url: 'url',
        type: 'relationship',
      },
    ]);
  });

  it('should render links with icons if propery has url and icon', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'withurl',
        label: 'withUrl',
        value: 'string value',
        type: 'relationship',
        url: 'url',
        icon: { _id: 'icon', type: 'Icons' },
      },
    ]);
  });

  it('should render links when multiple properties have url', () => {
    testMetadata(prepareMultivalueMetadata());
  });

  it('should not render an empty list', () => {
    testMetadata([
      {
        translateContext: 'oneTranslateContext',
        name: 'label_array',
        label: 'label array',
        value: [],
      },
    ]);
  });

  describe('when passing compact prop', () => {
    it('should pass it to ValueList', () => {
      props.metadata = prepareMultivalueMetadata();
      props.compact = true;
      testSnapshot();
    });
  });

  describe('when passing a prop with parent', () => {
    it('should render the parent too', () => {
      props.metadata = [
        {
          name: 'name',
          label: 'label',
          value: 'Child Value',
          parent: 'Parent',
          type: 'select',
        },
      ];
      testSnapshot();
    });
  });

  describe('when passing a prop with multivalue and parents', () => {
    it('should render the list with the parents too', () => {
      props.metadata = [
        {
          name: 'name',
          label: 'label',
          value: [
            { parent: 'Parent', value: [{ value: 'one' }, { value: 'two' }] },
            { parent: 'Parent', value: [{ value: 'two' }] },
            { value: 'three' },
          ],
          parent: 'Parent',
        },
      ];
      testSnapshot();
    });
  });

  describe('when passing inheritted relationships', () => {
    it('should flatten the results for display purposes', () => {
      props.metadata = [
        {
          name: 'inherited from relationship',
          type: 'inherit',
          inheritedType: 'relationship',
          value: [
            { value: [{ value: 1, extraParams: 'not respected!' }, { value: 2 }] },
            { value: [{ value: 1 }, { value: 3 }] },
          ],
        },
      ];
      testSnapshot();
    });
  });

  describe('markdown with HTML', () => {
    it('should parse and use HTML tags in markdown fields', () => {
      props.metadata = [
        {
          translateContext: 'oneTranslateContext',
          name: 'label_array',
          label: 'label array',
          value: '<h1>A title in HTML</h1>',
          type: 'markdown',
        },
      ];
      const component = shallow(<Metadata {...props} />);
      const markdown = component.find(MarkdownViewer);
      expect(markdown.dive().props().children.type).toBe('h1');
    });

    it('should work with both mardown and HTML tags', () => {
      props.metadata = [
        {
          translateContext: 'oneTranslateContext',
          name: 'label_array',
          label: 'label array',
          value:
            '## A subtitle in markdown\n<a href="https://somesite.com" target="_blank">A link</a>',
          type: 'markdown',
        },
      ];
      const component = shallow(<Metadata {...props} />);
      const markdown = component.find(MarkdownViewer);
      expect(markdown.dive().props().children[0].type).toBe('h2');
      expect(markdown.dive().props().children[2].props.children.props).toEqual({
        href: 'https://somesite.com',
        target: '_blank',
        children: 'A link',
      });
    });
  });
});
