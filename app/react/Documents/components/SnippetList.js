/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { t, I18NLink } from 'app/I18N';
import SafeHTML from 'app/utils/SafeHTML';

function getFieldLabel(field, template) {
  if (field === 'title') {
    return t('System', 'Title');
  }
  if (field.startsWith('metadata.') && template) {
    const name = field.split('.')[1];
    const property = template.get('properties').find(p => p.get('name') === name);
    if (property) {
      return t(template.get('_id'), property.get('label'));
    }
  }
  return field;
}

export const MetadataFieldSnippets = ({ fieldSnippets, documentViewUrl, template }) => (
  <React.Fragment>
    <li className="snippet-list-item-header metadata-snippet-header">
      <I18NLink to={documentViewUrl}>
        { getFieldLabel(fieldSnippets.get('field'), template) }
      </I18NLink>
    </li>
    {fieldSnippets.get('texts').map((snippet, index) => (
      <li key={index} className="snippet-list-item metadata-snippet">
        <span><SafeHTML>{snippet}</SafeHTML></span>
      </li>
    ))}
  </React.Fragment>
);

MetadataFieldSnippets.propTypes = {
  fieldSnippets: PropTypes.shape({
    texts: PropTypes.array,
    field: PropTypes.string
  }).isRequired,
  documentViewUrl: PropTypes.string.isRequired,
  template: PropTypes.shape({
    get: PropTypes.func
  })
};

MetadataFieldSnippets.defaultProps = {
  template: undefined
};

export const DocumentContentSnippets = ({ scrollToPage, documentSnippets, documentViewUrl, searchTerm }) => (
  <React.Fragment>
    <li className="snippet-list-item-header fulltext-snippet-header">
      {t('System', 'Document contents')}
    </li>
    {documentSnippets.map((snippet, index) => (
      <li key={index} className="snippet-list-item fulltext-snippet">
        <I18NLink
          onClick={() => scrollToPage(snippet.get('page'))}
          to={`${documentViewUrl}?page=${snippet.get('page')}&searchTerm=${searchTerm || ''}`}
        >
          {snippet.get('page')}
        </I18NLink>
        <span><SafeHTML>{snippet.get('text')}</SafeHTML></span>
      </li>
    ))}
  </React.Fragment>
);

DocumentContentSnippets.propTypes = {
  scrollToPage: PropTypes.func.isRequired,
  documentSnippets: PropTypes.shape({
    map: PropTypes.func
  }).isRequired,
  documentViewUrl: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired
};

export const SnippetList = ({ snippets, documentViewUrl, searchTerm, scrollToPage, template }) => (
  <ul className="snippet-list">
    {snippets.get('metadata').map(fieldSnippets => (
      <MetadataFieldSnippets
        key={fieldSnippets.get('field')}
        fieldSnippets={fieldSnippets}
        template={template}
        documentViewUrl={documentViewUrl}
      />
    ))}
    {snippets.get('fullText').size ? (
      <DocumentContentSnippets
        documentSnippets={snippets.get('fullText')}
        documentViewUrl={documentViewUrl}
        scrollToPage={scrollToPage}
        searchTerm={searchTerm}
      />
     ) : ''}
  </ul>
);

SnippetList.propTypes = {
  doc: PropTypes.shape({
    get: PropTypes.func
  }).isRequired,
  documentViewUrl: PropTypes.string.isRequired,
  scrollToPage: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  snippets: PropTypes.shape({
    get: PropTypes.func
  }).isRequired,
  template: PropTypes.shape({
    get: PropTypes.func
  })
};

SnippetList.defaultProps = {
  template: undefined
};

export const mapStateToProps = (state, ownProps) => ({
  template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.get('template'))
});

export default connect(mapStateToProps)(SnippetList);
