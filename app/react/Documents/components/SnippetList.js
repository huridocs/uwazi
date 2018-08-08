/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { t, I18NLink } from 'app/I18N';

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
  if (field.startsWith('metadata') && !template) {
    console.log('field no tpl', template);
  }
  return field;
}

export const MetadataFieldSnippets = ({ fieldSnippets, documentViewUrl, template}) => {
  return (
    <React.Fragment>
      <li>
        <I18NLink to={documentViewUrl}>
          { getFieldLabel(fieldSnippets.field, template) }
        </I18NLink>
      </li>
      <li>
        {fieldSnippets.texts.map((snippet, index) => (
          <span key={index} dangerouslySetInnerHTML={{ __html: snippet }} />
        ))}
      </li>
    </React.Fragment>
  );
};

export const DocumentContentSnippets = ({ scrollToPage, documentSnippets, documentViewUrl, searchTerm }) => {
  return (
    <React.Fragment>
      <li>
        {t('System', 'Document contents')}
      </li>
      {documentSnippets.map((snippet, index) => (
        <li key={index}>
          <I18NLink
            onClick={() => scrollToPage(snippet.page)}
            to={`${documentViewUrl}?page=${snippet.page}&searchTerm=${searchTerm || ''}`}
          >
            {snippet.page}
          </I18NLink>
          <span dangerouslySetInnerHTML={{ __html: snippet.text }} />
        </li>
      ))}
    </React.Fragment>
  );
};

export const SnippetList = ({ snippets, documentViewUrl, searchTerm, scrollToPage, template }) => (
  <ul className="snippet-list">
    {snippets.metadata.map(fieldSnippets => (
      <MetadataFieldSnippets
        key={fieldSnippets.field}
        fieldSnippets={fieldSnippets}
        template={template}
        documentViewUrl={documentViewUrl}
      />
    ))}
    {snippets.fullText.length ? (
      <DocumentContentSnippets
        documentSnippets={snippets.fullText}
        documentViewUrl={documentViewUrl}
        scrollToPage={scrollToPage}
        searchTerm={searchTerm}
      />
     ) : ''}
  </ul>
);

SnippetList.propTypes = {
  doc: PropTypes.object.isRequired,
  documentViewUrl: PropTypes.string.isRequired,
  scrollToPage: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  snippets: PropTypes.shape({
    count: PropTypes.number,
    metadata: PropTypes.array,
    fullText: PropTypes.array
  }).isRequired,
  template: PropTypes.object
};

export const mapStateToProps = (state, ownProps) => {
  const template = state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.get('template'));
  if (!template) {
    console.log('state tpl undefined', ownProps.doc, template);
  }
  return {
    template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.get('template'))
  };
};

export default connect(mapStateToProps)(SnippetList);
