// Copy only allow-listed keys from a request body, so clients
// can't overwrite protected fields like userId or paidMonths.
const pickFields = (body, fields) => {
  const picked = {};
  fields.forEach((field) => {
    if (body && body[field] !== undefined) picked[field] = body[field];
  });
  return picked;
};

module.exports = pickFields;
