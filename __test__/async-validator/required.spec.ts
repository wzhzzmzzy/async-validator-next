import Schema from "../../src";
import { describe, it, expect } from "vitest";

const promisify = (fn) => {
  return () =>
    new Promise((resolve) => {
      fn(resolve);
    });
};

const required = true;

describe("required", () => {
  it(
    "works for array required=true",
    promisify((done) => {
      new Schema({
        v: [
          {
            required,
            message: "no",
          },
        ],
      }).validate(
        {
          v: [],
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("no");
          done();
        },
      );
    }),
  );

  it(
    "works for array required=true & custom message",
    promisify((done) => {
      // allow custom message
      new Schema({
        v: [
          {
            required,
            message: "no",
          },
        ],
      }).validate(
        {
          v: [1],
        },
        (errors) => {
          expect(errors).toBeFalsy();
          done();
        },
      );
    }),
  );

  it(
    "works for array required=false",
    promisify((done) => {
      new Schema({
        v: {
          required: false,
        },
      }).validate(
        {
          v: [],
        },
        (errors) => {
          expect(errors).toBeFalsy();
          done();
        },
      );
    }),
  );

  it(
    "works for string required=true",
    promisify((done) => {
      new Schema({
        v: {
          required,
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
    "works for string required=false",
    promisify((done) => {
      new Schema({
        v: {
          required: false,
        },
      }).validate(
        {
          v: "",
        },
        (errors) => {
          expect(errors).toBeFalsy();
          done();
        },
      );
    }),
  );

  it(
    "works for number required=true",
    promisify((done) => {
      new Schema({
        v: {
          required,
        },
      }).validate(
        {
          v: 1,
        },
        (errors) => {
          expect(errors).toBeFalsy();
          done();
        },
      );
    }),
  );

  it(
    "works for number required=false",
    promisify((done) => {
      new Schema({
        v: {
          required: false,
        },
      }).validate(
        {
          v: 1,
        },
        (errors) => {
          expect(errors).toBeFalsy();
          done();
        },
      );
    }),
  );

  it(
    "works for null required=true",
    promisify((done) => {
      new Schema({
        v: {
          required,
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
    "works for null required=false",
    promisify((done) => {
      new Schema({
        v: {
          required: false,
        },
      }).validate(
        {
          v: null,
        },
        (errors) => {
          expect(errors).toBeFalsy();
          done();
        },
      );
    }),
  );

  it(
    "works for undefined required=true",
    promisify((done) => {
      new Schema({
        v: {
          required,
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
    "works for undefined required=false",
    promisify((done) => {
      new Schema({
        v: {
          required: false,
        },
      }).validate(
        {
          v: undefined,
        },
        (errors) => {
          expect(errors).toBeFalsy();
          done();
        },
      );
    }),
  );

  it(
    "should support empty string message",
    promisify((done) => {
      new Schema({
        v: {
          required,
          message: "",
        },
      }).validate(
        {
          v: "",
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("");
          done();
        },
      );
    }),
  );
});
