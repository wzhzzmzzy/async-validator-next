import required from "./required";
import range from "./range";
import typeRule from "./type";
import url from "./url";
import pattern from "./pattern";
import whitespace from "./whitespace";
import enumRule from "./enum";

export const rules = {
  required,
  range,
  type: typeRule,
  url,
  pattern,
  whitespace,
  enum: enumRule,
};
