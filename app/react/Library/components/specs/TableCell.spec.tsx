/**
 * @jest-environment jsdom
 */

import { I18NLink } from 'app/I18N';
import { TableCell, TableCellProps } from 'app/Library/components/TableCell';
import { shallow } from 'enzyme';
import React from 'react';
import MarkdownViewer from 'app/Markdown';

describe('TableCell', () => {
  let component: any;
  const props: TableCellProps = {
    content: { label: 'Title', type: 'text', name: 'title', value: 'Entity 1' },
    dateFormat: '',
    zoomLevel: 1,
  };

  function renderContent() {
    component = shallow(<TableCell {...props} />);
    const cells = component.find('.table-view-cell');
    return cells.at(0);
  }

  it.each`
    label       | type             | name         | value
    ${'Title'}  | ${'text'}        | ${'title'}   | ${'Title 1'}
    ${'Date'}   | ${'date'}        | ${'date'}    | ${'May 20, 2019'}
    ${'AutoId'} | ${'generatedid'} | ${'auto_id'} | ${'XYZ-1234'}
  `(
    'should render a plain content with the passed value for $type',
    ({ label, type, name, value }) => {
      props.content = { label, type, name, value };
      const cellContent = renderContent();
      expect(cellContent.props().children).toBe(value);
    }
  );

  it('should render a date with as value passed', () => {
    const formattedPropertyDate = 'May 20, 2019';
    props.content = { label: 'Date', type: 'date', name: 'date', value: formattedPropertyDate };
    const cellContent = renderContent();
    expect(cellContent.props().children).toBe(formattedPropertyDate);
  });

  it('should render a multi select as a list of values', () => {
    props.content = {
      label: 'Languages',
      type: 'multiselect',
      name: 'languages',
      value: [{ value: 'Español' }, { value: 'English' }],
    };
    const cellContent = renderContent();
    expect(cellContent.props().children).toBe('Español, English');
  });

  it('should render an external link', () => {
    props.content = {
      label: 'Google',
      type: 'link',
      name: 'google',
      value: {
        label: 'google',
        url: 'www.google.com',
        value: null,
      },
    };
    const cellContent = renderContent();
    expect(cellContent.find('a').props().href).toBe('www.google.com');
  });

  it('should render a relationship as a list of links', () => {
    props.content = {
      label: 'Relationship',
      type: 'relationship',
      name: 'relationship',
      value: [
        {
          url: '/entity/Entity1',
          value: 'Entity1',
        },
        {
          url: '/entity/Entity2',
          value: 'Entity2',
        },
      ],
    };
    const cellContent = renderContent();
    const links = cellContent.find(I18NLink);
    expect(cellContent.text()).toBe('<Connect(I18NLink) />, <Connect(I18NLink) />');
    expect(links.at(0).props().to).toBe('/entity/Entity1');
  });

  it('should render a geolocation as a compact view', () => {
    props.content = {
      label: 'Geolocation',
      type: 'geolocation',
      name: 'geolocation',
      value: [{ lon: 2, lat: 46, value: null }],
    };
    const cellContent = renderContent();
    const geolocationProps = cellContent.props().children.props;
    expect(geolocationProps.points).toEqual([{ lon: 2, lat: 46, value: null }]);
    expect(geolocationProps.onlyForCards).toBe(true);
  });

  it('should render a rich text as a markdown', () => {
    props.content = {
      label: 'Rich Text',
      type: 'markdown',
      name: 'rich_text',
      value: '**bold**',
    };
    const cellContent = renderContent();
    expect(cellContent.find(MarkdownViewer).props().markdown).toBe('**bold**');
  });

  it('should not render if value is empty', () => {
    props.content = {
      label: 'Empty Select',
      type: 'select',
      name: 'empty_select',
    };
    const cellContent = renderContent();
    expect(cellContent.props().children).toBe(undefined);
  });

  it('should not render entity has not value for column', () => {
    delete props.content;
    const cellContent = renderContent();
    expect(cellContent.props().children).toBe(undefined);
  });

  it('should not render if the type is not supported', () => {
    props.content = {
      label: 'Non supported Image',
      type: 'image',
      name: 'non_supported_image',
      value: [{ value: 'url' }],
    };
    const cellContent = renderContent();
    expect(cellContent.props().children).toEqual(undefined);
  });
});
