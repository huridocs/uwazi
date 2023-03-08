import { Entity } from 'api/entities.v2/model/Entity';
import { GraphQueryResultView } from '../GraphQueryResultView';

describe('GraphQueryResultView', () => {
  it('should map the title, when no inherited property is given', () => {
    const view = new GraphQueryResultView();
    const entities = ['1', '2', '3'].map(
      n => new Entity(n, `sharedId_${n}`, 'en', `title_${n}`, 'templateID', {})
    );
    expect(view.map(entities)).toEqual([
      {
        value: 'sharedId_1',
        label: 'title_1',
      },
      {
        value: 'sharedId_2',
        label: 'title_2',
      },
      {
        value: 'sharedId_3',
        label: 'title_3',
      },
    ]);
  });

  it('should map the title and inherited property', () => {
    const view = new GraphQueryResultView({
      name: 'numericProp',
      type: 'numeric',
    });
    const entities = [1, 2, 3].map(
      n =>
        new Entity(`${n}`, `sharedId_${n}`, 'en', `title_${n}`, 'templateID', {
          numericProp: [{ value: n }],
        })
    );
    expect(view.map(entities)).toEqual([
      {
        value: 'sharedId_1',
        label: 'title_1',
        inheritedValue: [{ value: 1 }],
        inheritedType: 'numeric',
      },
      {
        value: 'sharedId_2',
        label: 'title_2',
        inheritedValue: [{ value: 2 }],
        inheritedType: 'numeric',
      },
      {
        value: 'sharedId_3',
        label: 'title_3',
        inheritedValue: [{ value: 3 }],
        inheritedType: 'numeric',
      },
    ]);
  });
});
