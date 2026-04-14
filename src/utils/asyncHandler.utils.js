const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => {
        return fn(req, res, next);
      })
      .catch((err) => {
        return next(err);
      });
  };
};
export default asyncHandler;
