import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import {RowList} from 'app/Layout/Lists';
import Doc from 'app/Library/components/Doc';
import {t, I18NLink} from 'app/I18N';

export class ItemList extends Component {
  render() {
    const {items, link} = this.props;
    return (
      <div>
        <RowList>
          {items.map((item, index) => <Doc doc={item} key={index} />)}
        </RowList>
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

ItemList.propTypes = {
  items: PropTypes.array,
  link: PropTypes.string
};

export default connect()(ItemList);
