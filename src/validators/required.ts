import type { ExecuteValidator } from "../types/async-validator";
import { isEmptyValue } from "../utils/validate";
import { format } from "../utils";

const required: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = [];
  const type = Array.isArray(value) ? "array" : typeof value;
  if (
    rule.required &&
    (!source.hasOwnProperty(rule.field!) ||
      isEmptyValue(value, type || rule.type))
  ) {
    errors.push(
      format(options.messages?.required ?? "REQUIRED", rule.fullField),
    );
  }
  callback(errors);
};

export default required;
