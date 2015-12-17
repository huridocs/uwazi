import React, { Component, PropTypes } from 'react'
import request from 'superagent';
import '../scss/upload.scss';

class Upload extends Component {

  constructor (props) {
    super(props);
    this.state = {
      progress: 0
    }
  }

  upload = () => {
    let file = this.input.files[0];
    request.post('http://localhost:3000/api/upload')
    .set("Content-Type", "application/octet-stream")
    .send(file)
    .on('progress', (data) => {
      this.setState({progress:data.percent})
    })
    .end((err, res) => {
        console.log(err);
        console.log(res);
    })
  }

  triggerUpload = (e) => {
    e.preventDefault();
    this.input.click();
  }

  render = () => {

    let progressWidth = {
      width: this.state.progress+'%'
    };

    let hide = {
      top:'-10000px',
      position:'absolute'
    };

    return (
      <ul className="nav navbar-nav">
        <li>
          <button className="btn btn-primary" onClick={this.triggerUpload}>Upload</button>
          <input style={hide} onChange={this.upload} type='file' ref={(ref) => this.input = ref}/>
        </li>
        <li>
          <div className="upload-bar">
            <div className="progress-bar" style={progressWidth}></div>
          </div>
        </li>
      </ul>
    )
  }

}

export default Upload;
