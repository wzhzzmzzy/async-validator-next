import type { Value } from "../types/async-validator"

function isNativeStringType(type?: string) {
  return (
    type === "string"
      || type === "url"
      || type === "hex"
      || type === "email"
      || type === "date"
      || type === "pattern"
  )
}

export function isEmptyValue(value: Value, type?: string) {
  if (value === undefined || value === null) {
    return true
  }
  if (type === "array" && Array.isArray(value) && !value.length) {
    return true
  }
  if (isNativeStringType(type) && typeof value === "string" && !value) {
    return true
  }
  return false
}
