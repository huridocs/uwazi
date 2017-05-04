import {actions as formActions} from 'react-redux-form';
import {actions as basicActions} from 'app/BasicReducer';
import * as actions from '../actions';
import * as Notifications from 'app/Notifications';
import api from 'app/Users/UsersAPI';

describe('User actions', () => {
  let dispatch;

  beforeEach(() => {
    dispatch = jasmine.createSpy('dispatch');
    spyOn(api, 'delete').and.returnValue(Promise.resolve());
    spyOn(basicActions, 'remove').and.returnValue('USER REMOVED');
    spyOn(Notifications, 'notify').and.returnValue('NOTIFIED');
  });

  describe('deleteUser', () => {
    it('should delete the user', () => {
      actions.deleteUser('data')(dispatch);
      expect(api.delete).toHaveBeenCalledWith('data');
    });

    describe('upon success', () => {
      beforeEach((done) => {
        actions.deleteUser('data')(dispatch)
        .then(() => {
          done();
        });
      });

      it('should remove user', () => {
        expect(basicActions.remove).toHaveBeenCalledWith('users', 'data');
        expect(dispatch).toHaveBeenCalledWith('USER REMOVED');
        expect(dispatch).toHaveBeenCalledWith('NOTIFIED');
      });
    });
  });
});
