const pickFields = require("../utils/pickFields");
const sendError = require("../utils/sendError");

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe("pickFields", () => {
  test("keeps only allow-listed, defined keys", () => {
    expect(
      pickFields({ a: 1, b: undefined, c: 0, userId: "x" }, ["a", "b", "c"]),
    ).toEqual({ a: 1, c: 0 });
  });

  test("tolerates a missing body", () => {
    expect(pickFields(undefined, ["a"])).toEqual({});
  });
});

describe("sendError", () => {
  test.each([
    ["ValidationError", 400],
    ["CastError", 400],
    ["MongoServerError", 500],
    ["Error", 500],
  ])("%s -> %i", (name, status) => {
    const res = mockRes();
    const err = Object.assign(new Error("boom"), { name });
    sendError(res, err);
    expect(res.status).toHaveBeenCalledWith(status);
    expect(res.json).toHaveBeenCalledWith({ message: "boom" });
  });
});
