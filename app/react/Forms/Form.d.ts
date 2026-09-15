import { Component, ReactNode } from 'react';

type ReduxFormProps = {
  children?: ReactNode;
} & Record<string, unknown>;

export class Form extends Component<ReduxFormProps> {}
export class LocalForm extends Component<ReduxFormProps> {}
