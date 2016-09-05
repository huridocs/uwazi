import React from 'react';
import {shallow} from 'enzyme';
import {TabLink, TabContent} from 'react-tabs-redux';

import MarkDown from '../MarkDown';

describe('MarkDown', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      value: '<b>This is a title</b>',
      onChange: jasmine.createSpy('onChange')
    };
  });

  let render = () => {
    component = shallow(<MarkDown {...props}/>);
  };

  it('should have an edit tab with a textarea', () => {
    render();

    let tablinks = component.find(TabLink);
    expect(tablinks.first().props().to).toBe('edit');

    let tabs = component.find(TabContent);
    expect(tabs.first().props().for).toBe('edit');

    let textarea = tabs.first().find('textarea');
    expect(textarea.length).toBe(1);
  });

  it('should put the value in the textarea', () => {
    render();
    let textarea = component.find(TabContent).first().find('textarea');
    expect(textarea.props().value).toBe('<b>This is a title</b>');
  });

  describe('preview tab', () => {
    it('shows markdown as html', () => {
      props.value = '# <b>This is a title</b>';
      render();
      let container = component.find(TabContent).last().find('div');
      expect(container.props().dangerouslySetInnerHTML).toEqual({__html: '<h1 id="-b-this-is-a-title-b-">&lt;b&gt;This is a title&lt;/b&gt;</h1>\n'});
    });
  });
});
