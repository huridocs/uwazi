import { passwordRecoveryEmail } from '../passwordRecoveryEmail.js';

describe('passwordRecoveryEmail', () => {
  it('should build an EmailMessage addressed to the given recipient', () => {
    const message = passwordRecoveryEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.to).toBe('someone@test.com');
  });

  it('should set the subject to Password recovery', () => {
    const message = passwordRecoveryEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.subject).toBe('Password recovery');
  });

  it('should include the username, the setpassword link, and the 24-hour notice in the text', () => {
    const message = passwordRecoveryEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.text).toContain('someone');
    expect(message.text).toContain('https://uwazi.test/setpassword/abc123');
    expect(message.text).toContain('24 hours');
  });

  it('should not set html', () => {
    const message = passwordRecoveryEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.html).toBeUndefined();
  });
});
