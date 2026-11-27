import { createLibraryLoader } from '../loader.js';
import { createTestServices } from '#V2/testing/createTestServices.js';

const searchLibrary = jest.fn();

describe('library loader unavailable filters', () => {
  beforeEach(() => {
    searchLibrary.mockReset();
    searchLibrary.mockResolvedValue([
      {
        rows: [],
        totalRows: 0,
        aggregations: { templates: [], published: { published: 0, restricted: 0 }, properties: {} },
      },
    ]);
  });

  it('redirects a select filter that the results do not show', async () => {
    const templates = jest.fn().mockResolvedValue([
      [
        {
          _id: 'contractors',
          properties: [{ name: 'yes_no', type: 'select', filter: true }],
        },
      ],
    ]);
    const loader = createLibraryLoader(
      createTestServices({
        search: { searchLibrary },
        templates: { getAll: templates },
      })
    )();

    const result = await loader({
      request: new Request(
        'http://localhost/en/libraryv2?filters=(type:(contractors),yes_no:(no))'
      ),
      params: {},
      context: undefined,
    } as never);

    expect(searchLibrary).toHaveBeenCalled();
    expect((result as Response).headers.get('Location')).toBe(
      '/en/libraryv2?filters=(type:(contractors))'
    );
  });
});
