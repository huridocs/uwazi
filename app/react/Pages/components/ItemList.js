import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';

import {Link} from 'react-router';
import {RowList} from 'app/Layout/Lists';
import Doc from 'app/Library/components/Doc';

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
            <Link to={`${link}`}>
              <button className="btn btn-default">View in library</button>
            </Link>
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
