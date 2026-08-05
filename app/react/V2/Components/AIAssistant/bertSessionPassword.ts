let sessionPassword: string | null = null;

const getBertSessionPassword = () => sessionPassword;

const setBertSessionPassword = (password: string) => {
  sessionPassword = password;
};

const hasBertSessionPassword = () => Boolean(sessionPassword);

export { getBertSessionPassword, hasBertSessionPassword, setBertSessionPassword };
