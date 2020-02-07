import React, { Component } from 'react';
import { fromJS as Immutable } from 'immutable';
import PropTypes from 'prop-types';
import queryString from 'query-string';

import { RowList } from 'app/Layout/Lists';
import Doc from 'app/Library/components/Doc';
import { t, I18NLink } from 'app/I18N';
import { selectSingleDocument } from 'app/Library/actions/libraryActions';
import { wrapDispatch } from 'app/Multireducer';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Slider from './slider';

export class ItemList extends Component {
  render() {
    const { items, link } = this.props;
    const { sort } = queryString.parse(link.substring(link.indexOf('?')));
    const searchParams = sort ? { sort } : { sort: 'title' };

    const mapDispatchToProps = dispatch =>
      bindActionCreators(
        {
          onClick: (_e, item) => selectSingleDocument(item),
        },
        wrapDispatch(dispatch, 'library')
      );

    const toRenderItems = items.map((item, index) => {
      const ConnectedItem = connect(null, mapDispatchToProps)(Doc);
      return (
        <ConnectedItem
          key={index}
          doc={Immutable(item)}
          searchParams={searchParams}
          storeKey="library"
        />
      );
    });

    let list = <RowList>{toRenderItems}</RowList>;

    if (this.props.options.slider) {
      list = (
        <RowList>
          <Slider visibleCount={3}>{toRenderItems}</Slider>
        </RowList>
      );
    }

    return (
      <div>
        {list}
        <div className="row">
          <div className="col-sm-12 text-center">
            <I18NLink to={`${link}`}>
              <button className="btn btn-default">{t('System', 'View in library')}</button>
            </I18NLink>
          </div>
        </div>
      </div>
    );
  }
}

ItemList.defaultProps = {
  items: [],
  options: {},
};

ItemList.propTypes = {
  items: PropTypes.array,
  options: PropTypes.object,
  link: PropTypes.string,
};

export default ItemList;
