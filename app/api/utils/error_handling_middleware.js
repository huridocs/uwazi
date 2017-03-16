export default function (req, res, next) {
  res.error = function (error) {
    let result = error;
    if (error instanceof Error) {
      result = error.stack.split('\n');
    }

    if (error.code) {
      result = error.message;
    }

    res.status(error.code || 500);
    res.json({error: result});
  };
  next();
}
