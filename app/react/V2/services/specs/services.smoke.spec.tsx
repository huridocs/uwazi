/**
 * @jest-environment jsdom
 */
import { screen, waitFor } from '@testing-library/react';
import { templatesAtom } from '#V2/atoms/index.js';
import { ThesauriList } from '#V2/Routes/Settings/Thesauri/ThesauriList.js';
import { createThesauriLoader } from '#V2/Routes/Settings/Thesauri/createThesauriLoader.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { renderRoute } from '#V2/testing/renderRoute.js';
import { thesauri } from '#V2/Routes/Settings/Thesauri/specs/fixtures.js';

describe('V2 services infrastructure', () => {
  it('loads ThesauriList via createThesauriLoader with injected services', async () => {
    const listMock = jest.fn().mockResolvedValue([thesauri, undefined]);

    renderRoute({
      Component: ThesauriList,
      createLoader: svc => createThesauriLoader(svc)({}),
      services: { thesauri: { list: listMock } },
      atomInitialValues: [[templatesAtom, []]],
    });

    await waitFor(() => {
      expect(screen.getByTestId('settings-thesauri')).toBeInTheDocument();
    });

    expect(listMock).toHaveBeenCalledWith({ headers: {} });
    expect(screen.getByTestId('thesauri')).toHaveTextContent('Colors');
    expect(screen.getByTestId('thesauri')).toHaveTextContent('Names');
  });

  it('createTestServices merges partial overrides with defaults', () => {
    const listMock = jest.fn();
    const testServices = createTestServices({ thesauri: { list: listMock } });

    expect(testServices.thesauri.list).toBe(listMock);
    expect(typeof testServices.thesauri.save).toBe('function');
    expect(typeof testServices.users.get).toBe('function');
  });
});
