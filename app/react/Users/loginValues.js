const fromFormData = data => ({
  username: data.get('username') || undefined,
  password: data.get('password') || undefined,
  token: data.get('token') || undefined,
});

const formFrom = event =>
  event?.currentTarget?.elements ? event.currentTarget : event?.target?.closest?.('form');

const loginValues = (values, event) => {
  if (typeof FormData !== 'undefined' && values instanceof FormData) {
    return fromFormData(values);
  }
  if (
    values &&
    typeof values === 'object' &&
    !('preventDefault' in values) &&
    (values.username || values.password || values.token)
  ) {
    return values;
  }
  const form = formFrom(event) || formFrom(values);
  return form ? fromFormData(new FormData(form)) : values;
};

export { loginValues };
