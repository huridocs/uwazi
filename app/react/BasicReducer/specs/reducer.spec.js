/* eslint-disable max-lines */
/** @format */

import { fromJS as Immutable } from 'immutable';

import createReducer, * as actions from 'app/BasicReducer/reducer';

describe('BasicReducer', () => {
  describe('createReducer', () => {
    it('should return a reducer function with default value passed', () => {
      const reducer = createReducer('namespace', {});
      const newState = reducer();
      expect(newState.toJS()).toEqual({});
    });
  });

  describe('Update', () => {
    it('should update passed value in a list, by a custom index', () => {
      const reducer = createReducer('1', []);
      const state = reducer(
        {},
        actions.set('1', [
          { index: 1, title: 'test' },
          { index: 2, title: 'test2' },
        ])
      );
      const newState = reducer(
        state,
        actions.update('1', { index: 2, title: 'updatedTitle' }, 'index')
      );

      expect(newState.toJS()).toEqual([
        { index: 1, title: 'test' },
        { index: 2, title: 'updatedTitle' },
      ]);
    });

    it('should set value passed on the same namespace', () => {
      const reducer1 = createReducer('1', []);
      const reducer2 = createReducer('2', []);

      const state1 = reducer1(
        {},
        actions.set('1', [
          { _id: 1, title: 'test' },
          { _id: 2, title: 'test2' },
        ])
      );
      const state2 = reducer2({}, actions.set('2', [{ _id: 2, title: 'test2' }]));

      const newState1 = reducer1(state1, actions.update('1', { _id: 2, title: 'updated' }));
      const newState2 = reducer1(state2, actions.update('2', { _id: 2, title: 'updated' }));

      expect(newState1.toJS()).toEqual([
        { _id: 1, title: 'test' },
        { _id: 2, title: 'updated' },
      ]);
      expect(newState2.toJS()).toEqual([{ _id: 2, title: 'test2' }]);
    });

    describe('when value does not exist', () => {
      it('should push it to the collection', () => {
        const reducer1 = createReducer('1', []);
        const reducer2 = createReducer('2', []);

        const state1 = reducer1(
          {},
          actions.set('1', [
            { _id: 1, title: 'test' },
            { _id: 2, title: 'test2' },
          ])
        );
        const state2 = reducer2({}, actions.set('2', [{ _id: 2, title: 'test2' }]));

        const newState1 = reducer1(state1, actions.update('1', { _id: 3, title: 'created' }));
        const newState2 = reducer1(state2, actions.update('2', { _id: 3, title: 'not created' }));

        expect(newState1.toJS()).toEqual([
          { _id: 1, title: 'test' },
          { _id: 2, title: 'test2' },
          { _id: 3, title: 'created' },
        ]);
        expect(newState2.toJS()).toEqual([{ _id: 2, title: 'test2' }]);
      });
    });

    describe('when the state is a Map', () => {
      it('should merge the value in to the state', () => {
        const reducer1 = createReducer('1', {});
        const state = reducer1({}, actions.set('1', { title: 'test', prop: 'prop' }));

        const newState = reducer1(
          state,
          actions.update('1', { title: 'test', newProp: 'new prop' })
        );

        expect(newState.toJS()).toEqual({ title: 'test', prop: 'prop', newProp: 'new prop' });
      });
    });
  });

  describe('Update In', () => {
    let reducer;
    let state;
    beforeEach(() => {
      reducer = createReducer('1', { nested: { key: [] } });
      state = Immutable({
        nested: {
          key: [
            { _id: 1, title: 'test' },
            { _id: 2, title: 'test2' },
          ],
        },
      });
    });
    it('should update passed value in a list in a nested key at the namespace', () => {
      const newState = reducer(
        state,
        actions.updateIn('1', ['nested', 'key'], { _id: 1, title: 'changed test' })
      );
      expect(newState.toJS()).toEqual({
        nested: {
          key: [
            { _id: 1, title: 'changed test' },
            { _id: 2, title: 'test2' },
          ],
        },
      });
    });
    it('should update passed value in a list in a nested key at the namespace, by a custom index', () => {
      state = Immutable({
        nested: {
          key: [
            { _id: 1, title: 'test' },
            { customID: 1, title: 'test2' },
          ],
        },
      });
      const newState = reducer(
        state,
        actions.updateIn('1', ['nested', 'key'], { customID: 1, title: 'changed test' }, 'customID')
      );
      expect(newState.toJS()).toEqual({
        nested: {
          key: [
            { _id: 1, title: 'test' },
            { customID: 1, title: 'changed test' },
          ],
        },
      });
    });
    describe('when value does not exist', () => {
      it('should push it to the collection at the specified key path', () => {
        const newState = reducer(
          state,
          actions.updateIn('1', ['nested', 'key'], { _id: 3, title: 'new' })
        );
        expect(newState.toJS()).toEqual({
          nested: {
            key: [
              { _id: 1, title: 'test' },
              { _id: 2, title: 'test2' },
              { _id: 3, title: 'new' },
            ],
          },
        });
      });
    });
  });

  describe('Set', () => {
    it('should set value passed on the same namespace', () => {
      const reducer1 = createReducer('1');
      const reducer2 = createReducer('2');

      const newState1 = reducer1({}, actions.set('1', { newValue: 'value' }));
      const newState2 = reducer2({}, actions.set('1', { newValue: 'value' }));

      expect(newState1.toJS()).toEqual({ newValue: 'value' });
      expect(newState2.toJS()).toEqual({});
    });
  });

  describe('Set In', () => {
    it('should set specific keys passed on the same namespace', () => {
      const reducer1 = createReducer('1');
      const reducer2 = createReducer('2');

      const newState1 = reducer1(
        Immutable({ oldProperty: 'old' }),
        actions.setIn('1', 'newProperty', 'new')
      );
      const newState2 = reducer2(
        Immutable({ oldProperty: 'old' }),
        actions.setIn('1', 'newProperty', 'new')
      );

      expect(newState1.toJS()).toEqual({ oldProperty: 'old', newProperty: 'new' });
      expect(newState2.toJS()).toEqual({ oldProperty: 'old' });

      const newState3 = reducer1(
        Immutable({ oldProperty: 'old' }),
        actions.setIn('1', 'oldProperty', 'new')
      );

      expect(newState3.toJS()).toEqual({ oldProperty: 'new' });
    });
  });

  describe('Unset', () => {
    it('should set value passed on the same namespace', () => {
      const reducer1 = createReducer('1', {});
      const reducer2 = createReducer('2', {});

      const newState1 = reducer1({ defaultValue: 'default' }, actions.unset('1'));
      const newState2 = reducer2({ defaultValue: 'default' }, actions.unset('1'));

      expect(newState1.toJS()).toEqual({});
      expect(newState2.toJS()).toEqual({ defaultValue: 'default' });
    });
  });

  describe('Push', () => {
    it('should add an element to an array', () => {
      const reducer1 = createReducer('namespace1', []);
      const reducer2 = createReducer('namespace2', []);

      const newState1 = reducer1(
        Immutable([{ _id: '1' }]),
        actions.push('namespace1', { _id: '2' })
      );
      const newState2 = reducer2(
        Immutable([{ _id: '1' }]),
        actions.push('namespace1', { _id: '2' })
      );

      expect(newState1.toJS()).toEqual([{ _id: '1' }, { _id: '2' }]);
      expect(newState1.get(1).toJS()).toEqual({ _id: '2' });
      expect(newState2.toJS()).toEqual([{ _id: '1' }]);
    });
  });

  describe('Concat', () => {
    it('should concat an array to the list', () => {
      const reducer1 = createReducer('1', []);
      const reducer2 = createReducer('2', []);

      const newState1 = reducer1(Immutable([1, 2, 3]), actions.concat('1', [4, 5]));
      const newState2 = reducer2(Immutable([1, 2, 3]), actions.concat('1', [4, 5]));

      expect(newState1.toJS()).toEqual([1, 2, 3, 4, 5]);
      expect(newState2.toJS()).toEqual([1, 2, 3]);
    });
  });

  describe('Concat In', () => {
    it('should concat an array to the list at the specified key in the map', () => {
      const reducer1 = createReducer('1', {});
      const reducer2 = createReducer('2', {});

      const initial = { nested: { key: [1, 2] } };
      const newState1 = reducer1(
        Immutable(initial),
        actions.concatIn('1', ['nested', 'key'], [3, 4])
      );
      const newState2 = reducer2(
        Immutable(initial),
        actions.concatIn('1', ['nested', 'key'], [3, 4])
      );

      expect(newState1.toJS().nested.key).toEqual([1, 2, 3, 4]);
      expect(newState2.toJS().nested.key).toEqual([1, 2]);
    });
  });

  describe('Delete', () => {
    it('should delete an element from the array based on the id, when a custom index is not specified', () => {
      const reducer1 = createReducer('namespace1', []);
      const reducer2 = createReducer('namespace2', []);

      const newState1 = reducer1(
        [{ _id: '1' }, { _id: '2' }, { _id: '3' }],
        actions.remove('namespace1', { _id: '2' })
      );
      const newState2 = reducer2([{ _id: '2' }], actions.remove('namespace1', { _id: '2' }));

      expect(newState1.toJS()).toEqual([{ _id: '1' }, { _id: '3' }]);
      expect(newState2.toJS()).toEqual([{ _id: '2' }]);
    });

    it('should delete an element from the array based on the id, by a custom index', () => {
      const reducer1 = createReducer('namespace1', []);
      const reducer2 = createReducer('namespace2', []);

      const newState1 = reducer1(
        [{ customID: '1' }, { customID: '2' }, { customID: '3' }],
        actions.remove('namespace1', { customID: '2' }, 'customID')
      );
      const newState2 = reducer2(
        [{ customID: '2' }],
        actions.remove('namespace1', { customID: '2' }, 'customID')
      );

      expect(newState1.toJS()).toEqual([{ customID: '1' }, { customID: '3' }]);
      expect(newState2.toJS()).toEqual([{ customID: '2' }]);
    });
  });
});
