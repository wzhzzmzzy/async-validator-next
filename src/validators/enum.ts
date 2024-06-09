import { ExecuteValidator } from "../types/async-validator";
import { rules } from "../rules";
import { isEmptyValue } from "../utils";

const ENUM = "enum" as const;

const enumerable: ExecuteValidator = (
  rule,
  value,
  callback,
  source,
  options,
) => {
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (value !== undefined) {
      rules[ENUM](rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export default enumerable;
