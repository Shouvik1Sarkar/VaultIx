const globalError = (err, req, res, next) => {
  const error = { ...err };
  const statusCode = err.statusCode || err.status || 500;
  try {
    return res.status(statusCode).json({
      statusCode: statusCode,
      message: err.message || "Server Error",
      errors: err.errors || [],
      success: err.success || false,
      data: err.data || null,
    });
  } catch (error) {
    next(error);
  }
};
export default globalError;
