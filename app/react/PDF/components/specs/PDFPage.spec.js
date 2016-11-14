import React from 'react';
import {shallow} from 'enzyme';

import PDFPage from '../PDFPage.js';
import {PDFJS} from '../../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';

describe('PDFPage', () => {
  let component;
  let instance;
  const pdfObject = {
    getPage: jasmine.createSpy('getPage').and.returnValue(Promise.resolve({getViewport: () => {}}))
  };

  const draw = jasmine.createSpy('draw').and.returnValue(Promise.resolve());

  class PDFPageView {
    draw() {
      return draw();
    }
    setPdfPage() {}
  }

  PDFJS.PDFPageView = PDFPageView;
  let props;

  beforeEach(() => {
    props = {
      pdf: pdfObject,
      page: 1,
      onLoad: jasmine.createSpy('onLoad')
    };
  });

  let render = () => {
    component = shallow(<PDFPage {...props}/>);
    instance = component.instance();
  };

  describe('on mount', () => {
    it('should render the page', (done) => {
      render();
      instance.componentDidMount();
      setTimeout(() => {
        expect(draw).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('onLoad', () => {
    it('should be called when page is drawn', (done) => {
      render();
      instance.componentDidMount();
      setTimeout(() => {
        expect(props.onLoad).toHaveBeenCalled();
        done();
      });
    });
  });
});
