// Bad input (schema validation, malformed ids/numbers) is the
// client's fault -> 400. Anything else is a server error -> 500.
const sendError = (res, err) => {
  const isClientError =
    err.name === "ValidationError" || err.name === "CastError";
  res.status(isClientError ? 400 : 500).json({ message: err.message });
};

module.exports = sendError;
