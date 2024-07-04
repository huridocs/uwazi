/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import { PDFPage } from 'app/PDF';
import PDFJS from '../../PDFJS';
import PDF from '../PDF';

const legacyCharacterMapUrl = '/legacy_character_maps/';

jest.mock('../../PDFJS', () => ({
  default: {
    getDocument: () => {},
  },
  getDocument: () => {},
  EventBus: function () {},
}));

describe('PDF', () => {
  let component;
  let instance;
  const pdfObject = { numPages: 2 };

  let props;

  beforeEach(async () => {
    spyOn(PDFJS, 'getDocument').and.returnValue({ promise: Promise.resolve(pdfObject) });
    props = {
      file: 'file_url',
      filename: 'original.pdf',
      onLoad: jasmine.createSpy('onLoad'),
    };
  });

  const render = async () => {
    component = shallow(<PDF {...props} />);
    instance = component.instance();
    spyOn(instance, 'setState').and.callThrough();
  };

  describe('on instance', () => {
    it('should get the pdf with pdfjs', async () => {
      await render();
      expect(PDFJS.getDocument).toHaveBeenCalledWith({
        cMapPacked: true,
        cMapUrl: legacyCharacterMapUrl,
        isEvalSupported: false,
        url: props.file,
      });
      expect(instance.setState).toHaveBeenCalledWith({ pdf: pdfObject });
    });
  });

  describe('onPDFReady', () => {
    it('should be called on the first render of the PDF pages (only once)', () => {
      props.onPDFReady = jasmine.createSpy('onPDFReady');
      render();

      component.setState({ pdf: { numPages: 5 } });
      expect(props.onPDFReady).toHaveBeenCalled();

      props.onPDFReady.calls.reset();
      component.setState({ pdf: { numPages: 5 } });
      expect(props.onPDFReady).not.toHaveBeenCalled();
    });
  });

  describe('on filename change', () => {
    it('should not attempt to get the PDF if filname remains unchanged', () => {
      render();
      component.setProps({ filename: 'original.pdf' });
      expect(PDFJS.getDocument.calls.count()).toBe(1);
    });

    it('should get the new PDF if filename changed', done => {
      render();
      component.setProps({ filename: 'newfile.pdf' });
      expect(Object.keys(instance.pagesLoaded).length).toBe(0);
      expect(instance.state).toEqual({ pdf: { numPages: 0 }, filename: 'newfile.pdf' });
      expect(PDFJS.getDocument.calls.count()).toBe(2);
      setTimeout(() => {
        expect(instance.state).toEqual({ pdf: pdfObject, filename: 'newfile.pdf' });
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
    it('should be called when there is no pages loading', () => {
      render();
      instance.setState({ pdf: { numPages: 5 } });
      instance.pageLoaded(1);
      props.onLoad.calls.reset();
      instance.pageLoading(2);
      instance.pageLoaded(3);
      expect(props.onLoad).not.toHaveBeenCalled();
      instance.pageLoaded(2);
      expect(props.onLoad).toHaveBeenCalledWith({ pages: [1, 2, 3] });
    });

    it('should be called when a pages is unloaded', () => {
      render();
      instance.setState({ pdf: { numPages: 5 } });

      instance.pageLoaded(1);
      instance.pageLoaded(2);
      instance.pageLoaded(3);
      props.onLoad.calls.reset();
      instance.pageUnloaded(3);

      expect(props.onLoad).toHaveBeenCalledWith({ pages: [1, 2] });
    });
  });
});
