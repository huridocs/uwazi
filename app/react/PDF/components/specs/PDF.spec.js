import React from 'react';
import {shallow} from 'enzyme';
import {PDFJS} from '../../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';

import PDF from '../PDF';
import PDFPage from '../PDFPage.js';

fdescribe('PDF', () => {
  let component;
  let instance;
  const pdfObject = {numPages: 2};

  let props;

  beforeEach(() => {
    spyOn(PDFJS, 'getDocument').and.returnValue(Promise.resolve(pdfObject));
    props = {
      file: 'file_url'
    };
  });

  let render = () => {
    component = shallow(<PDF {...props}/>);
    instance = component.instance();
    spyOn(instance, 'setState');
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
      instance.setState({numPages: 3});
      console.log(component.find(PDFPage));
      expect(component.find(PDFPage).length).toBe(3);
    });
  });
});
