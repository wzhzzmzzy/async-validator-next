import type {
    RuleItem,
    ExecuteValidator,
    InternalRuleItem,
  } from "../types/async-validator";
  import required from "./required";
  
  export const getInternalRules: (
    key: string,
    rules: RuleItem[],
  ) => InternalRuleItem = (key, rules) => {
    const internalRule: InternalRuleItem = {
      field: key,
      fullField: key,
      fullFields: [key],
    };
    return rules.reduce((prev, rule) => {
      prev = { ...prev, ...rule };
      return prev;
    }, internalRule);
  };
  
  export const getExecuteValidators: (rules: RuleItem[]) => ExecuteValidator[] = (
    rules,
  ) => {
    return rules.reduce((prev, rule) => {
      if (rule.required) {
        prev.push(required);
      }
      return prev;
    }, [] as ExecuteValidator[]);
  };
  