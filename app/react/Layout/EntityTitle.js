import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

const getTitle = createSelector(
  s => s.thesauris,
  (_s, p) => p.entity,
  (_s, p) => p.context,
  (thesauris, entity, context) => {
    const thesauri = thesauris.find(
      t => t.get('type') === 'template' && t.get('_id').toString() === context.toString()
    );
    return thesauri
      .get('values')
      .find(v => v.get('id') === entity)
      .get('label');
  }
);

const EntityTitle = ({ title }) => <span className="entity-title">{title}</span>;

EntityTitle.defaultProps = {
  title: '',
};

EntityTitle.propTypes = {
  title: PropTypes.string,
};

export const mapStateToProps = (state, props) => ({
  title: getTitle(state, props),
});

export default connect(mapStateToProps)(EntityTitle);
