const validateSearchParams = (req, res, next) => {
  const { from, size } = req.query;

  if (from && (isNaN(from) || parseInt(from) < 0)) {
    return res.status(400).json({ error: 'Invalid "from" parameter' });
  }

  if (size && (isNaN(size) || parseInt(size) < 1 || parseInt(size) > 100)) {
    return res.status(400).json({ error: 'Invalid "size" parameter (1-100)' });
  }

  next();
};

export { validateSearchParams };
