import Schema from "../../src";
import { describe, it, expect } from "vitest";

const promisify = (fn) => {
  return () =>
    new Promise((resolve) => {
      fn(resolve);
    });
};

describe("pattern", () => {
  it(
    "works for non-required empty string",
    promisify((done) => {
      new Schema({
        v: {
          pattern: /^\d+$/,
          message: "haha",
        },
      }).validate(
        {
          // useful for web, input's value defaults to ''
          v: "",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "work for non-required empty string with string regexp",
    promisify((done) => {
      new Schema({
        v: {
          pattern: "^\\d+$",
          message: "haha",
        },
      }).validate(
        {
          // useful for web, input's value defaults to ''
          v: "s",
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
    "works for required empty string",
    promisify((done) => {
      new Schema({
        v: {
          pattern: /^\d+$/,
          message: "haha",
          required: true,
        },
      }).validate(
        {
          // useful for web, input's value defaults to ''
          v: "",
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
    "works for non-required null",
    promisify((done) => {
      new Schema({
        v: {
          pattern: /^\d+$/,
          message: "haha",
        },
      }).validate(
        {
          v: null,
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works for non-required undefined",
    promisify((done) => {
      new Schema({
        v: {
          pattern: /^\d+$/,
          message: "haha",
        },
      }).validate(
        {
          v: undefined,
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works",
    promisify((done) => {
      new Schema({
        v: {
          pattern: /^\d+$/,
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

  it(
    "works for RegExp with global flag",
    promisify((done) => {
      const schema = new Schema({
        v: {
          pattern: /global/g,
          message: "haha",
        },
      });

      schema.validate(
        {
          v: "globalflag",
        },
        (errors) => {
          expect(errors).toBe(null);
        },
      );

      schema.validate(
        {
          v: "globalflag",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );
});
