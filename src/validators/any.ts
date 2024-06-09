import { ExecuteValidator } from "../types/async-validator";
import required from "../rules/required";
import { isEmptyValue } from "../utils";

const any: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    required(rule, value, source, errors, options);
  }
  callback(errors);
};

export default any;
