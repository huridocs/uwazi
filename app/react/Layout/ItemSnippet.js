import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React from 'react';

import SafeHTML from 'app/utils/SafeHTML';
import getFieldLabel from 'app/Templates/utils/getFieldLabel';

import t from '../I18N/t';

export const ItemSnippet = ({ snippets, onSnippetClick, template }) => {
  let content;
  let source;
  if (snippets.metadata.length) {
    source = getFieldLabel(snippets.metadata[0].field, template);
    [content] = snippets.metadata[0].texts;
  } else {
    source = t('System', 'Document contents');
    content = snippets.fullText[0].text;
  }
  /* eslint-disable react/no-danger */
  const snippetElement = (
    <>
      <div className="item-snippet-source">{source}</div>
      <div onClick={onSnippetClick} className="item-snippet">
        <SafeHTML>{content}</SafeHTML>
      </div>
    </>
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
  snippets: PropTypes.shape({
    count: PropTypes.number,
    metadata: PropTypes.array,
    fullText: PropTypes.array,
  }).isRequired,
  onSnippetClick: PropTypes.func,
  doc: PropTypes.shape({
    template: PropTypes.string,
  }).isRequired,
  template: PropTypes.shape({
    get: PropTypes.func,
  }).isRequired,
};

ItemSnippet.defaultProps = {
  onSnippetClick: undefined,
};

export const mapStateToProps = (state, ownProps) => ({
  template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.template),
});

export default connect(mapStateToProps)(ItemSnippet);
