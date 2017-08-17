import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {I18NLink} from 'app/I18N';
import Loader from 'app/components/Elements/Loader';

import api from 'app/Search/SearchAPI';

const casesIds = ['58b2f3a35d59f31e1345b48a', '58b2f3a35d59f31e1345b4a4'];
const documentsIds = ['58b2f3a35d59f31e1345b4ac', '58b2f3a35d59f31e1345b471', '58b2f3a35d59f31e1345b482', '58b2f3a35d59f31e1345b479'];

export class cejilChart001 extends Component {

  getData() {
    api.search({limit: 0})
    .then(results => {
      this.setState({data: results.aggregations.all});
    });
  }

  conformLibraryLink(types, sort) {
    const escapedValues = types.map(t => '%27' + t + '%27');
    return `/library/?q=(order:desc,sort:${sort},types:!(${escapedValues.join(',')}),userSelectedSorting:!t)`;
  }

  getCount(ids) {
    return ids.reduce((count, id) => {
      const bucket = this.state.data.types.buckets.find(b => b.key === id);
      return count + (bucket ? bucket.filtered.doc_count : 0);
    }, 0);
  }

  componentDidMount() {
    this.getData();
  }

  render() {
    const {title = '', subtitle = '', buttons = []} = this.props;

    let header = <Loader />;
    if (this.state && this.state.data) {
      const casesCount = this.getCount(casesIds);
      const documentsCount = this.getCount(documentsIds);

      header = <h1>{title.replace('XX', casesCount).replace('YY', documentsCount)}</h1>;
    }

    return (
      <div className="hero">
        {header}
        <p>{subtitle}</p>
        <div>
          <I18NLink className="btn btn-primary" to={this.conformLibraryLink(casesIds, 'metadata._ltima_actualizaci_n')}>
            {buttons[0]}
            <i className="fa fa-angle-right"></i>
          </I18NLink>
          <I18NLink className="btn btn-primary" to={this.conformLibraryLink(documentsIds, 'metadata.fecha')}>
            {buttons[1]}
            <i className="fa fa-angle-right"></i>
          </I18NLink>
        </div>
      </div>
    );
  }
}

cejilChart001.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  buttons: PropTypes.array
};

export function mapStateToProps({templates, thesauris}) {
  return {templates, thesauris};
}

export default connect(mapStateToProps)(cejilChart001);
