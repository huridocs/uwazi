/* eslint-disable max-statements */
import React, { Suspense, useCallback, useLayoutEffect, useMemo, useState } from 'react';
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
import { installEntityPageStore } from './installEntityPageStore.js';

const EntityPageViewer = () => {
  const { entityPageView } = useEntityPageView();
  const [customPageError, setCustomPageError] = useState<unknown>(null);

  const handleScriptError = useCallback((error: unknown) => {
    setCustomPageError(error);
  }, []);

  const datasets = entityPageView?.datasets;
  const script = entityPageView?.pageView.metadata?.script || '';

  const datasetsImmutable = useMemo(() => Immutable.fromJS(datasets || {}), [datasets]);

  useLayoutEffect(() => {
    if (!script || !datasets || !window.store) return undefined;
    return installEntityPageStore(window.store, datasets);
  }, [datasets, script]);

  if (!entityPageView) {
    return null;
  }

  const { pageView, itemLists, errors } = entityPageView;
  const content = pageView.metadata?.content || '';
  const pageCss = pageView.metadata?.css || '';
  const parseMarkdown = pageView.markdownSupport === true;
  const lists = itemLists || [];
  const scriptCode = script
    ? `var datasets = ${JSON.stringify(entityPageView.datasets)};\n${script}`
    : '';

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
      <div className="entity-page-viewer">
        <main className="entity-viewer">
          <div className="row">
            <main className="page-viewer document-viewer">
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
                    <div className="alert alert-warning">
                      <Icon icon="exclamation-triangle" />
                      <span style={{ whiteSpace: 'pre-wrap' }}>{errors}</span>
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
        </main>
      </div>
    </Suspense>
  );
};

export { EntityPageViewer };
