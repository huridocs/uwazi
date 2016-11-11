import React from 'react';
import {shallow} from 'enzyme';
import {PDFJS} from '../../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';

import PDF from '../PDF';
import PDFPage from '../PDFPage.js';

describe('PDF', () => {
  let component;
  let instance;
  const pdfObject = {numPages: 2};

  let props;

  beforeEach(() => {
    spyOn(PDFJS, 'getDocument').and.returnValue(Promise.resolve(pdfObject));
    props = {
      file: 'file_url',
      onLoad: jasmine.createSpy('onLoad')
    };
  });

  let render = () => {
    component = shallow(<PDF {...props}/>);
    instance = component.instance();
    spyOn(instance, 'setState').and.callThrough();
  };

  describe('on instance', () => {
    it('should get the pdf file and set pdf Object to state', (done) => {
      render();
      expect(PDFJS.getDocument).toHaveBeenCalledWith(props.file);
      setTimeout(() => {
        expect(instance.setState).toHaveBeenCalledWith({pdf: pdfObject});
        done();
      });
    });
  });

  describe('render', () => {
    it('should render a pdfPage for each page', () => {
      render();
      instance.setState({pdf: {numPages: 3}});
      component.update();
      expect(component.find(PDFPage).length).toBe(3);
    });
  });

  describe('onLoad', () => {
    it('should be called when all pages are loaded', () => {
      render();
      instance.setState({pdf: {numPages: 3}});
      instance.pageLoaded();
      instance.pageLoaded();
      instance.pageLoaded();
      expect(props.onLoad).toHaveBeenCalled();
    });
  });
});
