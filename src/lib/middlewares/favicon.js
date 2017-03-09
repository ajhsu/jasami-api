export default (req, res, next) => {
  // short-circuit for favicon.ico
  if (req.originalUrl === '/favicon.ico') {
    res.end('');
  } else {
    next();
  }
};
