import React from 'react';
import { connect } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { omit } from 'lodash';

const defaultProps = {
  disabled: false,
  onClick: (_e: any) => {},
  confirmTitle: '',
  confirmMessage: '',
};

export type I18NLinkProps = typeof defaultProps & {
  to: string;
  disabled: boolean;
  onClick: (_e: any) => void;
  confirmTitle: string;
  confirmMessage: string;
};

const I18NLink = (props: I18NLinkProps) => {
  const { to, disabled } = props;
  const navigate = useNavigate();
  // static contextTypes = {
  //   confirm: PropTypes.func,
  // };

  const onClickHandler = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (disabled) {
      return;
    }

    // if (onClick) {
    //   if (confirmTitle) {
    //     this.context.confirm({
    //       accept: () => {
    //         onClick(e);
    //         I18NLink.navigate(to);
    //       },
    //       title: confirmTitle,
    //       message: confirmMessage,
    //     });
    //   } else {
    // onClick(e);
    navigate(to);
    //   }
    // }
  };

  const newProps = omit(props, ['dispatch', 'onClick', 'confirmTitle', 'confirmMessage']);
  return <Link onClick={onClickHandler} {...newProps} />;
};

export function mapStateToProps({ locale }: { locale?: string }, ownProps: any) {
  return { to: `/${locale || ''}/${ownProps.to}`.replace(/\/+/g, '/') };
}

export default connect(mapStateToProps)(I18NLink);
