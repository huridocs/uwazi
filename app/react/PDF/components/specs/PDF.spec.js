/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
// import { PDFJS } from '../../../../../node_modules/pdfjs-dist/web/pdf_viewer.js';
import PDFJS from '../../PDFJS';

import PDF from '../PDF';
import PDFPage from '../PDFPage.js';

describe('PDF', () => {
  let component;
  let instance;
  const pdfObject = { numPages: 2 };

  let props;

  beforeEach(() => {
    spyOn(PDFJS, 'getDocument').and.returnValue({ promise: Promise.resolve(pdfObject) });
    props = {
      file: 'file_url',
      filename: 'original.pdf',
      onLoad: jasmine.createSpy('onLoad'),
      pdfInfo: Immutable.fromJS({
        1: { chars: 10 },
        2: { chars: 20 },
        3: { chars: 30 },
        4: { chars: 40 },
        5: { chars: 50 },
      }),
    };
  });

  const render = () => {
    component = shallow(<PDF {...props} />);
    instance = component.instance();
    spyOn(instance, 'setState').and.callThrough();
  };

  describe('on instance', () => {
    it('should get the pdf with pdfjs', done => {
      render();
      expect(PDFJS.getDocument).toHaveBeenCalledWith(props.file);
      setTimeout(() => {
        expect(instance.setState).toHaveBeenCalledWith({ pdf: pdfObject });
        done();
      });
    });
  });

  describe('onPDFReady', () => {
    it('should be called on the first render of the PDF pages (only once)', () => {
      props.onPDFReady = jasmine.createSpy('onPDFReady');
      render();
      instance.componentDidUpdate();
      expect(props.onPDFReady).not.toHaveBeenCalled();

      component.setState({ pdf: { numPages: 5 } });
      expect(props.onPDFReady).toHaveBeenCalled();

      props.onPDFReady.calls.reset();
      component.setState({ pdf: { numPages: 5 } });
      expect(props.onPDFReady).not.toHaveBeenCalled();
    });
  });

  describe('on componentWillReceiveProps', () => {
    it('should not attempt to get the PDF if filname remains unchanged', () => {
      render();
      instance.componentWillReceiveProps({ filename: 'original.pdf' });
      expect(PDFJS.getDocument.calls.count()).toBe(1);
    });

    it('should get the new PDF if filename changed', done => {
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

  describe('pageVisibility', () => {
    it('should save page and visibility and execute onPageChange', () => {
      props.onPageChange = jasmine.createSpy('onPageChange');

      render();
      const page = 2;
      const visibility = 500;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).toHaveBeenCalledWith(2);
    });

    it('should call pageChange when visibility is the highest and the page is diferent from before', () => {
      props.onPageChange = jasmine.createSpy('onPageChange');

      render();
      instance.pages = { 2: null };

      let page = 3;
      let visibility = 555;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).toHaveBeenCalledWith(3);

      props.onPageChange.calls.reset();
      page = 4;
      visibility = 550;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).not.toHaveBeenCalled();

      props.onPageChange.calls.reset();
      page = 4;
      visibility = 560;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).toHaveBeenCalledWith(4);
    });

    describe('in case of equal visibility', () => {
      it('should use the smallest one', () => {
        props.onPageChange = jasmine.createSpy('onPageChange');
        render();

        let page = 30;
        let visibility = 10;
        instance.onPageVisible(page, visibility);
        expect(props.onPageChange).toHaveBeenCalledWith(30);

        props.onPageChange.calls.reset();
        page = 29;
        visibility = 10;
        instance.onPageVisible(page, visibility);
        expect(props.onPageChange).toHaveBeenCalledWith(29);
      });
    });

    describe('when pageHidden', () => {
      it('should remove page key from pages map', () => {
        render();
        instance.pages = { 1: 10, 2: 20 };
        instance.onPageHidden(1);

        expect(instance.pages).toEqual({ 2: 20 });
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

  describe('onLoad', () => {
    it('should be called when there is no pages loading with the range of characters being rendered', () => {
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
