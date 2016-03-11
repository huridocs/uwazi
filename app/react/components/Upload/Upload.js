import React, { Component, PropTypes } from 'react'
import superagent from 'superagent';
import api from '../../utils/singleton_api'
import {APIURL} from '../../config.js'
import './scss/upload.scss';
import { Link } from 'react-router'
import {events} from '../../utils/index'

class Upload extends Component {

  constructor (props) {
    super(props);
    this.state = {
      progress: 0
    }
  }

  upload = () => {
    this.setState({progress:0});

    if(!this.getInputFile()) {
      return;
    }

    let file = this.getInputFile();
    return this.createDocument(file)
    .then((response) => {
      this.uploadFile(file, response.json);
    });
  };

  getInputFile = () => {
    return this.input.files[0];
  }

  createDocument = (file) => {
    return api.post('documents', {title: this.extractTitle(file)});
  };

  uploadFile = (file, doc) => {
    
    let document_created = {
      id: doc.id,
      rev:doc.rev,
      value: {
        title: this.extractTitle(file),
        _id:doc.id,
        _rev:doc.rev
      }
    };

    events.emit('newDocument', document_created);

    let uploadRequest = superagent.post(APIURL + 'upload')
    .set('Accept', 'application/json')
    .field('document', doc.id)
    .attach('file', file, file.name)
    .on('progress', (data) => {
      events.emit('uploadProgress', doc.id, Math.floor(data.percent));
      this.setState({progress:data.percent})
    })
    .on('response', (res) => {
      this.setState({progress: 0});
      this.input.value = ''; //can't test
      events.emit('uploadEnd', doc.id, res.body);
    })
    .end()
    return uploadRequest;
  };

  extractTitle(file) {
    let title = file.name
      .replace(/\.[^/.]+$/, "") //remove file extension
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/  /g, ' ');

    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  triggerUpload = (e) => {
    e.preventDefault();
    this.input.click();
  };

  render = () => {

    return (
      <div className="upload-component">
      <div className="upload-component_button" onClick={this.triggerUpload}><i className="fa fa-cloud-upload"></i> Upload</div>
      <input className="upload-component_input" onChange={this.upload} type="file" ref={(ref) => this.input = ref} accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"/>
      </div>
    )
  };

}

export default Upload;
