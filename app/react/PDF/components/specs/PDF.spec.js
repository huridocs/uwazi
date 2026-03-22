/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import { PDFPage } from '#app/PDF/index.js';
import { PDFJS } from '#V2/Components/PDFViewer/pdfjs.js';
import { PDF } from '../PDF.js';

const legacyCharacterMapUrl = '/legacy_character_maps/';

jest.mock('#V2/Components/PDFViewer/pdfjs.js', () => ({
  PDFJS: { getDocument: jest.fn() },
  EventBus: function () {},
  cMapUrl: '/legacy_character_maps/',
}));

// eslint-disable-next-line max-statements
describe('PDF', () => {
  let component;
  let instance;
  const pdfObject = { numPages: 2 };

  let props;

  beforeEach(() => {
    PDFJS.getDocument.mockReturnValue({ promise: Promise.resolve(pdfObject) });
    props = {
      file: 'file_url',
      filename: 'original.pdf',
      onLoad: jest.fn(),
      parentRef: { current: { clientWidth: 500 } },
    };
  });

  afterEach(() => {
    PDFJS.getDocument.mockReset();
  });

  const render = async () => {
    component = shallow(<PDF {...props} />);
    instance = component.instance();
    const originalSetState = instance.setState.bind(instance);
    jest.spyOn(instance, 'setState').mockImplementation(state => originalSetState(state));
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
      props.onPDFReady = jest.fn();
      render();

      component.setState({ pdf: { numPages: 5 } });
      expect(props.onPDFReady).toHaveBeenCalled();

      props.onPDFReady.mockClear();
      component.setState({ pdf: { numPages: 5 } });
      expect(props.onPDFReady).not.toHaveBeenCalled();
    });
  });

  describe('on filename change', () => {
    it('should not attempt to get the PDF if filname remains unchanged', () => {
      render();
      component.setProps({ filename: 'original.pdf' });
      expect(PDFJS.getDocument).toHaveBeenCalledTimes(1);
    });

    it('should get the new PDF if filename changed', done => {
      render();
      component.setProps({ filename: 'newfile.pdf' });
      expect(Object.keys(instance.pagesLoaded).length).toBe(0);
      expect(instance.state).toEqual({ pdf: { numPages: 0 }, filename: 'newfile.pdf', scale: 1 });
      expect(PDFJS.getDocument).toHaveBeenCalledTimes(2);
      setTimeout(() => {
        expect(instance.state).toEqual({ pdf: pdfObject, filename: 'newfile.pdf', scale: 1 });
        done();
      });
    });
  });

  describe('pageVisibility', () => {
    it('should save page and visibility and execute onPageChange', () => {
      props.onPageChange = jest.fn();

      render();
      const page = 2;
      const visibility = 500;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).toHaveBeenCalledWith(2);
    });

    // eslint-disable-next-line max-statements
    it('should call pageChange when visibility is the highest and the page is diferent from before', () => {
      props.onPageChange = jest.fn();

      render();
      instance.pages = { 2: null };

      let page = 3;
      let visibility = 555;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).toHaveBeenCalledWith(3);

      props.onPageChange.mockClear();
      page = 4;
      visibility = 550;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).not.toHaveBeenCalled();

      props.onPageChange.mockClear();
      page = 4;
      visibility = 560;
      instance.onPageVisible(page, visibility);
      expect(props.onPageChange).toHaveBeenCalledWith(4);
    });

    describe('in case of equal visibility', () => {
      // eslint-disable-next-line max-statements
      it('should use the smallest one', () => {
        props.onPageChange = jest.fn();
        render();

        let page = 30;
        let visibility = 10;
        instance.onPageVisible(page, visibility);
        expect(props.onPageChange).toHaveBeenCalledWith(30);

        props.onPageChange.mockClear();
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
      props.onLoad.mockClear();
      instance.pageLoaded(2);
      expect(props.onLoad).toHaveBeenCalled();
      props.onLoad.mockClear();
      instance.pageLoaded(5);
      expect(props.onLoad).not.toHaveBeenCalled();
    });
  });

  describe('onLoad', () => {
    it('should be called when there is no pages loading', () => {
      render();
      instance.setState({ pdf: { numPages: 5 } });
      instance.pageLoaded(1);
      props.onLoad.mockClear();
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
      props.onLoad.mockClear();
      instance.pageUnloaded(3);

      expect(props.onLoad).toHaveBeenCalledWith({ pages: [1, 2] });
    });
  });
});
