import type { ExecuteValidator } from "../types/async-validator"
import requiredRule from "../rules/required"

const required: ExecuteValidator = (rule, value, callback, source, options) => {
  const errors: string[] = []
  const type = Array.isArray(value) ? "array" : typeof value
  requiredRule(rule, value, source, errors, options, type)
  callback(errors)
}

export default required
