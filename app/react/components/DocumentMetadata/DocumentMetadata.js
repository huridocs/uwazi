import React, { Component } from 'react'
import './scss/document_metadata.scss'

class DocumentMetadata extends Component {

  render() {
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
            <tr>
              <td>Country</td>
              <td>Kenya</td>
            </tr>
            <tr>
              <td>Date</td>
              <td>09/10/2015</td>
            </tr>
            <tr>
              <td>Language</td>
              <td>EN - ES</td>
            </tr>
            <tr>
              <td>Type</td>
              <td>Decission</td>
            </tr>
            <tr>
              <td>Mechanism</td>
              <td>African Comittee of Experts on the Rights and Welfare of the Child</td>
            </tr>
          </tbody>
        </table>
      </div>

    )
  }
}

export default DocumentMetadata;
