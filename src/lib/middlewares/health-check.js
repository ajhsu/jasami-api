export default (req, res, next) => {
  res.status(200).json({
    status: 'good'
  });
};
