import Immutable from 'immutable';

import { renderConnected } from 'app/utils/test/renderConnected';
import connected from '../NeedAuthorization';

describe('NeedAuthorization', () => {
  let props;
  let store;
  const render = () => renderConnected(connected, props, store);

  const writePermission = [{ refId: 'userId', level: 'write' }];

  describe('role based', () => {
    describe('when logged in', () => {
      beforeEach(() => {
        store = {
          user: Immutable.fromJS({ _id: 'userId', role: 'editor' }),
        };
      });

      it('should render children if user has role', () => {
        props = {
          children: 'to render if auth',
          roles: ['admin', 'editor'],
        };

        const component = render();

        expect(component.text()).toBe('to render if auth');
      });

      it('should NOT render children if user doesnt have role', () => {
        props = {
          children: 'to render if auth',
          roles: ['admin'],
        };

        const component = render();

        expect(component.text()).not.toBe('to render if auth');
      });

      it('should use "admin" if no role provided', () => {
        props = { children: 'to render if auth' };

        const componentDeny = render();

        store.user = Immutable.fromJS({ _id: 'userId', role: 'admin' });
        const componentAllow = render();

        expect(componentDeny.text()).not.toBe('to render if auth');
        expect(componentAllow.text()).toBe('to render if auth');
      });
    });

    describe('when not logged in', () => {
      beforeEach(() => {
        store = { user: Immutable.fromJS({}) };
      });

      it('should not render children if no user', () => {
        props = { children: 'to render if auth', roles: [] };

        const component = render();

        expect(component.text()).not.toBe('to render if auth');
      });
    });
  });

  describe('access level based', () => {
    describe('when logged in', () => {
      beforeEach(() => {
        store = {
          user: Immutable.fromJS({
            _id: 'userId',
            role: 'editor',
          }),
        };
      });

      describe('write access', () => {
        it('should render children if user has write access to all entities entity', () => {
          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [
              {
                _id: 'someEntity',
                permissions: writePermission,
              },
              {
                _id: 'otherEntity',
                permissions: writePermission,
              },
            ],
          };
          const component = render();
          expect(component.text()).toBe('to render if auth');
        });

        it('should not render children if user lacks write access to one or more entities', () => {
          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [
              {
                _id: 'someEntity',
                permissions: [
                  {
                    refId: 'userId',
                    level: 'read',
                  },
                ],
              },
              {
                refId: 'otherEntity',
                permissions: writePermission,
              },
            ],
          };

          const component = render();

          expect(component.text()).not.toBe('to render if auth');
        });

        it('should not render children if entities has not permissions data', () => {
          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [
              {
                refId: 'someEntity',
              },
            ],
          };

          const component = render();

          expect(component.text()).not.toBe('to render if auth');
        });

        it('should render children if user has write access to all entities through groups', () => {
          store.user = Immutable.fromJS({
            _id: 'userId',
            role: 'collaborator',
            groups: [
              {
                _id: 'groupId',
              },
            ],
          });

          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [
              {
                _id: 'someEntity',
                permissions: [
                  {
                    refId: 'groupId',
                    level: 'write',
                  },
                ],
              },
              {
                _id: 'otherEntity',
                permissions: writePermission,
              },
            ],
          };

          const component = render();

          expect(component.text()).toBe('to render if auth');
        });

        it('should not render children if user lacks write access because of a group', () => {
          store.user = Immutable.fromJS({
            _id: 'userId',
            role: 'collaborator',
            groups: [
              {
                _id: 'groupId',
              },
            ],
          });

          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [
              {
                _id: 'someEntity',
                permissions: [{ refId: 'groupId', level: 'read' }],
              },
              {
                _id: 'otherEntity',
                permissions: writePermission,
              },
            ],
          };

          const component = render();

          expect(component.text()).not.toBe('to render if auth');
        });

        it('should not render children if entity is null', () => {
          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [null],
          };

          const component = render();

          expect(component.text()).not.toBe('to render if auth');
        });
      });
    });
  });

  describe('mixed criteria', () => {
    beforeEach(() => {
      store = {
        user: Immutable.fromJS({
          _id: 'userId',
          role: 'editor',
        }),
      };
    });
    describe('when providing roles and entities', () => {
      it('should use an OR criteria', () => {
        props = {
          children: 'to render if auth',
          roles: ['admin'],
          orWriteAccessTo: [
            {
              _id: 'otherEntity',
              permissions: writePermission,
            },
          ],
        };

        const orComponent1 = render();

        props.roles = ['editor'];
        props.orWriteAccessTo[0].write_access = false;

        const orComponent2 = render();

        expect(orComponent1.text()).toBe('to render if auth');
        expect(orComponent2.text()).toBe('to render if auth');
      });
    });
  });
});
