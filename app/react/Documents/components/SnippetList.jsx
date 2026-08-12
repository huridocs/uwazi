/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { t, I18NLink } from '#app/I18N/index.js';
import { SafeHTML } from '#app/utils/SafeHTML.js';
import getFieldLabel from '#app/Templates/utils/getFieldLabel.js';
import Immutable from 'immutable';
import { buildEntitySnippetLink } from '#app/utils/entityViewerPaths.js';

const MetadataFieldSnippets = ({
  fieldSnippets,
  sharedId,
  template,
  searchTerm = '',
  entityViewerV2,
  legacyBasePath,
}) => (
  <>
    <li className="snippet-list-item-header metadata-snippet-header">
      <I18NLink
        to={buildEntitySnippetLink({
          sharedId,
          searchTerm,
          entityViewerV2,
          legacyBasePath,
        })}
      >
        {getFieldLabel(fieldSnippets.get('field'), template)}
      </I18NLink>
    </li>
    {fieldSnippets.get('texts').map((snippet, index) => (
      <li key={index} className="snippet-list-item metadata-snippet">
        <span>
          <SafeHTML>{snippet}</SafeHTML>
        </span>
      </li>
    ))}
  </>
);

MetadataFieldSnippets.propTypes = {
  fieldSnippets: PropTypes.instanceOf(Immutable.Map).isRequired,
  sharedId: PropTypes.string.isRequired,
  searchTerm: PropTypes.string,
  template: PropTypes.shape({
    get: PropTypes.func,
  }),
  entityViewerV2: PropTypes.bool,
  legacyBasePath: PropTypes.string,
};

const DocumentContentSnippets = ({
  selectSnippet,
  documentSnippets,
  sharedId,
  searchTerm,
  selectedSnippet,
  entityViewerV2,
  legacyBasePath,
}) => (
  <>
    <li className="snippet-list-item-header fulltext-snippet-header">
      {t('System', 'Document contents')}
    </li>
    {documentSnippets.map((snippet, index) => {
      const selected = snippet.get('text') === selectedSnippet.get('text') ? 'selected' : '';
      const filename = snippet.get('filename');
      const page = snippet.get('page');
      return (
        <li key={index} className={`snippet-list-item fulltext-snippet ${selected}`}>
          <I18NLink
            onClick={() => selectSnippet(page, snippet)}
            to={buildEntitySnippetLink({
              sharedId,
              searchTerm,
              page,
              filename,
              entityViewerV2,
              legacyBasePath,
            })}
          >
            <span className="page-number">{page}</span>
            <span className="snippet-text">
              <SafeHTML>{snippet.get('text')}</SafeHTML>
            </span>
          </I18NLink>
        </li>
      );
    })}
  </>
);

DocumentContentSnippets.propTypes = {
  selectSnippet: PropTypes.func.isRequired,
  documentSnippets: PropTypes.shape({
    map: PropTypes.func,
  }).isRequired,
  selectedSnippet: PropTypes.shape({
    get: PropTypes.func,
  }).isRequired,
  sharedId: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired,
  entityViewerV2: PropTypes.bool,
  legacyBasePath: PropTypes.string,
};

const SnippetList = ({
  snippets,
  sharedId,
  searchTerm,
  selectSnippet,
  template,
  selectedSnippet,
  entityViewerV2,
  legacyBasePath,
}) => {
  const safeSelectedSnippet =
    selectedSnippet && typeof selectedSnippet.get === 'function'
      ? selectedSnippet
      : Immutable.Map();
  return (
    <ul className="snippet-list">
      {snippets.get('metadata').map(fieldSnippets => (
        <MetadataFieldSnippets
          key={fieldSnippets.get('field')}
          fieldSnippets={fieldSnippets}
          template={template}
          sharedId={sharedId}
          searchTerm={searchTerm}
          entityViewerV2={entityViewerV2}
          legacyBasePath={legacyBasePath}
        />
      ))}
      {snippets.get('fullText').size ? (
        <DocumentContentSnippets
          documentSnippets={snippets.get('fullText')}
          sharedId={sharedId}
          selectSnippet={selectSnippet}
          searchTerm={searchTerm}
          selectedSnippet={safeSelectedSnippet}
          entityViewerV2={entityViewerV2}
          legacyBasePath={legacyBasePath}
        />
      ) : (
        ''
      )}
    </ul>
  );
};

SnippetList.propTypes = {
  sharedId: PropTypes.string.isRequired,
  selectSnippet: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  selectedSnippet: PropTypes.shape({
    get: PropTypes.func,
  }),
  snippets: PropTypes.shape({
    get: PropTypes.func,
  }).isRequired,
  template: PropTypes.shape({
    get: PropTypes.func,
  }),
  entityViewerV2: PropTypes.bool,
  legacyBasePath: PropTypes.string,
};

const mapStateToProps = (state, ownProps) => ({
  template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.get('template')),
  selectedSnippet: state.documentViewer.uiState.get('snippet'),
  entityViewerV2: Boolean(
    state.settings?.collection?.getIn(['features', 'featureFlagEntityViewerv2'])
  ),
  sharedId: ownProps.doc.get('sharedId'),
});

const SnippetListConnected = connect(mapStateToProps)(SnippetList);
export {
  DocumentContentSnippets,
  MetadataFieldSnippets,
  SnippetList,
  SnippetListConnected,
  mapStateToProps,
};
