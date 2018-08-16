import React from 'react';
import { shallow } from 'enzyme';
import { PDFJS } from '../../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';

import PDF from '../PDF';
import PDFPage from '../PDFPage.js';

describe('PDF', () => {
  let component;
  let instance;
  const pdfObject = { numPages: 2 };

  let props;

  beforeEach(() => {
    spyOn(PDFJS, 'getDocument').and.returnValue(Promise.resolve(pdfObject));
    props = {
      file: 'file_url',
      filename: 'original.pdf',
      onLoad: jasmine.createSpy('onLoad')
    };
  });

  const render = () => {
    component = shallow(<PDF {...props}/>);
    instance = component.instance();
    spyOn(instance, 'setState').and.callThrough();
  };

  describe('on instance', () => {
    it('should get the pdf with pdfjs', (done) => {
      render();
      expect(PDFJS.getDocument).toHaveBeenCalledWith(props.file);
      setTimeout(() => {
        expect(instance.setState).toHaveBeenCalledWith({ pdf: pdfObject });
        done();
      });
    });
  });

  describe('on componentWillReceiveProps', () => {
    it('should not attempt to get the PDF if filname remains unchanged', () => {
      render();
      instance.componentWillReceiveProps({ filename: 'original.pdf' });
      expect(PDFJS.getDocument.calls.count()).toBe(1);
    });

    it('should get the new PDF if filename changed', (done) => {
      render();
      instance.componentWillReceiveProps({ filename: 'newfile.pdf' });
      expect(Object.keys(instance.pagesLoaded).length).toBe(0);
      expect(instance.setState.calls.argsFor(0)[0]).toEqual({ pdf: { numPages: 0 } });
      expect(PDFJS.getDocument.calls.count()).toBe(2);
      setTimeout(() => {
        expect(instance.setState.calls.count()).toBe(3);
        expect(instance.setState).toHaveBeenCalledWith({ pdf: pdfObject });
        done();
      });
    });
  });

  describe('render', () => {
    it('should render a pdfPage for each page', () => {
      render();
      instance.setState({ pdf: { numPages: 3 } });
      component.update();
      expect(component.find(PDFPage).length).toBe(3);
    });
  });

  describe('loaded', () => {
    it('should call onLoad only when the pages are consecutive', () => {
      props.pdfInfo = {
        1: { chars: 10 },
        2: { chars: 20 },
        3: { chars: 30 },
        4: { chars: 40 },
        5: { chars: 50 }
      };

      render();
      instance.pageLoaded(1);
      expect(props.onLoad).toHaveBeenCalled();
      props.onLoad.calls.reset();
      instance.pageLoaded(2);
      expect(props.onLoad).toHaveBeenCalled();
      props.onLoad.calls.reset();
      instance.pageLoaded(5);
      expect(props.onLoad).not.toHaveBeenCalled();
    });
  });

  describe('scrollToPage', () => {
    it('should be called on the first onLoad when page prop is passed', () => {
      props.scrollToPage = jasmine.createSpy('scrollToPage');
      props.pdfInfo = {
        1: { chars: 10 },
        2: { chars: 20 }
      };
      render();
      instance.setState({ pdf: { numPages: 5 } });
      instance.pageLoaded(1);
      instance.pageLoading(2);
      instance.pageLoaded(2);
      expect(props.scrollToPage).not.toHaveBeenCalled();

      props.page = 5;
      render();
      instance.setState({ pdf: { numPages: 5 } });
      instance.pageLoaded(1);
      instance.pageLoading(2);
      instance.pageLoaded(2);
      expect(props.scrollToPage).toHaveBeenCalledWith(5);
    });
  });

  describe('onLoad', () => {
    it('should be called when there is no pages loading with the range of characters being rendered', () => {
      props.pdfInfo = {
        1: { chars: 10 },
        2: { chars: 20 },
        3: { chars: 30 },
        4: { chars: 40 },
        5: { chars: 50 }
      };
      render();
      instance.setState({ pdf: { numPages: 5 } });
      instance.pageLoaded(1);
      props.onLoad.calls.reset();
      instance.pageLoading(2);
      instance.pageLoaded(3);
      expect(props.onLoad).not.toHaveBeenCalled();
      instance.pageLoaded(2);
      expect(props.onLoad).toHaveBeenCalledWith({ start: 0, end: 30, pages: [1, 2, 3] });
    });

    it('should be called when a pages is unloaded', () => {
      props.pdfInfo = {
        1: { chars: 10 },
        2: { chars: 20 },
        3: { chars: 30 },
        4: { chars: 40 },
        5: { chars: 50 }
      };
      render();
      instance.setState({ pdf: { numPages: 5 } });

      instance.pageLoaded(1);
      instance.pageLoaded(2);
      instance.pageLoaded(3);
      props.onLoad.calls.reset();
      instance.pageUnloaded(3);

      expect(props.onLoad).toHaveBeenCalledWith({ start: 0, end: 20, pages: [1, 2] });
    });
  });
});
