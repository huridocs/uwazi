import React, { Component } from 'react'
import './scss/document_metadata.scss'

class DocumentMetadata extends Component {

  getField = (key) => {
    return this.props.template.value.fields.find((field) => {
      return field.name == key;
    })
  };

  render() {

    let metadata = this.props.metadata || {};
    let fields = this.props.template.value.fields;

    return (
      <div className="document-metadata">
        <h1>003/12 Peter Joseph Chacha v The United Republic ofTanzania</h1>
        <h2 className="toc">Table of contents</h2>
        <ul>
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
        <h2 className="metadata">Document properties (metadata)</h2>
        <table>
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
