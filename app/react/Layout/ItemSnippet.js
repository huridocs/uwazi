import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import t from '../I18N/t';

export const ItemSnippet = ({ snippets, onSnippetClick }) => {
  let content;
  let source;

  if (snippets.metadata.length) {
    source = snippets.metadata[0].field;
    [content] = snippets.metadata[0].texts;
  } else {
    source = t('System', 'Document contents');
    content = snippets.fullText[0].text;
  }
  /* eslint-disable react/no-danger */
  const snippetElement = (
    <React.Fragment>
      <div className="item-snippet-source">{source}</div>
      <div
        onClick={onSnippetClick}
        className="item-snippet"
        dangerouslySetInnerHTML={{ __html: `${content} ...` }}
      />
    </React.Fragment>
  );

  if (snippets.count === 1) {
    return <div className="item-snippet-wrapper">{snippetElement}</div>;
  }

  return (
    <div className="item-snippet-wrapper">
      {snippetElement}
      <div>
        <a onClick={onSnippetClick}>{t('System', 'Show more')}</a>
      </div>
    </div>
  );  
};

ItemSnippet.propTypes = {
  snippets: PropTypes.object,
  onSnippetClick: PropTypes.func
};

export default connect()(ItemSnippet);
