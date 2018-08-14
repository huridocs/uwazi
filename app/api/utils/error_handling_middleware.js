import errorLog from 'api/log/errorLog';

export default function (req, res, next) {
  res.error = (error) => {

    let result = error;
    if (error instanceof Error) {
      result = error.stack.split('\n');
    }

    if (error.code) {
      result = error.message;
    }

    let code = error.code || 500;

    if (!(error.code > 0) || error.name === 'MongoError') {
      code = 500;
    }

    res.status(code);
    res.json({ error: result });

    if (error.code === 500) {
      errorLog.error(result);
    }
  };
  next();
}
