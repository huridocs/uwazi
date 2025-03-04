/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { shallow } from 'enzyme';

import PDFJS from '../../PDFJS';
import PDFPage from '../PDFPage';

const pdfObject = { numPages: 2 };

jest.mock('../../PDFJS', () => ({
  default: {
    getDocument: jest.fn().mockReturnValue(Promise.resolve(pdfObject)),
  },
  PixelsPerInch: { PDF_TO_CSS_UNITS: 0.5 },
  EventBus: function () {},
}));

describe('PDFPage', () => {
  let component;
  let instance;
  let container;
  let pdfPageWidth = 100;

  let props;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'document-viewer';
    props = {
      onLoading: jasmine.createSpy('onLoading'),
      onUnload: jasmine.createSpy('onUnload'),
      page: 2,
      getViewportContainer: () => container,
      pdf: {
        getPage: jest
          .fn()
          .mockReturnValueOnce(Promise.resolve({ getViewport: () => ({ width: pdfPageWidth }) })),
      },
      containerWidth: 100,
    };
  });

  const render = () => {
    component = shallow(<PDFPage {...props} />);
    instance = component.instance();
  };

  describe('render', () => {
    it('should render a div as pageContainer', () => {
      render();
      expect(component).toMatchSnapshot();
    });

    it('should pass pass proper height when state.height', () => {
      render();
      expect(component.setState({ height: 5 })).toMatchSnapshot();
    });
  });

  describe('pageShouldRender', () => {
    it('should return true by default', () => {
      render();
      instance.pageContainer = { getBoundingClientRect: () => ({}) };
      expect(instance.pageShouldRender()).toBe(true);
    });

    it('should call onHidden when not being rendered', () => {
      props.onHidden = jasmine.createSpy('onHidden');
      render();
      instance.pageContainer = { getBoundingClientRect: () => ({ right: -1 }) };
      instance.pageShouldRender();
      expect(props.onHidden).toHaveBeenCalledWith(2);
    });

    it('should return false when page is not in viewport with a 500px offset', () => {
      render();
      instance.pageContainer = { getBoundingClientRect: () => ({ right: -1 }) };
      expect(instance.pageShouldRender()).toBe(false);

      instance.pageContainer = { getBoundingClientRect: () => ({ bottom: -501 }) };
      expect(instance.pageShouldRender()).toBe(false);

      window.innerWidth = 5;
      instance.pageContainer = { getBoundingClientRect: () => ({ left: 6 }) };
      expect(instance.pageShouldRender()).toBe(false);

      window.innerHeight = 5;
      instance.pageContainer = { getBoundingClientRect: () => ({ top: 506 }) };
      expect(instance.pageShouldRender()).toBe(false);
    });
  });

  describe('renderPage', () => {
    describe('when its not rendered but pdfPageView exists', () => {
      it('should draw the page and call onLoading', () => {
        render();
        instance.rendered = false;
        instance.pdfPageView = {
          draw: jasmine.createSpy('draw').and.callFake(async () => Promise.resolve()),
        };
        instance.renderPage();
        expect(instance.pdfPageView.draw).toHaveBeenCalled();
        expect(instance.state.rendered).toBe(true);
        expect(props.onLoading).toHaveBeenCalledWith(props.page);
      });
    });

    describe('when its not rendered and no pdfPageView exists', () => {
      const pdfPageViewPrototype = {
        setPdfPage: jest.fn(),
        draw: jest.fn().mockReturnValue(Promise.resolve()),
      };

      it('should create pdfPageView object and render the page', done => {
        render();
        instance.state.rendered = false;

        PDFJS.PDFPageView = function pdfPageView() {};
        PDFJS.DefaultTextLayerFactory = function pdfPageView() {};
        PDFJS.PDFPageView.prototype = pdfPageViewPrototype;

        instance.renderPage();

        setTimeout(() => {
          expect(props.onLoading).toHaveBeenCalledWith(props.page);
          expect(instance.state.rendered).toBe(true);
          expect(pdfPageViewPrototype.setPdfPage).toHaveBeenCalled();
          expect(pdfPageViewPrototype.draw).toHaveBeenCalled();
          done();
        });
      });

      it('should set the scale of the pdf', done => {
        render();
        instance.state.rendered = false;

        PDFJS.PDFPageView = jest.fn().mockImplementation(() => pdfPageViewPrototype);

        instance.renderPage();

        setTimeout(() => {
          expect(PDFJS.PDFPageView).toHaveBeenCalledWith(
            expect.objectContaining({
              defaultViewport: {
                width: 100,
              },
              scale: 2,
            })
          );
          done();
        });
      });
    });
  });

  describe('scroll', () => {
    describe('when pageShouldRender', () => {
      it('should render page', () => {
        render();
        spyOn(instance, 'pageShouldRender').and.returnValue(true);
        spyOn(instance, 'renderPage');
        instance.scroll();
        expect(instance.renderPage).toHaveBeenCalled();
      });

      it('should calculate page visibility and if visible call onVisible callback', () => {
        props.onVisible = jasmine.createSpy('onVisible');

        render();
        component.setProps({
          getViewportContainer: () => ({
            getBoundingClientRect: () => ({ top: 100, height: 500, bottom: 600 }),
          }),
        });

        instance.pageContainer = {
          getBoundingClientRect: () => ({ top: 100, height: 1000, bottom: 1100 }),
        };
        instance.pageShouldRender();

        let expectedPage = 2;
        let pageVisibility = 500;
        expect(props.onVisible).toHaveBeenCalledWith(expectedPage, pageVisibility);

        instance.pageContainer = {
          getBoundingClientRect: () => ({ top: -600, height: 1000, bottom: 400 }),
        };
        component.update();
        instance.pageShouldRender();

        expectedPage = 2;
        pageVisibility = 300;
        expect(props.onVisible).toHaveBeenCalledWith(expectedPage, pageVisibility);
      });

      it('should call pageHidden when there is no visibility', () => {
        props.onVisible = jasmine.createSpy('onVisible');
        props.onHidden = jasmine.createSpy('onHidden');

        render();
        component.setProps({
          viewportContainer: {
            getBoundingClientRect: () => ({ top: 100, height: 500, bottom: 600 }),
          },
        });

        instance.pageContainer = {
          getBoundingClientRect: () => ({ top: -2100, height: 1000, bottom: 1100 }),
        };
        instance.pageShouldRender();

        expect(props.onVisible).not.toHaveBeenCalled();
        expect(props.onHidden).toHaveBeenCalledWith(2);
      });
    });

    describe('when not pageShouldRender', () => {
      it('should check if its rendered and unload and set rendered property to false', () => {
        render();
        instance.pdfPageView = jasmine.createSpyObj(['cancelRendering', 'destroy']);
        spyOn(instance, 'pageShouldRender').and.returnValue(false);
        instance.scroll();
        expect(instance.pdfPageView.cancelRendering).toHaveBeenCalled();
        expect(instance.pdfPageView.destroy).toHaveBeenCalled();
        expect(instance.state.rendered).toBe(false);
      });

      describe('when its rendered', () => {
        it('should call onUnload with the pageNumber and set rendered property to false', () => {
          render();
          instance.pdfPageView = jasmine.createSpyObj(['cancelRendering', 'destroy']);
          instance.state.rendered = true;
          spyOn(instance, 'pageShouldRender').and.returnValue(false);
          instance.scroll();
          expect(props.onUnload).toHaveBeenCalledWith(props.page);
          expect(instance.state.rendered).toBe(false);
        });
      });
    });
  });
});
