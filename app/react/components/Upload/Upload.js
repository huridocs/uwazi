import React, { Component, PropTypes } from 'react'
import superagent from 'superagent';
import api from '../../utils/api'
import {APIURL} from '../../config.js'
import './scss/upload.scss';
import { Link } from 'react-router'

class Upload extends Component {

  constructor (props) {
    super(props);
    this.state = {
      progress: 0
    }
  }

  upload = () => {
    this.setState({progress:0});

    if(this.input.files.length == 0) {
      return;
    }

    let file = this.input.files[0];
    this.createDocument(file)
    .then((response) => {
      this.uploadFile(file, response.json);
    });
  }

  createDocument = (file) => {
    return api.post('documents', {title: this.extractTitle(file)});
  }

  uploadFile = (file, doc) => {
    let uploadRequest = superagent.post(APIURL + 'upload')
    .field('document', doc.id)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      this.setState({progress:data.percent})
    })

    uploadRequest.end((err, res) => {

    })
    return uploadRequest;
  }

  extractTitle(file) {
    let title = file.name
      .replace(/\.[^/.]+$/, "") //remove file extension
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/  /g, ' ');

    return title.charAt(0).toUpperCase() + title.slice(1);
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

    let show = {};
    if(this.state.progress > 0){
      show = {
        display: 'inherit'
      }
    }

    return (
      <ul className="nav navbar-nav navbar-upload">
        <li>
          <button className="btn btn-primary" onClick={this.triggerUpload}>Upload</button>
          <input style={hide} onChange={this.upload} type='file' ref={(ref) => this.input = ref}/>
        </li>
        <li>
          <Link to='/library'>
            <div className="navbar-upload-bar" style={show}>
              <div className="navbar-upload-bar-progress" style={progressWidth}></div>
            </div>
          </Link>
        </li>
      </ul>
    )
  }

}

export default Upload;
