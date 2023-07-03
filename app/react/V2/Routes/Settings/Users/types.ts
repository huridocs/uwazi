type FormIntent =
  | 'new-user'
  | 'edit-user'
  | 'delete-users'
  | 'new-group'
  | 'edit-group'
  | 'delete-groups'
  | 'unlock-user'
  | 'reset-password'
  | 'reset-2fa'
  | 'bulk-reset-2fa'
  | 'bulk-reset-password';

export type { FormIntent };
