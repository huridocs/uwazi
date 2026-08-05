/* eslint-disable max-statements */
import React, { Suspense, useCallback, useMemo, useState } from 'react';
import Immutable from 'immutable';
import { Icon } from '#UI/Icon/Icon.js';
import { Translate } from '#app/I18N/index.js';
import { MarkdownViewer } from '#app/Markdown/index.js';
import { Context } from '#app/Markdown/components/index.js';
import { NeedAuthorization } from '#app/Auth/index.js';
import { ErrorBoundary, ErrorFallback } from '#V2/Components/ErrorHandling/index.js';
import { PageStyle } from '#app/Pages/components/PageStyle.js';
import { useEntityPageView } from './EntityPageViewContext.js';
import { EntityPageScript } from './EntityPageScript.js';

const buildScriptWithDatasets = (script: string, datasets: Record<string, unknown>) => {
  const datasetsJson = JSON.stringify(datasets ?? {});
  // Inject plain `datasets` and a minimal store shim for legacy scripts that still
  // call window.store.getState().page.datasets.getIn(...).
  return `var datasets = ${datasetsJson};
(function(){
  var pathGet = function(obj, path) {
    return path.reduce(function(acc, key) {
      return acc == null ? acc : acc[key];
    }, obj);
  };
  var immutableLike = {
    getIn: function(path) { return pathGet(datasets, path); },
    get: function(key) { return datasets[key]; },
    toJS: function() { return datasets; }
  };
  if (typeof window !== 'undefined' && window.store && typeof window.store.getState === 'function') {
    var originalGetState = window.store.getState.bind(window.store);
    window.store.getState = function() {
      var state = originalGetState();
      var page = Object.assign({}, state.page || {}, { datasets: immutableLike });
      return Object.assign({}, state, { page: page });
    };
  }
})();
${script}`;
};

const EntityPageViewer = () => {
  const { entityPageView } = useEntityPageView();
  const [customPageError, setCustomPageError] = useState<unknown>(null);

  const handleScriptError = useCallback((error: unknown) => {
    setCustomPageError(error);
  }, []);

  const datasetsImmutable = useMemo(
    () => Immutable.fromJS(entityPageView?.datasets || {}),
    [entityPageView?.datasets]
  );

  if (!entityPageView) {
    return null;
  }

  const { pageView, itemLists, datasets, errors } = entityPageView;
  const content = pageView.metadata?.content || '';
  const pageCss = pageView.metadata?.css || '';
  const script = pageView.metadata?.script || '';
  const parseMarkdown = pageView.markdownSupport === true;
  const lists = itemLists || [];
  const scriptCode = script ? buildScriptWithDatasets(script, datasets) : '';

  if (errors && !content) {
    return (
      <div className="main-wrapper p-4">
        <ErrorFallback
          error={Object.assign(new Error(errors), { status: 500, name: 'Entity view page' })}
        />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="p-4">
          <Translate>Loading</Translate>...
        </div>
      }
    >
      <div className="entity-page-viewer flex min-h-0 flex-1 flex-col overflow-auto">
        <main className="page-viewer document-viewer min-h-0 flex-1">
          <div className="main-wrapper">
            <PageStyle>{pageCss}</PageStyle>
            {customPageError ? (
              <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
                <div className="alert alert-danger">
                  <Icon icon="exclamation-triangle" />
                  <Translate translationKey="custom page error warning">
                    There is an unexpected error on this custom page, it may not work properly.
                    Please contact an admin for details.
                  </Translate>
                  <Icon icon="times" onClick={() => setCustomPageError(null)} />
                </div>
              </NeedAuthorization>
            ) : null}
            {errors ? (
              <NeedAuthorization roles={['admin', 'editor', 'collaborator']}>
                <div className="alert alert-warning mx-4 mt-2">
                  <Icon icon="exclamation-triangle" />
                  <span className="whitespace-pre-wrap">{errors}</span>
                </div>
              </NeedAuthorization>
            ) : null}
            <Context.Provider value={datasetsImmutable}>
              <ErrorBoundary>
                <MarkdownViewer
                  html
                  markdown={content}
                  lists={lists}
                  sanitized={false}
                  parseMarkdown={parseMarkdown}
                />
              </ErrorBoundary>
            </Context.Provider>
          </div>
        </main>
        {scriptCode ? <EntityPageScript code={scriptCode} onError={handleScriptError} /> : null}
      </div>
    </Suspense>
  );
};

export { EntityPageViewer };
