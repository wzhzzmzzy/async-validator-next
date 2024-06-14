import { describe, expect, it } from "vitest";
import type { Rules } from "../../src";
import Schema from "../../src";

function promisify(fn: any) {
  return () =>
    new Promise((resolve, reject) => {
      try {
        fn(resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
}

describe("deep", () => {
  it(
    "deep array specific validation",
    promisify((done, reject) => {
      new Schema({
        v: {
          required: true,
          type: "array",
          fields: {
            0: [{ type: "string" }],
            1: [{ type: "string" }],
          },
        },
      }).validate(
        {
          v: [1, "b"],
        },
        (errors, fields) => {
          try {
            expect(errors.length).toBe(1);
            expect(fields).toMatchInlineSnapshot(`
            {
              "v": [],
            }
          `);
            expect(errors[0].message).toBe("v.0 is not a string");
            done();
          } catch (e) {
            reject(e);
          }
        },
      );
    }),
  );

  it(
    "deep object specific validation",
    promisify((done, reject) => {
      new Schema({
        v: {
          required: true,
          type: "object",
          fields: {
            a: [{ type: "string" }],
            b: [{ type: "string" }],
          },
        },
      }).validate(
        {
          v: {
            a: 1,
            b: "c",
          },
        },
        (errors, fields) => {
          try {
            expect(errors.length).toBe(1);
            expect(fields).toMatchInlineSnapshot(`
            {
              "v": [],
            }
          `);
            expect(errors[0].message).toBe("v.a is not a string");
            done();
          } catch (e) {
            reject(e);
          }
        },
      );
    }),
  );

  describe("defaultField", () => {
    it(
      "deep array all values validation",
      promisify((done, reject) => {
        new Schema({
          v: {
            required: true,
            type: "array",
            defaultField: [{ type: "string" }],
          },
        }).validate(
          {
            v: [1, 2, "c"],
          },
          (errors, fields) => {
            try {
              expect(errors.length).toBe(2);
              expect(fields).toMatchInlineSnapshot(`
              {
                "v": [],
              }
            `);
              expect(errors[0].message).toBe("v.0 is not a string");
              expect(errors[1].message).toBe("v.1 is not a string");
              done();
            } catch (e) {
              reject(e);
            }
          },
        );
      }),
    );

    it(
      "deep transform array all values validation",
      promisify((done, reject) => {
        new Schema({
          v: {
            required: true,
            type: "array",
            defaultField: [{ type: "number", max: 0, transform: Number }],
          },
        }).validate(
          {
            v: ["1", "2"],
          },
          (errors, fields) => {
            try {
              expect(errors.length).toBe(2);
              expect(fields).toMatchInlineSnapshot(`
              {
                "v": [],
              }
            `);
              expect(errors).toMatchInlineSnapshot(`
              [
                {
                  "field": "v.0",
                  "fieldValue": 1,
                  "message": "v.0 cannot be greater than 0",
                },
                {
                  "field": "v.1",
                  "fieldValue": 2,
                  "message": "v.1 cannot be greater than 0",
                },
              ]
            `);
              done();
            } catch (e) {
              reject(e);
            }
          },
        );
      }),
    );

    it("will merge top validation", async () => {
      const obj = {
        value: "",
        test: [
          {
            name: "aa",
          },
        ],
      };

      const descriptor: Rules = {
        test: {
          type: "array",
          min: 2,
          required: true,
          message: "至少两项",
          defaultField: [
            {
              type: "object",
              required: true,
              message: "test 必须有",
              fields: {
                name: {
                  type: "string",
                  required: true,
                  message: "name 必须有",
                },
              },
            },
          ],
        },
      };

      await promisify((done, reject) =>
        new Schema(descriptor).validate(obj, (errors) => {
          try {
            expect(errors).toMatchInlineSnapshot(`
          [
            {
              "field": "test",
              "fieldValue": [
                {
                  "name": "aa",
                },
              ],
              "message": "至少两项",
            },
          ]
        `);
            done();
          } catch (e) {
            reject(e);
          }
        }),
      )();
    });

    it(
      "array & required works",
      promisify((done, reject) => {
        const descriptor: Rules = {
          testArray: {
            type: "array",
            required: true,
            defaultField: [{ type: "string" }],
          },
        };
        const record = {
          testArray: [],
        };
        const validator = new Schema(descriptor);
        validator.validate(record, (errors, fields) => {
          done();
        });
      }),
    );

    it(
      "deep object all values validation",
      promisify((done, reject) => {
        new Schema({
          v: {
            required: true,
            type: "object",
            defaultField: [{ type: "string" }],
          },
        }).validate(
          {
            v: {
              a: 1,
              b: "c",
            },
          },
          (errors) => {
            try {
              expect(errors.length).toBe(1);
              expect(errors[0].message).toBe("v.a is not a string");
              done();
            } catch (e) {
              reject(e);
            }
          },
        );
      }),
    );
  });
});
