import { MemoryStream } from '../../testing/MemoryStream.js';
import { ErrorPayload } from '../../contracts/ErrorPayload.js';
import { Presenter } from '../Presenter.js';

const streams = () => ({ stdout: new MemoryStream(), stderr: new MemoryStream() });

const conflict: ErrorPayload = {
  error: {
    code: 'user.duplicated_user',
    category: 'conflict',
    message: 'The username "bob" already exists',
  },
};

const invalid: ErrorPayload = {
  error: {
    code: 'validation.failed',
    category: 'validation',
    message: 'Invalid arguments',
    validation: [
      { field: '--email', code: 'invalid_string', message: 'Invalid email' },
      { field: '--role', code: 'invalid_enum_value', message: 'Expected admin | editor' },
    ],
  },
};

describe('Presenter', () => {
  describe('result()', () => {
    it('should print JSON on stdout in json mode', () => {
      const out = streams();

      new Presenter({ json: true, verbose: false, ...out }).result({ users: [{ a: 1 }] });

      expect(JSON.parse(out.stdout.text)).toEqual({ users: [{ a: 1 }] });
      expect(out.stderr.text).toBe('');
    });

    it('should print an array of objects as an aligned table in human mode', () => {
      const out = streams();

      new Presenter({ json: false, verbose: false, ...out }).result([
        { username: 'admin', role: 'admin' },
        { username: 'bob', role: 'collaborator' },
      ]);

      expect(out.stdout.text).toBe(
        ['username  role', 'admin     admin', 'bob       collaborator', ''].join('\n')
      );
    });

    it('should print an object as key: value lines in human mode', () => {
      const out = streams();

      new Presenter({ json: false, verbose: false, ...out }).result({ admin: 1, editor: 0 });

      expect(out.stdout.text).toBe('admin: 1\neditor: 0\n');
    });

    it('should print nothing for an empty list in human mode', () => {
      const out = streams();

      new Presenter({ json: false, verbose: false, ...out }).result([]);

      expect(out.stdout.text).toBe('');
    });
  });

  describe('error()', () => {
    it('should print the JSON payload on stderr in json mode, never stdout', () => {
      const out = streams();

      new Presenter({ json: true, verbose: false, ...out }).error(conflict, new Error('x'));

      expect(JSON.parse(out.stderr.text)).toEqual(conflict);
      expect(out.stdout.text).toBe('');
    });

    it('should print message, code and each validation issue in human mode', () => {
      const out = streams();

      new Presenter({ json: false, verbose: false, ...out }).error(invalid, new Error('x'));

      expect(out.stderr.text).toBe(
        [
          'error: Invalid arguments [validation.failed]',
          '  --email: Invalid email',
          '  --role: Expected admin | editor',
          '',
        ].join('\n')
      );
    });

    it('should add the stack only in verbose mode', () => {
      const quiet = streams();
      const loud = streams();
      const error = new Error('boom');

      new Presenter({ json: false, verbose: false, ...quiet }).error(conflict, error);
      new Presenter({ json: false, verbose: true, ...loud }).error(conflict, error);

      expect(quiet.stderr.text).not.toContain(error.stack);
      expect(loud.stderr.text).toContain(error.stack);
    });
  });
});
