import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import t from '../I18N/t';

function getFieldLabel(field, template) {
  if (field === 'title') {
    return t('System', 'Title');
  }
  if (field.startsWith('metadata.')) {
    const name = field.split('.')[1];
    const label = template.get('properties').find(p => p.get('name') === name).get('label');
    return t(template.get('_id'), label);
  }
  return field;
}

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
  snippets: PropTypes.shape({
    count: PropTypes.number,
    metadata: PropTypes.array,
    fullText: PropTypes.array
  }).isRequired,
  onSnippetClick: PropTypes.func.isRequired,
  doc: PropTypes.object.isRequired,
  template: PropTypes.object.isRequired
};

export const mapStateToProps = (state, ownProps) => {
  return {
    template: state.templates.find(tmpl => tmpl.get('_id') === ownProps.doc.template)
  };
};

export default connect(mapStateToProps)(ItemSnippet);
