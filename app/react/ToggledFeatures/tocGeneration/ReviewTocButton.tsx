import React, { type JSX } from 'react';
import { Icon } from '#UI/Icon/Icon.js';
import { FeatureToggle } from '#app/components/Elements/FeatureToggle.js';
import { connect, ConnectedProps } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ClientFile } from '#app/istore.js';
import { tocGenerationActions } from './actions.js';
import { AppDispatch } from '#app/thunkDispatch.js';

interface ReviewTocButtonProps {
  file: ClientFile;
  children: JSX.Element | string;
}

const mapDispatchToProps = (dispatch: AppDispatch) =>
  bindActionCreators({ onClick: tocGenerationActions.reviewToc }, dispatch);

const connector = connect(null, mapDispatchToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = ReviewTocButtonProps & MappedProps;

const ReviewTocButton = ({ file, onClick, children }: ComponentProps) => (
  <FeatureToggle feature="tocGeneration">
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
