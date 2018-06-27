import errorLog from 'shared/errorLog';

export default function (err, req, res, next) {
  let result = err;
  if (err instanceof Error) {
    result = err.stack.split('\n');
  }

  if (err.code) {
    result = err.message;
  }

  errorLog.error(result);
  console.log('da error', result);

  next(err);
}
