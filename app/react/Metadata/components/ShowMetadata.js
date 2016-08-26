import React, {Component, PropTypes} from 'react';

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
          <dl>
            <dt>Descriptores</dt>
            <dd>
              <ul>
                <li><a href="#">Condiciones de detención</a></li>
                <li><a href="#">Amenazas y hostigamientos</a></li>
                <li><a href="#">Defensores/as de derechos humanos</a></li>
              </ul>
            </dd>
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
    );
  }
}

ShowMetadata.propTypes = {
  entity: PropTypes.object
};

export default ShowMetadata;
