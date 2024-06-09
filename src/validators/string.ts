import { ExecuteValidator } from "../types/async-validator";
import { rules } from "../rules";
import { isEmptyValue } from "../utils";

const string: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value, "string") && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, "string");
    if (!isEmptyValue(value, "string")) {
      rules.type(rule, value, source, errors, options);
      rules.range(rule, value, source, errors, options);
      rules.pattern(rule, value, source, errors, options);
      if (rule.whitespace === true) {
        rules.whitespace(rule, value, source, errors, options);
      }
    }
  }
  callback(errors);
};

export default string;
