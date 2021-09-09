import React from 'react';
import Immutable from 'immutable';
import { ImportPanel } from 'app/Uploads/components/ImportPanel';
import { shallow } from 'enzyme';
import { LocalForm } from 'react-redux-form';

describe('ImportPanel', () => {
  let component;

  const props = {
    open: true,
    templates: Immutable.fromJS([{ name: 'superheroes', default: true, _id: 234 }]),
    uploadProgress: 0,
    importStart: false,
    importProgress: 0,
    closeImportPanel: jasmine.createSpy('closeImportPanel'),
    importData: jasmine.createSpy('importData'),
  };

  const render = () => {
    component = shallow(<ImportPanel {...props} />);
  };

  describe('submiting the form', () => {
    it('should call importData', () => {
      render();
      const values = {
        template: 234,
        file: { name: 'im a file!' },
      };
      component.find(LocalForm).simulate('submit', values);
      expect(props.importData).toHaveBeenCalledWith(values.file, values.template);
    });
  });

  describe('rendering states', () => {
    it('should render a form', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    describe('when the upload starts', () => {
      it('should render an upload progress', () => {
        props.uploadProgress = 23;
        render();
        expect(component).toMatchSnapshot();
      });
    });

    describe('when the import starts', () => {
      it('should render an upload progress', () => {
        props.importStart = true;
        props.importProgress = 189;
        render();
        expect(component).toMatchSnapshot();
      });
    });
  });
});
