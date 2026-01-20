/* eslint-disable react/no-array-index-key */
import React, { useMemo, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { useAtomValue, useSetAtom } from 'jotai';
import sanitizeHtml from 'sanitize-html';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { t, Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.jsx';
import { templatesAtom } from '#V2/atoms/index.js';
import { ClientTemplateSchema } from '#app/istore.js';
import { SEARCH_PARAM } from '#V2/Routes/Entity/urlParams.js';
import { searchHintsModalAtom } from '#V2/Routes/Entity/Components/atoms.js';
import { LoaderResponse } from '#V2/Routes/Entity/types.js';
import { scrollToSnippet } from '#V2/Routes/Entity/Components/functions.js';
import { NoSearch, NoResults } from '#V2/Routes/Entity/Components/BlankState.jsx';

type FormValues = {
  search: string;
};

const getFieldName = (fieldName: string, template?: ClientTemplateSchema) => {
  if (fieldName === 'title') {
    return 'Title';
  }

  const propertyName = fieldName.split('.')[1];
  const propertyLabel =
    template?.properties?.find(property => property.name === propertyName)?.label || '';

  return propertyLabel;
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
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const templates = useAtomValue(templatesAtom);

  const template = useMemo(
    () => templates.find(temp => temp._id === entity?.template?._id),
    [entity, templates]
  );

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { search: initial },
  });

  const [activeSnippet, setActiveSnippet] = useState<string | null>(null);

  const onSubmit = async (data: FormValues) => {
    const params = new URLSearchParams(searchParams);
    const value = data.search.trim();
    if (value) {
      params.set(SEARCH_PARAM, value);
    } else {
      params.delete(SEARCH_PARAM);
    }
    setSearchParams(params);
  };

  return (
    <Panel>
      <Panel.Body>
        <div className="flex flex-col gap-2 h-full">
          <form onSubmit={handleSubmit(onSubmit)}>
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
                    className="w-full border border-gray-200 rounded-lg bg-white shadow-sm placeholder-gray-400 p-2"
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
          <div className="grow overflow-y-auto px-1">
            {!searchResults && <NoSearch />}
            {searchResults?.data && searchResults.data.length < 1 ? (
              <NoResults />
            ) : (
              <div className="flex flex-col gap-4 pt-1">
                {searchResults?.data.map((entry, i) => {
                  const { metadata, fullText } = entry.snippets;

                  if (!metadata?.length && !fullText?.length) {
                    return undefined;
                  }

                  return (
                    <div key={`entry-${i}`} className="flex flex-col gap-4">
                      {metadata?.length ? (
                        <>
                          <dl className="grid gap-y-2">
                            {metadata.map((m, j) => (
                              <div
                                key={`metadata-${i}-${j}`}
                                className="p-2 border border-gray-100 shadow-md rounded-lg"
                              >
                                <dt className="text-sm font-semibold text-gray-900">
                                  <Translate context={entity!.template!._id}>
                                    {getFieldName(m.field, template)}
                                  </Translate>
                                </dt>
                                {m.texts.map((text, k) => (
                                  <dd
                                    key={`metadata-${i}-${j}-${k}`}
                                    className="text-sm text-gray-900"
                                  >
                                    {parseSnippetToNodes(text)}
                                  </dd>
                                ))}
                              </div>
                            ))}
                          </dl>
                          <hr className="w-full" />
                        </>
                      ) : null}

                      {fullText?.length
                        ? fullText.map((pageText, j) => {
                          const snippetKey = `${i}-${j}`;
                          const isActive = activeSnippet === snippetKey;

                          return (
                            <div
                              key={snippetKey}
                              role="button"
                              tabIndex={0}
                              aria-pressed={isActive}
                              onClick={() => {
                                const newActive =
                                  activeSnippet === snippetKey ? null : snippetKey;
                                setActiveSnippet(newActive);

                                if (newActive) {
                                  scrollToSnippet(
                                    { text: pageText.text, page: pageText.page },
                                    currentPage
                                  );
                                }
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  const newActive =
                                    activeSnippet === snippetKey ? null : snippetKey;
                                  setActiveSnippet(newActive);

                                  if (newActive) {
                                    scrollToSnippet(
                                      { text: pageText.text, page: pageText.page },
                                      currentPage
                                    );
                                  }
                                }
                              }}
                              className={`p-4 border shadow-md rounded-lg cursor-pointer hover:bg-gray-50 transition
                              ${isActive ? 'border-primary-400' : 'border-gray-100'}`}
                            >
                              <p className="mb-4 px-2">{parseSnippetToNodes(pageText.text)}</p>
                              <p className="font-bold float-right">
                                {t('System', 'Page', null, false)} {pageText.page}
                              </p>
                            </div>
                          );
                        })
                        : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Panel.Body>

      <Panel.Footer>
        <button type="button" onClick={() => openHints(true)}>
          <Translate className="text-gray-600 underline font-bold">Search Tips</Translate>
        </button>
      </Panel.Footer>
    </Panel>
  );
};

export { SearchResults };
