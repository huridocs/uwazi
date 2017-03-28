export default function (req, res, next) {
  res.error = function (error) {
    let result = error;
    if (error instanceof Error) {
      result = error.stack.split('\n');
    }

    if (error.code) {
      result = error.message;
    }

    let code = error.code || 500;

    if (error.name === 'MongoError') {
      code = 500;
    }

    res.status(code);
    res.json({error: result});
  };
  next();
}
