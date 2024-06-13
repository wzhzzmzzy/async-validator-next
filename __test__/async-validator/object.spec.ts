import Schema from "../../src";
import { describe, it, expect } from "vitest";

const promisify = (fn) => {
  return () =>
    new Promise((resolve) => {
      fn(resolve);
    });
};

describe("object", () => {
  it(
    "works for the required object with fields in case of empty string",
    promisify((done) => {
      new Schema({
        v: {
          type: "object",
          required: true,
          fields: {},
        },
      }).validate(
        {
          v: "",
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("v is not an object");
          done();
        },
      );
    }),
  );
});
