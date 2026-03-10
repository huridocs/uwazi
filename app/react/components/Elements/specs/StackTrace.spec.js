/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import { fromJS } from 'immutable';
import { Icon } from 'UI';

import StackTrace from '../StackTrace.js';

describe('StackTrace', () => {
  let component;
  const props = {
    message:
      'ValidationError: title: Path `title` is required. at new ValidationError ' +
      '(/Users/user/Sites/uwazi/node_modules/mongoose/lib /error/validation.js:27:11) ' +
      'at model.Document.invalidate (/Users/user/Sites/uwazi/node_modules/mongoose /lib/document.js:1775:32) at ' +
      '/Users/user/Sites/uwazi/node_modules/mongoose/lib/document.js:1647:17 ' +
      'at /Users/user/Sites/uwazi/node_modules/mongoose/lib/schematype.js:808:9 at _combinedTickCallback ' +
      '(internal/process/next_tick.js:131:7) at process._tickCallback (internal/process/next_tick.js:180:9)',
    validations: fromJS([
      {
        message: 'should be number',
        instancePath: ".metadata['number']",
        schemaPath: '#/metadataMatchesTemplateProperties',
      },
      {
        message: 'should be a date',
        instancePath: ".metadata['date']",
        schemaPath: '#/metadataMatchesTemplateProperties',
      },
    ]),
  };

  const render = () => {
    component = shallow(<StackTrace {...props} />);
  };

  it('should display a shortened message', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('expanded', () => {
    it('should display the full message', () => {
      render();
      component.find(Icon).parent().simulate('click');
      expect(component).toMatchSnapshot();
    });
  });
});
