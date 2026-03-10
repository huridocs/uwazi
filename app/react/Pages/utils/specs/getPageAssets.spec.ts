/* eslint-disable no-template-curly-in-string */
import api from 'app/Search/SearchAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { markdownDatasets } from 'app/Markdown';

import PagesAPI from '../../PagesAPI';
import pageItemLists from '../pageItemLists';

import { getPageAssets } from '../getPageAssets';

describe('getPageAssets', () => {
  let page: { _id: string; title: string; metadata: { content: string } };
  let data;
  let request: RequestParams;
  let apiSearch: jasmine.Spy;

  beforeEach(() => {
    page = {
      _id: 'abc2',
      title: 'Page 1',
      metadata: /*non-metadata-object*/ { content: 'originalContent' },
    };

    spyOn(PagesAPI, 'getById').and.callFake(async () => Promise.resolve(page));

    spyOn(pageItemLists, 'generate').and.returnValue({
      content: 'parsedContent',
      params: [
        '?q=(a:1,b:2)',
        '',
        '?q=(x:1,y:!(%27array%27),limit:24)',
        '?order=metadata.form&treatAs=number',
      ],
      options: [{}, { limit: 9 }, { limit: 0 }, { limit: 12 }],
    });

    let searchCalls = -1;

    apiSearch = jasmine.createSpy('apiSearch').and.callFake(async () => {
      searchCalls += 1;
      return Promise.resolve({ rows: [`resultsFor:${searchCalls}`] });
    });

    spyOn(api, 'search').and.callFake(apiSearch);

    data = { sharedId: 'abc2' };
    request = new RequestParams(data, 'headers');
  });

  it('should request page for view', async () => {
    const stateActions = await getPageAssets(request);

    expect(PagesAPI.getById).toHaveBeenCalledWith(request);
    expect(stateActions).toMatchSnapshot();
  });

  const assertItemLists = (itemLists: any) => {
    expect(itemLists.length).toBe(4);
    expect(itemLists[0].params).toBe('?q=(a:1,b:2)');
    expect(itemLists[0].items).toEqual(['resultsFor:0']);
    expect(itemLists[1].params).toBe('');
    expect(itemLists[1].items).toEqual(['resultsFor:1']);
    expect(itemLists[2].params).toBe('?q=(x:1,y:!(%27array%27),limit:24)');
    expect(itemLists[2].items).toEqual(['resultsFor:2']);
    expect(itemLists[3].params).toBe('?order=metadata.form&treatAs=number');
    expect(itemLists[3].items).toEqual(['resultsFor:3']);
    expect(itemLists[3].options).toEqual({ limit: 12 });
  };

  it('should request each list inside the content limited to 6 items (default) or the passed value and set the state', async () => {
    const stateActions = await getPageAssets(request);

    expect(apiSearch.calls.count()).toBe(4);
    expect(JSON.parse(JSON.stringify(apiSearch.calls.argsFor(0)[0]))).toEqual({
      data: { a: 1, b: 2, limit: '6' },
      headers: 'headers',
    });
    expect(apiSearch.calls.argsFor(1)[0]).toEqual({
      data: { filters: {}, types: [], limit: '9' },
      headers: 'headers',
    });

    expect(JSON.parse(JSON.stringify(apiSearch.calls.argsFor(2)[0]))).toEqual({
      data: {
        x: 1,
        y: ['array'],
        limit: '6',
      },
      headers: 'headers',
    });
    expect(apiSearch.calls.argsFor(3)[0]).toEqual({
      data: { filters: {}, types: [], limit: '12' },
      headers: 'headers',
    });

    assertItemLists(stateActions.itemLists);
  });

  describe('Datasets', () => {
    let markdownDatasetsResponse: {};

    beforeEach(() => {
      markdownDatasetsResponse = { request1: 'url1', request2: 'url2' };
      spyOn(markdownDatasets, 'fetch').and.callFake(async (content, requestParams, options) => {
        expect(content).toBe('originalContent');
        expect(requestParams).toEqual(request.onlyHeaders());
        return Promise.resolve({ ...markdownDatasetsResponse, ...options.additionalDatasets });
      });
    });

    it('should request each dataset inside the content', async () => {
      const stateActions = await getPageAssets(request);
      expect(stateActions.datasets).toEqual(markdownDatasetsResponse);
    });

    describe('Extended datasets and data', () => {
      it('should request additional dataset queries and passed data', async () => {
        const stateActions = await getPageAssets(
          request,
          { customDataset: { url: 'someurl' } },
          { customData: { localData: 'from store' } }
        );

        expect(stateActions.datasets).toEqual({
          request1: 'url1',
          request2: 'url2',
          customDataset: { url: 'someurl' },
          customData: { localData: 'from store' },
        });
      });
    });
  });

  describe('Dynamic content', () => {
    const localDatasets = {
      entityData: {
        sharedId: 'mtpkxxe1uom',
        title: 'My entity',
        metadata: {
          my_text_property: [
            {
              value: 'some text',
              displayValue: 'some text',
            },
          ],
          numericValue: [{ value: 1993, displayValue: 1993 }],
          a_date: [{ value: 747198000, displayValue: 'September 5, 1993' }],
          multiselect: [
            { value: '123fgfdcv', displayValue: 'Option 1' },
            { value: 'yjk56dfgd', displayValue: 'Option 2' },
          ],
          multiDateRange: [
            {
              value: {
                from: 1651968000,
                to: 1652486399,
              },
              displayValue: 'May 5, 2022 - May 5, 2023',
            },
            {
              value: {
                from: 1652572800,
                to: 1653091199,
              },
              displayValue: 'May 5, 2024 - May 5, 2025',
            },
          ],
        },
      },
      template: {
        name: 'Document',
        properties: [
          {
            _id: '6267e68226904c252518f914',
            label: 'Text',
            type: 'text',
            name: 'text',
            filter: true,
          },
        ],
      },
    };
    it('should parse the content and insert references to dataset', async () => {
      page.metadata.content =
        '<h1>${entity.metadata.my_text_property} from template ${template.name}</h1>';
      const assets = await getPageAssets(request, undefined, localDatasets);
      expect(assets.pageView.metadata.content).toBe('<h1>some text from template Document</h1>');
      expect(assets.errors).not.toBeDefined();
    });

    it.each`
      path                                              | result
      ${'entity.title'}                                 | ${'My entity'}
      ${'entity.sharedId'}                              | ${'mtpkxxe1uom'}
      ${'entity.metadata.a_date'}                       | ${747198000}
      ${'entity.metadata.a_date.value'}                 | ${747198000}
      ${'entity.metadata.a_date.displayValue'}          | ${'September 5, 1993'}
      ${'entity.metadata.multiselect'}                  | ${'123fgfdcv'}
      ${'entity.metadata.multiselect[0]'}               | ${'123fgfdcv'}
      ${'entity.metadata.multiselect[1]'}               | ${'yjk56dfgd'}
      ${'entity.metadata.multiselect.displayValue'}     | ${'Option 1'}
      ${'entity.metadata.multiselect[0].displayValue'}  | ${'Option 1'}
      ${'entity.metadata.multiselect[0].value'}         | ${'123fgfdcv'}
      ${'entity.metadata.multiselect[1].displayValue'}  | ${'Option 2'}
      ${'entity.metadata.multiDateRange'}               | ${{ from: 1651968000, to: 1652486399 }}
      ${'entity.metadata.multiDateRange[0].value.from'} | ${1651968000}
    `('should work for entity path $path', async ({ path, result }) => {
      page.metadata.content = `<p>My dynamic path results is: \${${path}}</p>`;
      const assets = await getPageAssets(request, undefined, localDatasets);
      expect(assets.pageView.metadata.content).toBe(`<p>My dynamic path results is: ${result}</p>`);
    });

    it('should ignore references if they are not part of a dataset', async () => {
      page.metadata.content = '<h1>${entity.sharedId} from template ${template.metadata}</h1>';
      const assets = await getPageAssets(request, undefined, localDatasets);
      expect(assets.pageView.metadata.content).toBe(
        '<h1>mtpkxxe1uom from template ${template.metadata}</h1>'
      );
      expect(assets.errors).toEqual(
        'The following expressions are not valid properties:\n ${template.metadata}'
      );
    });
  });
});
