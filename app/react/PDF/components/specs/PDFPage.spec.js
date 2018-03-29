import React from 'react';
import { shallow } from 'enzyme';

import PDFJS from '../../PDFJS';
import PDFPage from '../PDFPage';

describe('PDFPage', () => {
  let component;
  let instance;
  let container;
  const pdfObject = { numPages: 2 };

  let props;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'document-viewer';
    document.body.appendChild(container);
    spyOn(PDFJS, 'getDocument').and.returnValue(Promise.resolve(pdfObject));
    props = {
      onLoading: jasmine.createSpy('onLoading'),
      onUnload: jasmine.createSpy('onUnload'),
      page: 2,
      pdf: {
        getPage: jest.fn().mockReturnValueOnce(Promise.resolve({ getViewport: jest.fn() }))
      }
    };
  });

  const render = () => {
    component = shallow(<PDFPage {...props}/>);
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
          draw: jasmine.createSpy('draw').and.returnValue(Promise.resolve())
        };
        instance.renderPage();
        expect(instance.pdfPageView.draw).toHaveBeenCalled();
        expect(instance.rendered).toBe(true);
        expect(props.onLoading).toHaveBeenCalledWith(props.page);
      });
    });

    describe('when its not rendered and no pdfPageView exists', () => {
      it('should create pdfPageView object and render the page', (done) => {
        render();
        instance.rendered = false;
        const pdfPageViewPrototype = {
          setPdfPage: jest.fn(),
          draw: jest.fn().mockReturnValueOnce(Promise.resolve()),
        };

        PDFJS.PDFPageView = function pdfPageView() {};
        PDFJS.DefaultTextLayerFactory = function pdfPageView() {};
        PDFJS.PDFPageView.prototype = pdfPageViewPrototype;

        instance.renderPage();

        setTimeout(() => {
          expect(props.onLoading).toHaveBeenCalledWith(props.page);
          expect(instance.rendered).toBe(true);
          expect(pdfPageViewPrototype.setPdfPage).toHaveBeenCalled();
          expect(pdfPageViewPrototype.draw).toHaveBeenCalled();
          //console.log(instance.pdfPageView);
          done();
        });
      });
    });
  });

  describe('scroll', () => {
    describe('when pageShouldRender', () => {
      it('should render page if pageShouldRender', () => {
        render();
        spyOn(instance, 'pageShouldRender').and.returnValue(true);
        spyOn(instance, 'renderPage');
        instance.scroll();
        expect(instance.renderPage).toHaveBeenCalled();
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
        expect(instance.rendered).toBe(false);
      });
      describe('when its rendered', () => {
        it('should call onUnload with the pageNumber and set rendered property to false', () => {
          render();
          instance.pdfPageView = jasmine.createSpyObj(['cancelRendering', 'destroy']);
          instance.rendered = true;
          spyOn(instance, 'pageShouldRender').and.returnValue(false);
          instance.scroll();
          expect(props.onUnload).toHaveBeenCalledWith(props.page);
          expect(instance.rendered).toBe(false);
        });
      });
    });
  });
});
