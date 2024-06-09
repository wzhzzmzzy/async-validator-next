import { ExecuteValidator } from "../types/async-validator";
import { rules } from "../rules";
import { isEmptyValue } from "../utils";

const type: ExecuteValidator = (rule, value, callback, source, options) => {
  const ruleType = rule.type;
  const errors: string[] = [];
  const validate =
    rule.required || (!rule.required && source.hasOwnProperty(rule.field));
  if (validate) {
    if (isEmptyValue(value, ruleType) && !rule.required) {
      return callback();
    }
    rules.required(rule, value, source, errors, options, ruleType);
    if (!isEmptyValue(value, ruleType)) {
      rules.type(rule, value, source, errors, options);
    }
  }
  callback(errors);
};

export default type;
