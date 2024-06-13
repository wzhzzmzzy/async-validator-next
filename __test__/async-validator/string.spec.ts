import Schema from "../../src";
import { describe, it, expect } from "vitest";

const promisify = (fn) => {
  return () =>
    new Promise((resolve) => {
      fn(resolve);
    });
};

describe("string", () => {
  it(
    "works for none require",
    promisify((done) => {
      let data = {
        v: "",
      };
      new Schema({
        v: {
          type: "string",
        },
      }).validate(data, (errors, d) => {
        expect(errors).toBe(null);
        expect(d).toEqual(data);
        done();
      });
    }),
  );

  it(
    "works for empty string",
    promisify((done) => {
      new Schema({
        v: {
          required: true,
          type: "string",
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
    "works for undefined string",
    promisify((done) => {
      new Schema({
        v: {
          required: true,
          type: "string",
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
    "works for null string",
    promisify((done) => {
      new Schema({
        v: {
          required: true,
          type: "string",
        },
      }).validate(
        {
          v: null,
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
    "works for message",
    promisify((done) => {
      new Schema({
        v: {
          required: true,
          type: "string",
          message: "haha",
        },
      }).validate(
        {
          v: null,
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("haha");
          done();
        },
      );
    }),
  );

  it(
    "works for none empty",
    promisify((done) => {
      new Schema({
        v: {
          required: true,
          type: "string",
          message: "haha",
        },
      }).validate(
        {
          v: " ",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works for whitespace empty",
    promisify((done) => {
      new Schema({
        v: {
          required: true,
          type: "string",
          whitespace: true,
          message: "haha",
        },
      }).validate(
        {
          v: " ",
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("haha");
          done();
        },
      );
    }),
  );
});
