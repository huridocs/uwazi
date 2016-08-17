import React, {Component, PropTypes} from 'react';

export class ShowMetadata extends Component {
  render() {
    const {entity} = this.props;
    return (
      <div>
        <div className="view">
          <dl>
            <dt>Title</dt>
            <dd>{entity.title}</dd>
          </dl>
          <dl>
            <dt>Type</dt>
            <dd>{entity.documentType}</dd>
          </dl>

          {entity.metadata.map((property, index) => {
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

ShowMetadata.propTypes = {
  entity: PropTypes.object
};

export default ShowMetadata;
