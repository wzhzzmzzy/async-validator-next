import { ExecuteRule } from '../types/async-validator';
import { format } from '../utils';
import { isEmptyValue } from '../utils/validate';

const required: ExecuteRule = (rule, value, source, errors, options, type) => {
  if (
    rule.required &&
    (!source.hasOwnProperty(rule.field) ||
      isEmptyValue(value, type || rule.type))
  ) {
    errors.push(format(options.messages.required, rule.fullField));
  }
};

export default required;
