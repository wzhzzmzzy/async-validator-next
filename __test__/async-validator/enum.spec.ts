import Schema from "../../src";
import { describe, it, expect } from "vitest";

const promisify = (fn) => {
  return () =>
    new Promise((resolve) => {
      fn(resolve);
    });
};

describe("enum", () => {
  it("run validation on `false`", promisify((done) => {
    new Schema({
      v: {
        type: "enum",
        enum: [true],
      },
    }).validate(
      {
        v: false,
      },
      (errors) => {
        expect(errors.length).toBe(1);
        expect(errors[0].message).toBe("v must be one of true");
        done();
      },
    );
  }));
});
