import React, { Component } from 'react';
import { Link, withRouter } from 'react-router';
import { CurrentLocationLink } from 'app/Layout';
import { EntitySchema } from 'shared/types/entityType';

type Props = {
  filename: string;
  entity: EntitySchema;
  router: {
    location: {
      pathname: string;
    };
  };
};

type State = {};

export class ViewDocumentLinkBase extends Component<Props, State> {
  render() {
    const { filename, router, children, entity } = this.props;
    const onViewer = router.location.pathname.match(/entity/);
    return onViewer ? (
      <CurrentLocationLink
        className="btn btn-default"
        location={router.location}
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

//@ts-ignore
export const ViewDocumentLink = withRouter(ViewDocumentLinkBase);
