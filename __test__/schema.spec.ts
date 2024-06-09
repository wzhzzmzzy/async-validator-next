import Schema from "../src";
import { describe, it, expect } from "vitest";

const validate = (rule, source, callback) => {
  return new Schema(rule).validate(source, callback);
};

describe("schema", () => {
  it("support callback", () => {
    validate({ o: { validator: (r, v) => v > 1 } }, { o: 1 }, (errors) => {
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe("Validation error on field o");
    });
  });
  it("support required", async () => {
    await expect(
      validate(
        {
          o: { required: true },
        },
        { o: null },
      ),
    ).rejects.toThrow(Object);
  });
  it("support any", async () => {
    expect(
      await validate(
        {
          o: { type: "any" },
        },
        { o: null },
      ),
    ).toMatchObject({ o: null });
  });
});
