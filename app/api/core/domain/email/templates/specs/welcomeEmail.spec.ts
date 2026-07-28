import { welcomeEmail } from '../welcomeEmail.js';

describe('welcomeEmail', () => {
  it('should build an EmailMessage addressed to the given recipient', () => {
    const message = welcomeEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.to).toBe('someone@test.com');
  });

  it('should set the subject to Welcome to {siteName}', () => {
    const message = welcomeEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
      siteName: 'MyOrg',
    });

    expect(message.subject).toBe('Welcome to MyOrg');
  });

  it('should default siteName to Uwazi', () => {
    const message = welcomeEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.subject).toBe('Welcome to Uwazi');
  });

  it('should include the username, the setpassword link with createAccount=true, and the 24-hour notice in the text', () => {
    const message = welcomeEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.text).toContain('someone');
    expect(message.text).toContain('https://uwazi.test/setpassword/abc123?createAccount=true');
    expect(message.text).toContain('24 hours');
  });

  it('should set html', () => {
    const message = welcomeEmail({
      to: 'someone@test.com',
      username: 'someone',
      domain: 'https://uwazi.test',
      key: 'abc123',
    });

    expect(message.html).toBeDefined();
    expect(message.html).toContain('<b>someone</b>');
    expect(message.html).toContain(
      '<a href="https://uwazi.test/setpassword/abc123?createAccount=true">'
    );
  });
});