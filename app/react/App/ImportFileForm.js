import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class ImportFileForm extends Component {
  constructor(props) {
    super(props);
    this.fileFormRef = React.createRef();
    this.fileInputRef = this.props.fileInputRef;
    this.import = this.import.bind(this);
  }

  import(e) {
    const file = e.target.files[0];
    this.fileFormRef.current.reset();
    if (file) {
      this.props.onFileImported(this.props.context, file);
    }
  }

  render() {
    return (
      <form ref={this.fileFormRef} style={{ display: 'none' }}>
        <input
          ref={this.fileInputRef}
          type="file"
          accept="text/csv"
          style={{ display: 'none' }}
          onChange={this.import}
        />
      </form>
    );
  }
}

ImportFileForm.propTypes = {
  context: PropTypes.string.isRequired,
  onFileImported: PropTypes.func.isRequired,
  fileInputRef: PropTypes.any.isRequired,
};

function mapStateToProps() {
  return {};
}

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(ImportFileForm);
