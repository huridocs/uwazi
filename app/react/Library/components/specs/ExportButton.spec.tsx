import React from 'react';
import { shallow } from 'enzyme';

import { ExportButton, ExportButtonProps } from 'app/Library/components/ExportButton';

describe('ExportButton', () => {
  let component: any;
  let props: ExportButtonProps;

  const render = () => {
    component = shallow<ExportButton>(<ExportButton {...props} />);
  };

  describe('when instantiated', () => {
    beforeEach(() => {
      props = {
        processing: false,
        storeKey: 'library',
        exportDocuments: jest.fn(),
      };
    });

    it('should not have the disabled class', () => {
      render();
      expect(component.find('.btn-disabled').length).toBe(0);
    });

    it('should dispatch exportDocuments on click', () => {
      render();
      component.find('.btn').simulate('click');
      expect(props.exportDocuments).toHaveBeenCalledWith('library');
    });
  });

  describe('when processing', () => {
    beforeEach(() => {
      props = {
        processing: true,
        storeKey: 'library',
        exportDocuments: jest.fn(),
      };
    });

    it('should be disabled', () => {
      render();
      expect(component.find('.btn-disabled').length).toBe(1);
    });

    it('should not dispatch on click', () => {
      render();
      expect(props.exportDocuments).not.toHaveBeenCalled();
    });
  });
});
