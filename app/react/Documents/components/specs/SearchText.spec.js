import React from 'react';
import {shallow} from 'enzyme';

import {SearchText} from '../SearchText.js';

fdescribe('SearchText', () => {
  let component;
  //let instance;
  let props;

  let render = () => {
    component = shallow(<SearchText {...props}/>);
    //instance = component.instance();
  };

  beforeEach(() => {
    props = {
      snippets: [
        'first <b>snippet 1</b> found',
        'second <b>snippet 2</b> found',
        'third <b>snippet 3</b> found'
      ]
    };
    render();
  });

  it('should render all snippets with dangerouslySetInnerHTML', () => {
    let snippets = component.find('li');
    expect(snippets.length).toBe(3);
    expect(snippets.at(0).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets[0]});
    expect(snippets.at(1).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets[1]});
    expect(snippets.at(2).props().dangerouslySetInnerHTML).toEqual({__html: props.snippets[2]});
  });
});
