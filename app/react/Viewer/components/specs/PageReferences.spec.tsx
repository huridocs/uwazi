/**
 * @jest-environment jsdom
 */
import React from 'react';
import { mount, shallow } from 'enzyme';
import Immutable from 'immutable';
import { Highlight } from '@huridocs/react-text-selection-handler';
import { Provider } from 'react-redux';
import configureStore, { MockStoreCreator } from 'redux-mock-store';
import { IStore } from 'app/istore';
import { TestAtomStoreProvider } from 'V2/testing';
import { pdfScaleAtom } from 'V2/atoms';
import { PageReferences, groupByRectangle } from '../PageReferences';

const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);

describe('FormConfigInput', () => {
  let props: any;
  let pdfScale: number;

  beforeEach(() => {
    props = {
      page: '3',
      onClick: jest.fn(),
    };
    pdfScale = 1;
  });

  afterEach(() => {});

  const store = mockStoreCreator({
    documentViewer: {
      doc: Immutable.fromJS({ sharedId: 'ab42' }),
      uiState: Immutable.fromJS({ activeReference: '2' }),
      targetDoc: Immutable.fromJS({}),
      targetDocReferences: Immutable.fromJS([]),
      references: Immutable.fromJS([
        { _id: '1', entity: 'ab42', reference: { selectionRectangles: [{ page: '2' }] } },
        { _id: '2', entity: 'ab42', reference: { selectionRectangles: [{ page: '3' }] } },
        {
          _id: '3',
          entity: 'ab42',
          reference: { selectionRectangles: [{ page: '3' }, { page: '4' }] },
        },
        {
          _id: '4',
          entity: 'ab42',
          reference: {
            selectionRectangles: [
              { page: '5', width: 100, top: 1, left: 2, height: 1 },
              { page: '5', width: 20, top: 3, left: 4, height: 1 },
            ],
          },
        },
        {
          _id: '5',
          entity: 'ce87',
          reference: { selectionRectangles: [{ page: '3', width: 101 }] },
        },
        {
          _id: '6',
          entity: 'df57',
          reference: { selectionRectangles: [{ page: '4', width: 100 }] },
        },
        {
          _id: '7',
          entity: 'vhsj',
          reference: { selectionRectangles: [{ page: '4', width: 100 }] },
        },
      ]),
    },
  });

  const render = () =>
    shallow(
      <Provider store={store}>
        <PageReferences {...props} />
      </Provider>
    )
      .dive({ context: { store } })
      .dive();

  it('should render Hihlight components with references of the page', () => {
    const component = render();
    const hihglights = component.find(Highlight);
    expect(hihglights.length).toBe(2);

    const firstHighlightProps: any = hihglights.at(0).props();
    expect(firstHighlightProps.textSelection).toEqual({ selectionRectangles: [{ regionId: '3' }] });
    expect(firstHighlightProps.color).toBe('#ffd84b');

    const secondHighlightProps: any = hihglights.at(1).props();
    expect(secondHighlightProps.color).toBe('#feeeb4');
  });

  it('should group references with same selection rectangles', () => {
    const result = groupByRectangle(store.getState() as IStore);
    expect(result).toEqual([
      [{ _id: '1', length: 1, start: { page: '2' }, end: { page: '2' } }],
      [{ _id: '2', length: 1, start: { page: '3' }, end: { page: '3' } }],
      [{ _id: '3', length: 2, start: { page: '3' }, end: { page: '4' } }],
      [
        {
          _id: '4',
          length: 2,
          start: { page: '5', width: 100, top: 1, left: 2, height: 1 },
          end: { page: '5', width: 20, top: 3, left: 4, height: 1 },
        },
      ],
      [{ _id: '5', length: 1, start: { page: '3', width: 101 }, end: { page: '3', width: 101 } }],
      [
        { _id: '6', length: 1, start: { page: '4', width: 100 }, end: { page: '4', width: 100 } },
        { _id: '7', length: 1, start: { page: '4', width: 100 }, end: { page: '4', width: 100 } },
      ],
    ]);
  });

  it('should scale references to match the pdf', () => {
    pdfScale = 0.9;
    props.page = '5';
    const component = mount(
      <Provider store={store}>
        <TestAtomStoreProvider initialValues={[[pdfScaleAtom, pdfScale]]}>
          <PageReferences {...props} />
        </TestAtomStoreProvider>
      </Provider>
    );
    const hihglights = component.find(Highlight);
    const firstHighlightProps: any = hihglights.at(0).props();
    expect(firstHighlightProps.textSelection.selectionRectangles).toEqual([
      { height: 0.9, left: 1.8, regionId: '5', top: 0.9, width: 90 },
      { height: 0.9, left: 3.6, regionId: '5', top: 2.7, width: 18 },
    ]);
  });
});
