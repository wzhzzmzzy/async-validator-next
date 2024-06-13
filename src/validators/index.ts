import type {
  ExecuteValidator,
  InternalRuleItem,
  Rule,
  RuleItem,
  RuleType,
  SchemaOption,
} from "../types/async-validator";
import { format } from "../utils";
import Schema from "..";
import required from "./required";
import any from "./any";
import object from "./object";
import enumFn from "./enum";
import float from "./float";
import integer from "./integer";
import string from "./string";
import array from "./array";
import date from "./date";
import number from "./number";
import pattern from "./pattern";
import typeFn from './type';

const validators = {
  any,
  array,
  date,
  object,
  float,
  integer,
  string,
  number,
  pattern,
  enum: enumFn,
  url: typeFn,
};

const getRuleType: (rule: RuleItem) => RuleType = (rule) => {
  if (rule.type === undefined && rule.pattern instanceof RegExp) {
    rule.type = "pattern";
  }
  if (
    typeof rule.validator !== "function" &&
    rule.type &&
    !validators.hasOwnProperty(rule.type)
  ) {
    throw new Error(format("Unknown rule type %s", rule.type));
  }
  return rule.type || "string";
};

export const getInternalRule: (
  key: string,
  rule: RuleItem,
  option: SchemaOption,
) => InternalRuleItem | null = (key, rule, option) => {
  let internalRule: InternalRuleItem = rule;
  if (typeof rule === "function") {
    internalRule = {
      validators: [rule],
    };
  } else {
    // shallow copy
    internalRule = {
      ...rule,
      validators: getExecuteValidators(rule),
    };
  }

  internalRule.field = key;
  internalRule.type = getRuleType(rule);

  // subSchema of deep rule created by `fields` will contain `fullField` prop
  // otherwise created by `defaultField`, fill `fullField` and `fullFields` by `_prefixField`
  if (!(rule as InternalRuleItem).fullField) {
    internalRule.fullField = option._prefixField
      ? `${option._prefixField}.${key}`
      : key;
    internalRule.fullFields = option._prefixField
      ? [...option._prefixField.split("."), key]
      : [key];
  }

  // Fill validator, skip if nothing to be validated.
  if (!internalRule.validators.length && !internalRule.asyncValidator)
    return null;

  // Solve deep rules, create new Schema with deep rule options
  if (internalRule.type === "object" || internalRule.type === "array") {
    if (
      typeof internalRule.fields === "object" ||
      typeof internalRule.defaultField === "object"
    ) {
      const subRules: Record<string, Rule> = internalRule.fields ?? {};
      const subOption: SchemaOption = {
        ...option,
        _prefixField: internalRule.fullField,
      };
      if (internalRule.defaultField) {
        subOption.defaultField = internalRule.defaultField;
      }
      internalRule.subSchema = new Schema(subRules, subOption);
    }
  }

  return internalRule;
};

/**
  @description select validator from RuleItem
 */
export const getExecuteValidators: (
  rule: RuleItem,
) => Array<RuleItem["validator"] | ExecuteValidator> = (rule) => {
  const exec: Array<RuleItem["validator"] | ExecuteValidator> = [];

  if (typeof rule.validator === "function") {
    exec.push(rule.validator);
    return exec;
  }

  const keys = Object.keys(rule).filter((k) => k !== "message");
  if (keys.length === 1 && keys[0] === "required") {
    exec.push(required);
    return exec;
  }

  const typeValidator = validators[getRuleType(rule)];
  if (typeValidator) {
    exec.push(typeValidator);
  }

  return exec;
};
