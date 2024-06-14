import { describe, expect, it } from "vitest";
import Schema from "../../src";

function promisify(fn) {
  return () =>
    new Promise((resolve, reject) => {
      try {
        fn(resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
}

describe("validator", () => {
  it(
    "works",
    promisify((done, reject) => {
      new Schema({
        v: [
          {
            validator(rule, value, callback) {
              callback(new Error("e1"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e2"));
            },
          },
        ],
        v2: [
          {
            validator(rule, value, callback) {
              callback(new Error("e3"));
            },
          },
        ],
        v3: [
          {
            validator() {
              return false;
            },
          },
          {
            validator() {
              return new Error("e5");
            },
          },
          {
            validator() {
              return false;
            },
            message: "e6",
          },
          {
            validator() {
              return true;
            },
          },
          // Customize with empty message
          {
            validator() {
              return false;
            },
            message: "",
          },
        ],
      }).validate(
        {
          v: 2,
        },
        (errors) => {
          try {
            expect(errors.length).toBe(7);
            expect(errors[0].message).toBe("e1");
            expect(errors[1].message).toBe("e2");
            expect(errors[2].message).toBe("e3");
            expect(errors[3].message).toBe("v3 fails");
            expect(errors[4].message).toBe("e5");
            expect(errors[5].message).toBe("e6");
            expect(errors[6].message).toBe("");
            done();
          } catch (e) {
            reject(e);
          }
        },
      );
    }),
  );

  it(
    "first works",
    promisify((done, reject) => {
      new Schema({
        v: [
          {
            validator(rule, value, callback) {
              callback(new Error("e1"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e2"));
            },
          },
        ],
        v2: [
          {
            validator(rule, value, callback) {
              callback(new Error("e3"));
            },
          },
        ],
      }).validate(
        {
          v: 2,
          v2: 1,
        },
        {
          first: true,
        },
        (errors) => {
          try {
            expect(errors.length).toBe(1);
            expect(errors[0].message).toBe("e1");
            done();
          } catch (e) {
            reject(e);
          }
        },
      );
    }),
  );

  describe("firstFields", () => {
    it(
      "works for true",
      promisify((done, reject) => {
        new Schema({
          v: [
            {
              validator(rule, value, callback) {
                callback(new Error("e1"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e2"));
              },
            },
          ],

          v2: [
            {
              validator(rule, value, callback) {
                callback(new Error("e3"));
              },
            },
          ],
          v3: [
            {
              validator(rule, value, callback) {
                callback(new Error("e4"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e5"));
              },
            },
          ],
        }).validate(
          {
            v: 1,
            v2: 1,
            v3: 1,
          },
          {
            firstFields: true,
          },
          (errors) => {
            try {
              expect(errors.length).toBe(3);
              expect(errors[0].message).toBe("e1");
              expect(errors[1].message).toBe("e3");
              expect(errors[2].message).toBe("e4");
              done();
            } catch (e) {
              reject(e);
            }
          },
        );
      }),
    );

    it(
      "works for array",
      promisify((done, reject) => {
        new Schema({
          v: [
            {
              validator(rule, value, callback) {
                callback(new Error("e1"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e2"));
              },
            },
          ],

          v2: [
            {
              validator(rule, value, callback) {
                callback(new Error("e3"));
              },
            },
          ],
          v3: [
            {
              validator(rule, value, callback) {
                callback(new Error("e4"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e5"));
              },
            },
          ],
        }).validate(
          {
            v: 1,
            v2: 1,
            v3: 1,
          },
          {
            firstFields: ["v"],
          },
          (errors) => {
            try {
              expect(errors.length).toBe(4);
              expect(errors[0].message).toBe("e1");
              expect(errors[1].message).toBe("e3");
              expect(errors[2].message).toBe("e4");
              expect(errors[3].message).toBe("e5");
              done();
            } catch (e) {
              reject(e);
            }
          },
        );
      }),
    );
  });

  describe("promise api", () => {
    it(
      "works",
      promisify((done, reject) => {
        new Schema({
          v: [
            {
              validator(rule, value, callback) {
                callback(new Error("e1"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e2"));
              },
            },
          ],
          v2: [
            {
              validator(rule, value, callback) {
                callback(new Error("e3"));
              },
            },
          ],
          v3: [
            {
              validator() {
                return false;
              },
            },
            {
              validator() {
                return new Error("e5");
              },
            },
            {
              validator() {
                return false;
              },
              message: "e6",
            },
            {
              validator() {
                return true;
              },
            },
          ],
        })
          .validate({
            v: 2,
          })
          .catch(({ errors, fields }) => {
            try {
              expect(errors.length).toBe(6);
              expect(errors[0].message).toBe("e1");
              expect(errors[1].message).toBe("e2");
              expect(errors[2].message).toBe("e3");
              expect(errors[3].message).toBe("v3 fails");
              expect(errors[4].message).toBe("e5");
              expect(errors[5].message).toBe("e6");
              expect(fields.v[0].fieldValue).toBe(2);

              // different with async-validator
              // callback(new Error('e1'))  will return [Error: e1]
              expect(fields).toMatchInlineSnapshot(`
            {
              "v": [
                {
                  "field": "v",
                  "fieldValue": 2,
                  "message": "e1",
                },
                {
                  "field": "v",
                  "fieldValue": 2,
                  "message": "e2",
                },
              ],
              "v2": [
                {
                  "field": "v2",
                  "fieldValue": undefined,
                  "message": "e3",
                },
              ],
              "v3": [
                {
                  "field": "v3",
                  "fieldValue": undefined,
                  "message": "v3 fails",
                },
                {
                  "field": "v3",
                  "fieldValue": undefined,
                  "message": "e5",
                },
                {
                  "field": "v3",
                  "fieldValue": undefined,
                  "message": "e6",
                },
              ],
            }
          `);
              done();
            } catch (e) {
              reject(e);
            }
          });
      }),
    );

    it(
      "first works",
      promisify((done, reject) => {
        new Schema({
          v: [
            {
              validator(rule, value, callback) {
                callback(new Error("e1"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e2"));
              },
            },
          ],
          v2: [
            {
              validator(rule, value, callback) {
                callback(new Error("e3"));
              },
            },
          ],
        })
          .validate(
            {
              v: 2,
              v2: 1,
            },
            {
              first: true,
            },
          )
          .catch(({ errors }) => {
            try {
              expect(errors.length).toBe(1);
              expect(errors[0].message).toBe("e1");
              done();
            } catch (e) {
              reject(e);
            }
          });
      }),
    );

    describe("firstFields", () => {
      it(
        "works for true",
        promisify((done, reject) => {
          new Schema({
            v: [
              {
                validator(rule, value, callback) {
                  callback(new Error("e1"));
                },
              },
              {
                validator(rule, value, callback) {
                  callback(new Error("e2"));
                },
              },
            ],

            v2: [
              {
                validator(rule, value, callback) {
                  callback(new Error("e3"));
                },
              },
            ],
            v3: [
              {
                validator(rule, value, callback) {
                  callback(new Error("e4"));
                },
              },
              {
                validator(rule, value, callback) {
                  callback(new Error("e5"));
                },
              },
            ],
          })
            .validate(
              {
                v: 1,
                v2: 1,
                v3: 1,
              },
              {
                firstFields: true,
              },
            )
            .catch(({ errors }) => {
              try {
                expect(errors.length).toBe(3);
                expect(errors[0].message).toBe("e1");
                expect(errors[1].message).toBe("e3");
                expect(errors[2].message).toBe("e4");
                done();
              } catch (e) {
                reject(errors);
              }
            });
        }),
      );

      it(
        "works for array",
        promisify((done, reject) => {
          new Schema({
            v: [
              {
                validator(rule, value, callback) {
                  callback(new Error("e1"));
                },
              },
              {
                validator(rule, value, callback) {
                  callback(new Error("e2"));
                },
              },
            ],

            v2: [
              {
                validator(rule, value, callback) {
                  callback(new Error("e3"));
                },
              },
            ],
            v3: [
              {
                validator(rule, value, callback) {
                  callback(new Error("e4"));
                },
              },
              {
                validator(rule, value, callback) {
                  callback(new Error("e5"));
                },
              },
            ],
          })
            .validate(
              {
                v: 1,
                v2: 1,
                v3: 1,
              },
              {
                firstFields: ["v"],
              },
            )
            .catch(({ errors }) => {
              try {
                expect(errors.length).toBe(4);
                expect(errors[0].message).toBe("e1");
                expect(errors[1].message).toBe("e3");
                expect(errors[2].message).toBe("e4");
                expect(errors[3].message).toBe("e5");
                done();
              } catch (e) {
                reject(e);
              }
            });
        }),
      );

      it(
        "works for no rules fields",
        promisify((done, reject) => {
          new Schema({
            v: [],
            v2: [],
          })
            .validate({
              v: 2,
              v2: 1,
            })
            .then((source) => {
              try {
                expect(source).toMatchObject({ v: 2, v2: 1 });
                done();
              } catch (error) {
                reject(error);
              }
            });
        }),
      );
    });
  });

  it(
    "custom validate function throw error",
    promisify((done) => {
      new Schema({
        v: [
          {
            validator(rule, value, callback) {
              throw new Error("something wrong");
            },
          },
        ],
      })
        .validate(
          { v: "" },
          {
            suppressValidatorError: true,
          },
        )
        .catch(({ errors }) => {
          expect(errors.length).toBe(1);
          expect(errors[0].message).toBe("something wrong");
          done();
        });
    }),
  );
});
