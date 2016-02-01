import React, { Component } from 'react'
import api from '../../utils/singleton_api'

class Viewer extends Component {

  constructor(props, context){
    super(props, context);
    this.state = {value:{pages:[], css:[]}};
  };

  requestDocument = () => {
    return api.get('documents?_id='+this.props.documentId)
    .then((response) => {
      this.setState(response.json.rows[0]);
    });
  };

  render = () => {
    let pageStyles = {height:'1120px', width: '792px'}
    return (
      <div>
        <div>
          {this.state.value.pages.map((page, index) => {
            let html = {__html: page}
            let id = 'pf'+index;
            return <div id={id} key={index} dangerouslySetInnerHTML={html} ></div>
          })}
        </div>
          {this.state.value.css.map((css, index) => {
            let html = {__html: css}
            return <style type="text/css" key={index} dangerouslySetInnerHTML={html}></style>
          })}
      </div>
    )
  };

}

export default Viewer;
