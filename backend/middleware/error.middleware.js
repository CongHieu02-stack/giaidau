// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Supabase error
  if (err.code) {
    return res.status(400).json({
      error: err.message,
      code: err.code
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};

module.exports = {
  errorHandler
};
