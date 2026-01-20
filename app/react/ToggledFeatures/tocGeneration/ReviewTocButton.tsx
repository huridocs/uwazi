import React from 'react';
import Icon from '#UI/Icon/Icon.jsx';
import { FeatureToggle } from '#app/components/Elements/FeatureToggle.jsx';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { ClientFile } from '#app/istore.js';
import { tocGenerationActions } from '#app/ToggledFeatures/tocGeneration/actions.js';

interface ReviewTocButtonProps {
  file: ClientFile;
  children: JSX.Element | string;
}

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ onClick: tocGenerationActions.reviewToc }, dispatch);

const connector = connect(null, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = ReviewTocButtonProps & MappedProps;

const ReviewTocButton = ({ file, onClick, children }: ComponentProps) => (
  <FeatureToggle feature="tocGeneration">
    comment to see the full error message
    {file.generatedToc && (
      <button type="button" onClick={() => onClick(file._id)} className="edit-toc btn btn-success">
        <Icon icon="tasks" />
        <span className="btn-label">{children}</span>
      </button>
    )}
  </FeatureToggle>
);

const container = connector(ReviewTocButton);
export { container as ReviewTocButton };
export type { ReviewTocButtonProps };
