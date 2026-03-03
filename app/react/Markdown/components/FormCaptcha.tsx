import React from 'react';
import { FormGroup } from '#app/Forms/index.js';
import { Captcha } from '#app/ReactReduxForms/index.js';
import { Translate } from '#app/I18N/index.js';

type CaptchaComponentProps = { remote: Boolean; refresh: () => {} };

const CaptchaComponent = ({ remote, refresh }: CaptchaComponentProps) => (
  <FormGroup key="captcha" model=".captcha">
    <ul className="search__filter">
      <li>
        <label>
          <Translate>Captcha</Translate>
          <span className="required">*</span>
        </label>
      </li>
      <li className="wide">
        <Captcha remote={remote} refresh={refresh} model=".captcha" />
      </li>
    </ul>
  </FormGroup>
);

export const FormCaptcha = React.memo(CaptchaComponent);
