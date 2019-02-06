import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { RowList } from 'app/Layout/Lists';
import Immutable from 'immutable';
import t from 'app/I18N/t';

export function ResultItem(props) {
  const result = props.result.toJS();
  const { threshold, onClick, onMouseEnter, onMouseLeave, active } = props;
  const [aboveThreshold, totalThreshold] = result.results
  .reduce(([aboveThresh, totalThresh], r) => (
    [
      aboveThresh + (r.score > threshold ? 1 : 0),
      totalThresh + r.score
    ]), [0, 0]);
  const avgThreshold = totalThreshold / result.results.length;

  const itemProps = {
    className: 'item-document',
    onClick,
    onMouseEnter,
    onMouseLeave,
    active,
    tabIndex: '1'
  };
  return (
    <RowList.Item {...itemProps}>
      <div className="item-info">
        <div className="item-name">
          Document title
        </div>
        <div className="item-snippet-wrapper">
          <div className="item-snippet">
            <div className="item-snippet-source">
              {t('System', 'Document contents')}
            </div>
            <div className="item-snippet">
              { result.results[0].sentence }
            </div>
          </div>
          <div>
            <a>{ t('System', 'Show more') }</a>
          </div>
        </div>
      </div>
      <div className="item-metadata">
        <dl className='metadata-type-numeric'>
          <dt>{ t('System', 'Sentences above the threshold') }</dt>
          <dd>{aboveThreshold}</dd>
        </dl>
        <dl className='metadata-type-text'>
          <dt>{ t('System', 'Average sentence threshold') }</dt>
          <dd>{ avgThreshold }</dd>
        </dl>
      </div>
    </RowList.Item>
  );
}

ResultItem.propTypes = {
  result: PropTypes.instanceOf(Immutable.Map).isRequired,
  threshold: PropTypes.number,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  active: PropTypes.bool
};

ResultItem.defaultProps = {
  threshold: 0.5,
  onClick: () => {},
  onMouseEnter: () => {},
  onMouseLeave: () => {},
  active: false
};

export default connect()(ResultItem);
