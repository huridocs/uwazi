import React, {Component, PropTypes} from 'react';
import {Link} from 'react-router';
import ShowIf from 'app/App/ShowIf';

export class ShowMetadata extends Component {
  render() {
    const {entity} = this.props;
    return (
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
                <dd>
                {(() => {
                  if (property.url) {
                    return <Link to={property.url}>{property.value}</Link>;
                  }
                  return property.value;
                })()}
                </dd>
              </dl>
              );
          })}
        </div>
    );
  }
}

ShowMetadata.propTypes = {
  entity: PropTypes.object
};

export default ShowMetadata;
