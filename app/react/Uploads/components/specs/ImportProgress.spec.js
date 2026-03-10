/** @format */

import React from 'react';

import { ImportProgress } from 'app/Uploads/components/ImportProgress';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

describe('ImportProgress', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      importState: {
        importStart: true,
        importProgress: 5,
        importError: Immutable.fromJS({}),
        importEnd: false,
        importRowExceptions: Immutable.fromJS({}),
      },
      close: jasmine.createSpy('close'),
    };
  });

  const render = () => {
    component = shallow(<ImportProgress {...props} />);
  };

  const expectSnapshot = () => {
    render();
    expect(component).toMatchSnapshot();
  };

  describe('rendering states', () => {
    it('should render a state for normal progress', () => {
      expectSnapshot();
    });

    it('should render a state for errors', () => {
      props.importState.importError = Immutable.fromJS({ prettyMessage: 'Something bad happened' });
      expectSnapshot();

      props.importState.importError = Immutable.fromJS({
        prettyMessage: 'validation error',
        validations: [
          {
            message: 'should be number',
            instancePath: ".metadata['number']",
            schemaPath: '#/metadataMatchesTemplateProperties',
          },
        ],
      });
      expectSnapshot();
    });

    it('should render a state for end', () => {
      props.importState.importEnd = true;
      expectSnapshot();
    });

    it('should render a state for end with row exceptions', () => {
      props.importState.importEnd = true;
      props.importState.importRowExceptions = Immutable.fromJS({
        'Sanitized entries skipped in import': [
          {
            index: 0,
            property: 'select_with_spaces',
            reason: '',
            value: ' Item2 ',
          },
        ],
        'Another warning type': [
          {
            index: 1,
            property: 'another_property',
            reason: 'Invalid format',
            value: 'invalid_value',
          },
        ],
      });
      expectSnapshot();
    });
  });
});
