/* eslint-disable react/no-danger */
/* eslint-disable react/no-array-index-key */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { t, I18NLink } from 'app/I18N';

export const MetadataFieldSnippets = ({ fieldSnippets, documentViewUrl }) => {
  return (
    <React.Fragment>
      <li>
        <span>{ fieldSnippets.field }</span>
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

export const SnippetList = ({ snippets, documentViewUrl, searchTerm, scrollToPage }) => (
  <ul className="snippet-list">
    {snippets.metadata.map(fieldSnippets => (
      <MetadataFieldSnippets key={fieldSnippets.field} fieldSnippets={fieldSnippets} />
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
  documentViewUrl: PropTypes.string.isRequired,
  scrollToPage: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  snippets: PropTypes.shape({
    count: PropTypes.number,
    metadata: PropTypes.array,
    fullText: PropTypes.array
  }).isRequired
};

export default connect()(SnippetList);
