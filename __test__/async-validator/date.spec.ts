import Schema from "../../src";
import { describe, it, expect } from "vitest";

const promisify = (fn) => {
  return () =>
    new Promise((resolve) => {
      fn(resolve);
    });
};

describe("date", () => {
  it(
    "required works for undefined",
    promisify((done) => {
      new Schema({
        v: {
          type: "date",
          required: true,
        },
      }).validate(
        {
          v: undefined,
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("v is required");
          done();
        },
      );
    }),
  );

  it(
    'required works for ""',
    promisify((done) => {
      new Schema({
        v: {
          type: "date",
          required: true,
        },
      }).validate(
        {
          v: "",
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("v is required");
          done();
        },
      );
    }),
  );

  it(
    "required works for non-date type",
    promisify((done) => {
      new Schema({
        v: {
          type: "date",
          required: true,
        },
      }).validate(
        {
          v: {},
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("v is not a date");
          done();
        },
      );
    }),
  );

  it(
    'required works for "timestamp"',
    promisify((done) => {
      new Schema({
        v: {
          type: "date",
          required: true,
        },
      }).validate(
        {
          v: 1530374400000,
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );
});
