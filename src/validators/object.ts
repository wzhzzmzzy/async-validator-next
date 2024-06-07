import { ExecuteValidator } from "../types/async-validator";
import requiredRule from "../rules/required";
import typeRule from "../rules/type";
import { isEmptyValue } from "../utils/validate";

const object: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value) && !rule.required) {
      return callback();
    }
    requiredRule(rule, value, source, errors, options);
    if (value !== undefined) {
      typeRule(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export default object;
