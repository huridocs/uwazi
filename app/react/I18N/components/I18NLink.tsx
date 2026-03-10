import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigate, NavLink, useLocation } from 'react-router';
import { omit } from 'lodash';

type I18NLinkProps = {
  to: string;
  disabled: boolean;
  onClick: (_e: any) => void;
  confirmTitle: string;
  confirmMessage: string;
  mainContext: { confirm: Function };
  activeclassname: string;
  replaceNavigationHistory: boolean;
  className: string;
};

const I18NLink = (props: I18NLinkProps) => {
  const {
    to = '/',
    disabled,
    confirmTitle,
    confirmMessage,
    onClick,
    replaceNavigationHistory: replace,
  } = props;

  const navigate = useNavigate();
  const location = useLocation();

  const scrollToHashWithRetry = (hash: string, retries = 10, delay = 100) => {
    if (!hash) return;
    if (retries <= 0) return;
    setTimeout(() => {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        scrollToHashWithRetry(hash, retries - 1, delay);
      }
    }, delay);
  };

  const _navigate = async () => {
    await navigate(to, { replace });
    scrollToHashWithRetry(location.hash);
  };

  const onClickHandler = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (disabled) return;

    if (onClick && confirmTitle) {
      props.mainContext.confirm({
        accept: async () => {
          onClick(e);
          await _navigate();
        },
        title: confirmTitle,
        message: confirmMessage,
      });
      return;
    }

    if (onClick) {
      onClick(e);
      await _navigate();
      return;
    }
    await _navigate();
  };

  useEffect(() => {
    scrollToHashWithRetry(location.hash);
  }, [location]);

  const newProps = omit(props, [
    'dispatch',
    'onClick',
    'confirmTitle',
    'confirmMessage',
    'to',
    'activeclassname',
    'className',
  ]);

  return (
    <NavLink
      to={props.to}
      onClick={onClickHandler}
      className={({ isActive }) =>
        props.activeclassname && isActive
          ? `${props.activeclassname} ${props.className}`
          : props.className
      }
      {...newProps}
    />
  );
};

export function mapStateToProps({ locale }: { locale?: string }, ownProps: any) {
  return { to: `/${locale || ''}/${ownProps.to}`.replace(/\/+/g, '/') };
}

export type { I18NLinkProps };
export { I18NLink };
export default connect(mapStateToProps)(I18NLink);
