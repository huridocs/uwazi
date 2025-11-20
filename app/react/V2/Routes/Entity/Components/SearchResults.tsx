import React, { useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { useSetAtom } from 'jotai';
import sanitizeHtml from 'sanitize-html';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from 'app/I18N';
import { handleUnexpectedError } from 'V2/shared/errorUtils';
import { SnippetsSearchResponse } from 'V2/api/types';
import { snippets as snippetsSearch } from 'V2/api/search';
import { Button } from 'V2/Components/UI';
import { SEARCH_PARAM } from './urlParams';
import { searchHintsModalAtom } from './atoms';
import { LoaderResponse } from './types';

type FormValues = {
  search: string;
};

const createNode = (node: ChildNode, key: number): React.ReactNode => {
  if (node.type === 'text') {
    return node.data;
  }

  if (node.type === 'tag') {
    const element = node;
    return React.createElement(
      'b',
      { key },
      element.children &&
        element.children.map((child: ChildNode, index: number) => createNode(child, index))
    );
  }

  return '';
};

const parseSnippetToNodes = (html?: string) => {
  const sanitized = sanitizeHtml(html || '', { allowedTags: ['b'], allowedAttributes: {} });
  if (!sanitized) {
    return '';
  }

  const document = parseDocument(sanitized);
  return document.children.map((node, i) => createNode(node as ChildNode, i));
};

const SearchResults = () => {
  const { searchResults, entity } = useLoaderData<LoaderResponse>() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const openHints = useSetAtom(searchHintsModalAtom);
  const initial = new URLSearchParams(searchParams).get(SEARCH_PARAM) || '';
  const [snippets, setSnippets] = useState<SnippetsSearchResponse | undefined>(searchResults);

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { search: initial },
  });

  const onSubmit = async (data: FormValues) => {
    const params = new URLSearchParams(searchParams);
    const value = data.search.trim();
    if (value) {
      params.set(SEARCH_PARAM, value);
    } else {
      params.delete(SEARCH_PARAM);
    }
    setSearchParams(params);

    try {
      const newSnippets = await snippetsSearch({
        sharedId: entity?.sharedId!,
        searchString: value,
        limit: 0,
      });
      setSnippets(newSnippets);
    } catch (error) {
      handleUnexpectedError(error, 'Error searching');
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="px-1">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto">
          <label htmlFor="entity-search" className="sr-only">
            <Translate>Search</Translate>
          </label>

          <div className="relative">
            <Controller
              name="search"
              control={control}
              render={({ field }) => (
                <input
                  id="entity-search"
                  type="search"
                  placeholder={t('System', 'Search', null, false)}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...field}
                  className="w-full border border-gray-200 rounded-lg bg-white shadow-sm placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
            />

            <button
              type="submit"
              aria-label="Search"
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-900" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
      <div className="flex-grow overflow-y-auto">
        {!snippets && (
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <Translate className="text-gray-600 font-bold text-lg">Search text</Translate>
            <MagnifyingGlassIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
            <Translate
              className="text-gray-600 font-semibold"
              translationKey="Search text description"
            >
              Search text description
            </Translate>
          </div>
        )}
        {!snippets?.data.length && (
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <Translate className="text-gray-600 font-bold text-lg">No text match</Translate>
            <MagnifyingGlassIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
            <Translate
              className="text-gray-600 font-semibold"
              translationKey="No text match description"
            >
              No text match description
            </Translate>
          </div>
        )}
        {snippets?.data.length && (
          <div className="flex flex-col gap-4">
            {snippets?.data.map(entry => {
              if (entry.snippets?.fullText?.length) {
                return entry.snippets.fullText.map(pageText => (
                  <div
                    key={`snippet-${entry._id}-${pageText.page}`}
                    className="p-5 border border-gray-100 shadow-sm rounded-lg"
                  >
                    <p className="mb-4 px-2">{parseSnippetToNodes(pageText.text)}</p>
                    <p className="mb-4 px-2 font-bold">{pageText.page}</p>
                    <Button
                      className="float-end"
                      styling="light"
                      onClick={() => {
                        console.log(pageText.page);
                      }}
                    >
                      View
                    </Button>
                  </div>
                ));
              }
              return undefined;
            })}
          </div>
        )}
      </div>
      <div>
        <button type="button" onClick={() => openHints(true)}>
          <Translate className="text-gray-600 underline font-bold">Search Tips</Translate>
        </button>
      </div>
    </div>
  );
};

export { SearchResults };
