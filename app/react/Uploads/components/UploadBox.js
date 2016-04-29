import React, {Component} from 'react';
import Dropzone from 'react-dropzone';
import 'app/Uploads/scss/upload_box.scss';

export default class UploadBox extends Component {
  onDrop(files) {
    console.log(files);
  }

  render() {
    return (
      <Dropzone style={{}} onDrop={this.onDrop}>
        <div className="upload-box">
          <i className="fa fa-upload"></i>
          <a>Upload your document</a>
        </div>
      </Dropzone>
    );
  }
}
