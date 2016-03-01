import React, { Component } from 'react'
import './scss/document_metadata.scss'

class DocumentMetadata extends Component {

  constructor (props) {
    super(props);
    this.state = {showToc: true, showMetadata: true};
  }

  getField = (key) => {
    return this.props.template.value.fields.find((field) => {
      return field.name == key;
    })
  };

  toggleToc = () => {
    this.setState({showToc: !this.state.showToc});
  };

  toggleMetdata = () => {
    this.setState({showMetadata: !this.state.showMetadata});
  };

  render() {

    let metadata = this.props.metadata || {};
    let fields = this.props.template.value.fields;
    let tocCalss = 'foldable ';
    let metadataCalss = 'foldable ';

    if(!this.state.showToc){
      tocCalss += 'folded';
    }

    if(!this.state.showMetadata){
      metadataCalss += 'folded';
    }

    return (
      <div className="document-metadata">
        <h1>003/12 Peter Joseph Chacha v The United Republic ofTanzania</h1>
        <h2 onClick={this.toggleToc} className={'toc ' + (this.state.showToc ? '' : 'folded')}>Table of contents</h2>
        <ul className={'foldable ' + (this.state.showToc ? '' : 'folded')}>
          <li>
            <a href="#">Summary of alledged facts</a>
            <ul>
              <li><a href="#">Complaints submission of admisibility</a></li>
              <li><a href="#">The african comitee analisys</a></li>
            </ul>
          </li>
          <li><a href="#">Decission on admissibility</a></li>
          <li><a href="#">The complaint</a></li>
        </ul>
        <h2 onClick={this.toggleMetdata} className={'metadata ' + (this.state.showMetadata ? '' : 'folded')}>Document properties (metadata)</h2>
        <table className={'foldable ' + (this.state.showMetadata ? '' : 'folded')}>
          <tbody>
            {Object.keys(metadata).map((key) => {
              return (<tr key={key}>
                        <td>{this.getField(key).label}</td>
                        <td>{this.props.metadata[key]}</td>
                      </tr>)
            })}
          </tbody>
        </table>
      </div>

    )
  }
}

export default DocumentMetadata;
