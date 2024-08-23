/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { PDF } from 'app/PDF';
import { Document } from 'app/Viewer/components/Document.js';

describe('Document', () => {
  let component;
  let instance;

  let props;

  beforeEach(async () => {
    props = {
      setSelection: jasmine.createSpy('setSelection'),
      PDFReady: jasmine.createSpy('PDFReady'),
      unsetSelection: jasmine.createSpy('unsetSelection'),
      onClick: jasmine.createSpy('onClick'),
      deactivateReference: jasmine.createSpy('deactivateReference'),
      doc: Immutable.fromJS({ _id: 'documentId' }),
      file: { language: 'eng', _id: 'fileId' },
      onDocumentReady: jasmine.createSpy('onDocumentReady'),
      selectedSnippet: Immutable.fromJS({}),
      docHTML: Immutable.fromJS({
        pages: ['page1', 'page2', 'page3'],
        css: 'css',
      }),
      references: Immutable.fromJS([{ reference: 'reference' }]),
    };
  });

  const render = () => {
    component = shallow(<Document {...props} />);
    instance = component.instance();
  };

  it('should add id as a className', () => {
    render();
    expect(component.find('div').children().first().hasClass('_documentId')).toBe(true);
  });

  it('should add the className passed', () => {
    props.className = 'aClass';
    render();
    expect(component.find('div').children().first().hasClass('aClass')).toBe(true);
  });

  it('should add the correct LTR or RTL direction according to file franc language', () => {
    render();
    expect(component.find('.document').hasClass('force-ltr')).toBe(true);

    props.file.language = 'arb';
    render();
    expect(component.find('.document').hasClass('force-rtl')).toBe(true);
  });

  describe('onClick', () => {
    describe('when executeOnClickHandler = true', () => {
      it('should execute onClick', () => {
        props.executeOnClickHandler = true;
        render();
        component.find('.pages').simulate('click', { target: {} });

        expect(props.onClick).toHaveBeenCalled();
      });
    });

    describe('when executeOnClickHandler = false', () => {
      it('should not execute onClick', () => {
        props.executeOnClickHandler = false;
        render();
        component.find('.pages').simulate('click', { target: {} });

        expect(props.onClick).not.toHaveBeenCalled();
      });
    });
  });

  describe('highlightReference', () => {
    beforeEach(() => {
      props.references = Immutable.fromJS([{ reference: 'reference' }]);
    });

    it('should activate the reference', () => {
      const reference = { _id: 'referenceId', test: 'test' };
      props.executeOnClickHandler = true;
      props.references = Immutable.fromJS([reference]);
      props.activateReference = jasmine.createSpy('activateReference');
      render();
      instance.text = { selected: jasmine.createSpy('selected').and.returnValue(false) };

      component.instance().highlightReference(reference);

      expect(props.activateReference).toHaveBeenCalledWith(
        reference,
        undefined,
        undefined,
        undefined,
        true
      );
      expect(props.onClick).not.toHaveBeenCalled();
    });
  });

  describe('when PDF is ready', () => {
    it('should call the onDocumentReady prop with the doc as argument', () => {
      render();
      const pdf = component.find(PDF).first();
      pdf.simulate('PDFReady');
      expect(props.onDocumentReady).toHaveBeenCalledWith(props.doc);
    });
  });

  describe('onTextSelected', () => {
    it('should set the selection changing regionId to page', () => {
      render();

      const textSelection = {
        text: 'Wham Bam Shang-A-Lang',
        selectionRectangles: [
          { regionId: '51', top: 186, left: 27, width: 23, height: 12 },
          { regionId: '52', top: 231, left: 47, width: 11, height: 89 },
        ],
      };

      instance.onTextSelected(textSelection);
      expect(props.setSelection).toHaveBeenCalledWith(
        {
          selectionRectangles: [
            { height: 12, left: 27, page: '51', top: 186, width: 23 },
            { height: 89, left: 47, page: '52', top: 231, width: 11 },
          ],
          text: 'Wham Bam Shang-A-Lang',
        },
        'fileId'
      );
    });

    it('should deactivate any active reference', () => {
      render();
      instance.onTextSelected({ selectionRectangles: [] });
      expect(props.deactivateReference).toHaveBeenCalled();
    });

    describe('when textSelection is disabled', () => {
      it('should do nothing', () => {
        props.disableTextSelection = true;
        render();
        instance.onTextSelected({ selectionRectangles: [] });
        expect(props.setSelection).not.toHaveBeenCalled();
        expect(props.deactivateReference).not.toHaveBeenCalled();
      });
    });
  });
});
