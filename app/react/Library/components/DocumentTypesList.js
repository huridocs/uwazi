import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import ShowIf from 'app/App/ShowIf';
import {is} from 'immutable';
import {t} from 'app/I18N';

import {filterDocumentTypes} from 'app/Library/actions/filterActions';

export class DocumentTypesList extends Component {

  constructor(props) {
    super(props);
    let items = this.props.settings.collection.toJS().filters || [];
    if (!items.length) {
      items = props.templates.toJS().map((tpl) => {
        return {id: tpl._id, name: tpl.name};
      });
    }
    this.state = {
      items
    };
  }

  checked(item) {
    if (item.items) {
      return item.items.reduce((result, _item) => {
        return result && this.checked(_item);
      }, true);
    }

    return this.props.libraryFilters.toJS().documentTypes.includes(item.id);
  }

  changeAll(item, e) {
    let selectedItems = this.props.libraryFilters.toJS().documentTypes || [];
    if (e.target.checked) {
      item.items.forEach((_item) => {
        if (!this.checked(_item)) {
          selectedItems.push(_item.id);
        }
      });
    }

    if (!e.target.checked) {
      item.items.forEach((_item) => {
        if (this.checked(_item)) {
          let index = selectedItems.indexOf(_item.id);
          selectedItems.splice(index, 1);
        }
      });
    }

    this.setState({selectedItems});
    this.props.filterDocumentTypes(selectedItems);
  }

  change(item) {
    let selectedItems = this.props.libraryFilters.toJS().documentTypes || [];

    if (selectedItems.includes(item.id)) {
      let index = selectedItems.indexOf(item.id);
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item.id);
    }

    this.setState({selectedItems});
    this.props.filterDocumentTypes(selectedItems);
  }

  toggleOptions(item, e) {
    e.preventDefault();
    if (!this.checked(item) && item.items.find((itm) => this.checked(itm))) {
      return;
    }
    let state = {};
    state[item.id] = !this.state[item.id];
    this.setState(state);
  }

  aggregations(item) {
    let aggregations = this.props.aggregations.toJS();
    let buckets = aggregations.types ? aggregations.types.buckets : [];
    let found = buckets.find((agg) => agg.key === item.id);
    if (found) {
      return found.filtered.doc_count;
    }

    if (item.items) {
      return item.items.reduce((result, _item) => {
        return result + this.aggregations(_item);
      }, 0);
    }

    return 0;
  }

  showSubOptions(parent) {
    const toggled = this.state[parent.id];
    return !!(toggled || !!(!this.checked(parent) && parent.items.find((itm) => this.checked(itm))));
  }

  renderSingleType(item, index) {
    return <li className="multiselectItem" key={index} title={item.name}>
      <input
        type='checkbox'
        className="multiselectItem-input"
        value={item.id}
        id={item.id}
        onChange={this.change.bind(this, item)}
        checked={this.checked(item)}
      />
      <label
        className="multiselectItem-label"
        htmlFor={item.id}>
          <i className="multiselectItem-icon fa fa-square-o"></i>
          <i className="multiselectItem-icon fa fa-check"></i>
          <span className="multiselectItem-name">{t(item.id, item.name)}</span>
      </label>
      <span className="multiselectItem-results">
        {this.aggregations(item)}
      </span>
    </li>;
  }

  renderGroupType(item, index) {
    return <li key={index}>
              <div className="multiselectItem">
                <input
                  type='checkbox'
                  className="form-control"
                  id={item.id}
                  className="multiselectItem-input"
                  onChange={this.changeAll.bind(this, item)}
                  checked={this.checked(item)}
                />
                <label htmlFor={item.id} className="multiselectItem-label">
                  <i className="multiselectItem-icon fa fa-square-o"></i>
                  <i className="multiselectItem-icon fa fa-check"></i>
                  <span className="multiselectItem-name">{t('Filters', item.name)}</span>
                </label>
                <span className="multiselectItem-results">
                  <span>{this.aggregations(item)}</span>
                  <span className="multiselectItem-action" onClick={this.toggleOptions.bind(this, item)}>
                    <i className={this.state[item.id] ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
                  </span>
                </span>
              </div>
            <ShowIf if={this.showSubOptions(item)}>
              <ul className="multiselectChild is-active">
              {item.items.map((_item, i) => {
                return this.renderSingleType(_item, i);
              })}
              </ul>
            </ShowIf>
          </li>;
  }

  shouldComponentUpdate(nextProps) {
    return !is(this.props.libraryFilters, nextProps.libraryFilters) ||
           !is(this.props.settings, nextProps.settings) ||
           !is(this.props.aggregations, nextProps.aggregations);
  }

  render() {
    return (
      <ul className="multiselect is-active">
        {this.state.items.map((item, index) => {
          if (item.items) {
            return this.renderGroupType(item, index);
          }
          return this.renderSingleType(item, index);
        })}
      </ul>
    );
  }
}

DocumentTypesList.propTypes = {
  libraryFilters: PropTypes.object,
  settings: PropTypes.object,
  templates: PropTypes.object,
  filterDocumentTypes: PropTypes.func,
  aggregations: PropTypes.object
};


export function mapStateToProps(state) {
  return {
    libraryFilters: state.library.filters,
    settings: state.settings,
    templates: state.templates,
    aggregations: state.library.aggregations
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({filterDocumentTypes}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentTypesList);
