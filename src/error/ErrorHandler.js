module.exports = (err, req, res, next) => {
  console.log(err);

  const { status, message, errors } = err;
  let validationErrors;
  if (errors) {
    validationErrors = {};

    errors.forEach((error) => (validationErrors[error.param] = error.msg));
  }
  res.status(status).send({ message, validationErrors });
};
