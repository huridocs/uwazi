import React, {Component, PropTypes} from 'react';

export class ShowDocument extends Component {
  render() {
    const {doc} = this.props;
    return (
      <div className="side-panel-content">
        <div className="view">
          <dl>
            <dt>Document title</dt>
            <dd>{doc.title}</dd>
          </dl>
          <dl>
            <dt>Document type</dt>
            <dd>{doc.documentType}</dd>
          </dl>

          {doc.metadata.map((property, index) => {
            return (
              <dl key={index}>
                <dt>{property.label}</dt>
                <dd>{property.value}</dd>
              </dl>
              );
          })}
        </div>
      </div>
    );
  }
}

ShowDocument.propTypes = {
  doc: PropTypes.object,
  template: PropTypes.object
};

export default ShowDocument;
