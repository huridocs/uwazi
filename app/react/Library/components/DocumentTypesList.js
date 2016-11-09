import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {MultiSelect} from 'app/Forms';
import ShowIf from 'app/App/ShowIf';
import {t} from 'app/I18N';

export class DocumentTypesList extends Component {

  constructor(props) {
    super(props);
    this.state = {
      items: this.props.settings.collection.toJS().filters || [],
      selectedItems: []
    };
  }

  checked(item) {
    return this.state.selectedItems.includes(item.id);
  }

  changeAll(item, e) {
    let selectedItems = this.state.selectedItems;
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
    this.props.onChange(selectedItems);
  }

  change(item) {
    let selectedItems = this.state.selectedItems;

    if (selectedItems.includes(item.id)) {
      let index = selectedItems.indexOf(item.id);
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(item.id);
    }

    this.setState({selectedItems});
    this.props.onChange(selectedItems);
  }

  toggleOptions(key, e) {
    e.preventDefault();
    let state = {};
    state[key] = !this.state[key];
    this.setState(state);
  }

  aggregations(item) {
    let aggregations = this.props.aggregations.toJS();
    let found = aggregations.types.buckets.find((agg) => agg.key === item.id);
    if (found) {
      return found.filtered.doc_count;
    }
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
          <span>
            {item.name}&nbsp;
          </span>
          <span className="multiselectItem-results">
            {this.aggregations(item)}
          </span>
      </label>
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
                />
                <label htmlFor={item.id} className="multiselectItem-label">
                  <i className="multiselectItem-icon fa fa-square-o"></i>
                  <i className="multiselectItem-icon fa fa-check"></i>
                  <span>&nbsp;{item.name}</span>
                </label>
                <button className="btn btn-xs btn-default multiselectItem-action" onClick={this.toggleOptions.bind(this, item.id)}>
                  <i className={this.state[item.id] ? 'fa fa-caret-up' : 'fa fa-caret-down'}></i>
                </button>
              </div>
            <ShowIf if={this.state[item.id]}>
              <ul className="multiselect is-active">
              {item.items.map((_item, i) => {
                return this.renderSingleType(_item, i);
              })}
              </ul>
            </ShowIf>
          </li>;
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
  settings: PropTypes.object,
  onChange: PropTypes.func,
  aggregations: PropTypes.object
};


export function mapStateToProps(state) {
  return {
    settings: state.settings,
    aggregations: state.library.aggregations
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentTypesList);
