import { ExecuteValidator } from "../types/async-validator";
import { rules } from "../rules";
import { isEmptyValue } from "../utils";

const pattern: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value, "string") && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options);
    if (!isEmptyValue(value, "string")) {
      rules.pattern(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export default pattern;
