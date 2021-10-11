import React, { Component } from 'react';
import { Link, withRouter, WithRouterProps } from 'react-router';
import { CurrentLocationLink } from 'app/Layout';
import { EntitySchema } from 'shared/types/entityType';

type Props = {
  filename: string;
  entity: EntitySchema;
};

type State = {};

export class ViewDocumentLinkBase extends Component<Props & WithRouterProps, State> {
  render() {
    const { filename, location, children, entity } = this.props;
    const onViewer = location.pathname.match(/entity/);
    return onViewer ? (
      <CurrentLocationLink
        className="btn btn-default"
        location={location}
        queryParams={{ file: filename, page: 1 }}
        type="button"
      >
        {children}
      </CurrentLocationLink>
    ) : (
      <Link
        className="btn btn-default"
        to={`/entity/${entity.sharedId}?file=${filename}`}
        type="button"
      >
        {children}
      </Link>
    );
  }
}

export const ViewDocumentLink = withRouter(ViewDocumentLinkBase);
