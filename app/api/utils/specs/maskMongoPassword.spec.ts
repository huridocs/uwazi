import { maskMongoPassword } from '../maskMongoPassword';

describe('maskMongoPassword', () => {
  it('masks a normal mongodb URI with user and password', () => {
    const uri = 'mongodb://admin:PLAIN_PASSWORD@10.0.10.50';
    expect(maskMongoPassword(uri)).toBe('mongodb://admin:###@10.0.10.50');
  });

  it('works with multiple hosts and query params', () => {
    const uri =
      'mongodb://admin:PLAIN_PASSWORD@10.0.10.50,10.0.10.51,10.0.10.52/?replicaSet=uwazi0';
    expect(maskMongoPassword(uri)).toBe(
      'mongodb://admin:###@10.0.10.50,10.0.10.51,10.0.10.52/?replicaSet=uwazi0'
    );
  });

  it('leaves URI unchanged if no userinfo is provided', () => {
    const uri = 'mongodb://10.0.10.50';
    expect(maskMongoPassword(uri)).toBe(uri);
  });

  it('leaves URI unchanged if only username is provided (no password)', () => {
    const uri = 'mongodb://admin@localhost:27017';
    expect(maskMongoPassword(uri)).toBe(uri);
  });

  it('masks even if password starts with ":" and contains "@", ending with "@"', () => {
    const uri = 'mongodb://admin::pa$$w0rd@@localhost:27017';
    expect(maskMongoPassword(uri)).toBe('mongodb://admin:###@localhost:27017');
  });

  it('handles mongodb+srv scheme', () => {
    const uri = 'mongodb+srv://user:pw@cluster0.mongodb.net/mydb?retryWrites=true';
    expect(maskMongoPassword(uri)).toBe(
      'mongodb+srv://user:###@cluster0.mongodb.net/mydb?retryWrites=true'
    );
  });

  it('does nothing if input is empty', () => {
    expect(maskMongoPassword('')).toBe('');
  });
});
