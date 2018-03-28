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
        getPage: jasmine.createSpy('getPage').and.returnValue({})
      }
    };
  });

  const render = () => {
    component = shallow(<PDFPage {...props}/>);
    instance = component.instance();
  };

  it('should be true', () => {
    render();
    //instance.pageShouldRender();
    expect(true).toBe(false);
  });
});
