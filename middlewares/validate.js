const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) return next();
    const options = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
      convert: true,
    };
    const { value, error } = schema.validate(req[property], options);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map((d) => d.message),
      });
    }
    req[property] = value;
    next();
  };
};

module.exports = { validate };


