import Immutable from 'immutable';

import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import connected from '../NeedAuthorization';

describe('NeedAuthorization', () => {
  let props;
  let store;
  const render = () => renderConnected(connected, props, store);

  describe('role based', () => {
    describe('when logged in', () => {
      beforeEach(() => {
        store = {
          user: Immutable.fromJS({
            _id: 'userId',
            role: 'editor',
          }),
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

      it('should NOT render children if doesnt user have role', () => {
        props = {
          children: 'to render if auth',
          roles: ['admin'],
        };

        const component = render();

        expect(component.text()).not.toBe('to render if auth');
      });

      it('should use "admin" if no role provided', () => {
        props = {
          children: 'to render if auth',
        };

        const componentDeny = render();

        store.user = Immutable.fromJS({
          _id: 'userId',
          role: 'admin',
        });
        const componentAllow = render();

        expect(componentDeny.text()).not.toBe('to render if auth');
        expect(componentAllow.text()).toBe('to render if auth');
      });
    });

    describe('when not logged in', () => {
      beforeEach(() => {
        store = {
          user: Immutable.fromJS({}),
        };
      });

      it('should not render children if no user', () => {
        props = {
          children: 'to render if auth',
          roles: [],
        };

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
                permissions: [
                  {
                    _id: 'userId',
                    level: 'write',
                  },
                ],
              },
              {
                _id: 'otherEntity',
                write_access: true,
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
                    _id: 'userId',
                    level: 'read',
                  },
                ],
              },
              {
                _id: 'otherEntity',
                write_access: true,
              },
            ],
          };

          const component = render();

          expect(component.text()).not.toBe('to render if auth');
        });

        it('should render children if user has write acces to all entities through groups', () => {
          store.user.groups = [
            {
              _id: 'groupId',
            },
          ];

          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [
              {
                _id: 'someEntity',
                permissions: [
                  {
                    _id: 'groupId',
                    level: 'write',
                  },
                ],
              },
              {
                _id: 'otherEntity',
                write_access: true,
              },
            ],
          };

          const component = render();

          expect(component.text()).toBe('to render if auth');
        });

        it('should not render children if user lacks write access because of a group', () => {
          store.user.groups = [
            {
              _id: 'groupId',
            },
          ];

          props = {
            children: 'to render if auth',
            roles: [],
            orWriteAccessTo: [
              {
                _id: 'someEntity',
                permissions: [
                  {
                    _id: 'groupId',
                    level: 'read',
                  },
                ],
              },
              {
                _id: 'otherEntity',
                write_access: true,
              },
            ],
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
              write_access: true,
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
