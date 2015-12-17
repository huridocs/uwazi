import React, { Component, PropTypes } from 'react'
import request from 'superagent';
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
