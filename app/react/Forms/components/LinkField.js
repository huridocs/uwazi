import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class LinkField extends Component {
  constructor(props) {
    super(props);
    this.urlChange = this.urlChange.bind(this);
    this.labelChange = this.labelChange.bind(this);
    this.mapClick = this.mapClick.bind(this);
  }

  onChange(value) {
    this.props.onChange(value);
  }

  urlChange(e) {
    const label = e.target.value;
    this.onChange({ label, url: this.props.value.url });
  }

  labelChange(e) {
    const url = e.target.value;
    this.onChange({ label: this.props.value.label, url });
  }

  mapClick(event) {
    this.onChange({ label: event.lngLat[1], url: event.lngLat[0] });
  }

  render() {
    const { label, url } = this.props.value;

    return (
      <div className="link form-inline">
        <div className="form-row">
          <div className="form-group">
            <label>Label&nbsp;</label>
            <input onChange={this.urlChange} className="form-control" id="label" value={label} step="any"/>
          </div>
          <div className="form-group">
            <label>URL&nbsp;</label>
            <input onChange={this.labelChange} className="form-control" id="url" value={url} step="any"/>
          </div>
        </div>
      </div>
    );
  }
}

LinkField.defaultProps = {
  value: { label: '', url: '' }
};

LinkField.propTypes = {
  value: PropTypes.instanceOf(Object),
  onChange: PropTypes.func.isRequired
};
