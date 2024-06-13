import Schema from "../../src";
import { describe, it, expect } from "vitest";

const promisify = (fn) => {
  return () =>
    new Promise((resolve) => {
      fn(resolve);
    });
};

describe("url", () => {
  it(
    "works for empty string",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
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
    "works for ip url",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "http://10.218.136.29/talent-tree/src/index.html",
        },
        (errors) => {
          expect(errors).toBe(null);
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
          type: "url",
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
    "works for type url",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "http://www.taobao.com",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works for type url has query",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "http://www.taobao.com/abc?a=a",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works for type url has hash",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "http://www.taobao.com/abc#!abc",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works for type url has query and has",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "http://www.taobao.com/abc?abc=%23&b=a~c#abc",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works for type url has multi hyphen",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "https://www.tao---bao.com",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );

  it(
    "works for type not a valid url",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "http://www.taobao.com/abc?abc=%23&b=  a~c#abc    ",
        },
        (errors) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("v is not a valid url");
          done();
        },
      );
    }),
  );

  it(
    "support skip schema",
    promisify((done) => {
      new Schema({
        v: {
          type: "url",
        },
      }).validate(
        {
          v: "//g.cn",
        },
        (errors) => {
          expect(errors).toBe(null);
          done();
        },
      );
    }),
  );
});
