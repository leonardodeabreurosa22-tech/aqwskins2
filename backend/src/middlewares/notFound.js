/**
 * 404 Not Found Middleware
 * Handles routes that don't exist
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      code: 'NOT_FOUND',
      statusCode: 404
    }
  });
};
