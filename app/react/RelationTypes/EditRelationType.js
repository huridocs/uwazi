import React from 'react';

import RouteHandler from 'app/App/RouteHandler';
import { editRelationType } from 'app/RelationTypes/actions/relationTypesActions';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import { withRouter } from 'app/componentWrappers';
import TemplateCreator from '../Templates/components/TemplateCreator';

class EditRelationTypeComponent extends RouteHandler {
  static async requestState(requestParams) {
    const [relationType] = await relationTypesAPI.get(requestParams);
    relationType.properties = relationType.properties || [];

    return [editRelationType(relationType)];
  }

  render() {
    return (
      <div className="settings-content">
        <TemplateCreator relationType />
      </div>
    );
  }
}

export default EditRelationTypeComponent;
const EditRelationType = withRouter(EditRelationTypeComponent);
export { EditRelationType };
