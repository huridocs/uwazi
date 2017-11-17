import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {I18NLink} from 'app/I18N';

import api from 'app/Search/SearchAPI';

const processesIds = ['58b2f3a35d59f31e1345b48a'];
const provisionalMeasuresIds = ['58b2f3a35d59f31e1345b4a4'];
const documentsIds = ['58b2f3a35d59f31e1345b4ac', '58b2f3a35d59f31e1345b471', '58b2f3a35d59f31e1345b482', '58b2f3a35d59f31e1345b479'];

export class cejilChart001 extends Component {

  getData() {
    api.search({limit: 0})
    .then(results => {
      this.setState({data: results.aggregations.all});
    });
  }

  conformLibraryLink(types, link) {
    const escapedValues = types.map(t => '%27' + t + '%27');
    if (link && link.indexOf('/library/') !== -1) {
      return link.substring(link.indexOf('/library/'), link.length);
    }
    return `/library/?q=(order:desc,sort:creationDate,types:!(${escapedValues.join(',')}),userSelectedSorting:!t)`;
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
    const {title = '', buttons = [], links = []} = this.props;
    const Loader = <i className="fa fa-spinner fa-pulse fa-fw"></i>;

    let processesCount = Loader;
    let provisionalMeasuresCount = Loader;
    let documentsCount = Loader;

    if (this.state && this.state.data) {
      processesCount = this.getCount(processesIds);
      provisionalMeasuresCount = <h2>{this.getCount(provisionalMeasuresIds)}</h2>;
      documentsCount = this.getCount(documentsIds);
    }

    return (
      <div className="hero">
        <h1>{title}</h1>
        <div className="hero-stats">
          <I18NLink to={this.conformLibraryLink(processesIds, links.length && links[0] ? links[0] : null)}>
            <h2>{processesCount}</h2>
            <span>{buttons[0]}</span>
          </I18NLink>
          <I18NLink to={this.conformLibraryLink(provisionalMeasuresIds, links.length && links[1] ? links[1] : null)}>
            <h2>{provisionalMeasuresCount}</h2>
            <span>{buttons[1]}</span>
          </I18NLink>
          <I18NLink to={this.conformLibraryLink(documentsIds, links.length && links[2] ? links[2] : null)}>
            <h2>{documentsCount}</h2>
            <span>{buttons[2]}</span>
          </I18NLink>
        </div>
      </div>
    );
  }
}

cejilChart001.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  buttons: PropTypes.array,
  links: PropTypes.array
};

export function mapStateToProps({templates, thesauris}) {
  return {templates, thesauris};
}

export default connect(mapStateToProps)(cejilChart001);
