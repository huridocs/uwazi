import React from 'react';
import { shallow } from 'enzyme';

import Modal from 'app/Layout/Modal';
import { Loader } from 'app/components/Elements/Loader';
import Confirm from '../Confirm';

describe('CantDeleteTemplateAlert', () => {
  let component;
  let props;
  let instance;

  beforeEach(() => {
    props = {
      cancel: jasmine.createSpy('cancel'),
      isOpen: false,
    };
  });

  const render = () => {
    component = shallow(<Confirm {...props} />);
    instance = component.instance();
  };

  it('should render a default closed modal', () => {
    render();
    expect(component.find(Modal).props().isOpen).toBe(false);
  });

  it('noCancel option should hide the cancel button', () => {
    props.noCancel = true;
    render();
    expect(component).toMatchSnapshot();
  });

  it('extraConfirm option should render a confirm input', () => {
    props.extraConfirm = true;
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when clicking ok button', () => {
    it('should call accept function', () => {
      props.isOpen = true;
      props.accept = jasmine.createSpy('accept');
      render();
      component.find('.btn-danger').simulate('click');
      expect(props.accept).toHaveBeenCalled();
      expect(instance.state.isOpen).toBe(false);
      expect(instance.state.isLoading).toBe(false);
    });

    describe('when the action is async', () => {
      let resolve;
      let reject;
      let promise;
      beforeEach(() => {
        promise = new Promise((_resolve, _reject) => {
          resolve = _resolve;
          reject = _reject;
        }).catch(() => {});
        props.accept = jasmine.createSpy('accept');
        props.accept.and.returnValue(promise);
        props.isOpen = true;
        render();
      });

      it('should show a loading state until the promise resolves and render a Loader', done => {
        component.find('.btn-danger').simulate('click');
        expect(props.accept).toHaveBeenCalled();
        expect(instance.state.isOpen).toBe(true);
        expect(instance.state.isLoading).toBe(true);
        expect(component.find(Loader).length).toBe(1);
        resolve();
        promise.then(() => {
          expect(instance.state.isOpen).toBe(false);
          expect(instance.state.isLoading).toBe(false);
          done();
        });
      });

      it('should show a loading state until the promise rejects', done => {
        component.find('.btn-danger').simulate('click');
        expect(props.accept).toHaveBeenCalled();
        expect(instance.state.isOpen).toBe(true);
        expect(instance.state.isLoading).toBe(true);
        expect(component.find(Loader).length).toBe(1);
        reject();
        promise.then(() => {
          expect(instance.state.isOpen).toBe(false);
          expect(instance.state.isLoading).toBe(false);
          done();
        });
      });
    });
  });

  describe('when clicking cancel button', () => {
    it('should call cancel function', () => {
      render();
      component.find('.btn-default').simulate('click');
      expect(props.cancel).toHaveBeenCalled();
    });
  });
});
