/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { t, I18NLink } from 'app/I18N';
import SafeHTML from 'app/utils/SafeHTML';
import getFieldLabel from 'app/Templates/utils/getFieldLabel';

export const MetadataFieldSnippets = ({ fieldSnippets, documentViewUrl, template, searchTerm }) => (
  <React.Fragment>
    <li className="snippet-list-item-header metadata-snippet-header">
      <I18NLink to={`${documentViewUrl}?searchTerm=${searchTerm}`}>
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
  </React.Fragment>
);

MetadataFieldSnippets.defaultProps = {
  searchTerm: '',
};

MetadataFieldSnippets.propTypes = {
  fieldSnippets: PropTypes.shape({
    texts: PropTypes.array,
    field: PropTypes.string,
  }).isRequired,
  documentViewUrl: PropTypes.string.isRequired,
  searchTerm: PropTypes.string,
  template: PropTypes.shape({
    get: PropTypes.func,
  }),
};

MetadataFieldSnippets.defaultProps = {
  template: undefined,
};

export const DocumentContentSnippets = ({
  selectSnippet,
  documentSnippets,
  documentViewUrl,
  searchTerm,
  selectedSnippet,
}) => (
  <React.Fragment>
    <li className="snippet-list-item-header fulltext-snippet-header">
      {t('System', 'Document contents')}
    </li>
    {documentSnippets.map((snippet, index) => {
      const selected = snippet.get('text') === selectedSnippet.get('text') ? 'selected' : '';
      return (
        <li key={index} className={`snippet-list-item fulltext-snippet ${selected}`}>
          <I18NLink
            onClick={() => selectSnippet(snippet.get('page'), snippet)}
            to={`${documentViewUrl}?page=${snippet.get('page')}&searchTerm=${searchTerm || ''}`}
          >
            <span className="page-number">{snippet.get('page')}</span>
            <span className="snippet-text">
              <SafeHTML>{snippet.get('text')}</SafeHTML>
            </span>
          </I18NLink>
        </li>
      );
    })}
  </React.Fragment>
);

DocumentContentSnippets.propTypes = {
  selectSnippet: PropTypes.func.isRequired,
  documentSnippets: PropTypes.shape({
    map: PropTypes.func,
  }).isRequired,
  selectedSnippet: PropTypes.shape({
    get: PropTypes.func,
  }).isRequired,
  documentViewUrl: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired,
};

export const SnippetList = ({
  snippets,
  documentViewUrl,
  searchTerm,
  selectSnippet,
  template,
  selectedSnippet,
}) => (
  <ul className="snippet-list">
    {snippets.get('metadata').map(fieldSnippets => (
      <MetadataFieldSnippets
        key={fieldSnippets.get('field')}
        fieldSnippets={fieldSnippets}
        template={template}
        documentViewUrl={documentViewUrl}
        searchTerm={searchTerm}
      />
    ))}
    {snippets.get('fullText').size ? (
      <DocumentContentSnippets
        documentSnippets={snippets.get('fullText')}
        documentViewUrl={documentViewUrl}
        selectSnippet={selectSnippet}
        selectedSnippet={selectedSnippet}
        searchTerm={searchTerm}
      />
    ) : (
      ''
    )}
  </ul>
);

SnippetList.propTypes = {
  documentViewUrl: PropTypes.string.isRequired,
  selectSnippet: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  selectedSnippet: PropTypes.shape({
    get: PropTypes.func,
  }).isRequired,
  snippets: PropTypes.shape({
    get: PropTypes.func,
  }).isRequired,
  template: PropTypes.shape({
    get: PropTypes.func,
  }),
};

SnippetList.defaultProps = {
  template: undefined,
};

export const mapStateToProps = (state, ownProps) => ({
  template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.get('template')),
  selectedSnippet: state.documentViewer.uiState.get('snippet'),
});

export default connect(mapStateToProps)(SnippetList);
