import type {
    RuleItem,
    Rules,
    Rule,
    Values,
    ValidateOption,
    ValidateCallback,
    ExecuteValidator,
    ValidateFieldsError,
    ValidateError,
    SyncErrorType,
    InternalRuleItem,
  } from "./types/async-validator";
  import { SchemaError } from "./types/error";
  import { LANG } from "./lang";
  import { MESSAGES as enMessages } from "./lang/en";
  import { MESSAGES as zhMessages } from "./lang/zh";
  import { getExecuteValidators, getInternalRules } from "./validators";
  import { flattenOnce } from "./utils";
  
  export * from "./types/async-validator";
  
  class Schema {
    /* Static Config */
    static lang: LANG = LANG.EN;
  
    /* Static Method */
    static warning(prefix: string, content: any) {
      console.warn(prefix, content);
    }
  
    /* Private Static */
    protected static get errorMessage() {
      if (Schema.lang === LANG.ZH) return zhMessages;
      else return enMessages;
    }
    protected static t(messageName: keyof typeof enMessages) {
      return Schema.errorMessage[messageName] || "failed";
    }
  
    /* Instance */
    protected rules: Record<string, RuleItem[]> = {};
    protected internalRules: Record<string, InternalRuleItem> = {};
    protected internalValidators: Record<string, ExecuteValidator[]> = {};
  
    /* Define validate rules, prepare validators */
    public constructor(rules: Rules) {
      if (!rules) {
        throw new SchemaError(Schema.t("RULES_REQUIRED"));
      }
      if (typeof rules !== "object" || Array.isArray(rules)) {
        throw new SchemaError(Schema.t("RULES_TYPE"));
      }
      this.rules = {};
  
      Object.keys(rules).forEach((name) => {
        const item: Rule = rules[name];
        this.define(name, Array.isArray(item) ? item : [item]);
      });
    }
  
    protected define(name: string, rules: RuleItem[]) {
      this.rules[name] = rules;
      this.internalRules[name] = getInternalRules(name, rules);
      this.internalValidators[name] = getExecuteValidators(rules);
    }
  
    public validate(
      source: Values,
      option?: ValidateOption,
      callback?: ValidateCallback,
    ): Promise<Values>;
    public validate(source: Values, callback: ValidateCallback): Promise<Values>;
    public validate(source: Values): Promise<Values>;
  
    public async validate(
      _source: Values,
      _option?: ValidateOption | ValidateCallback,
      _callback: ValidateCallback = () => void 0,
    ): Promise<Values> {
      let source = _source;
      let option: ValidateOption;
      let callback: ValidateCallback = _callback;
  
      // solve function overload
      if (typeof _option === "function") {
        callback = _option;
        option = {};
      } else {
        option = _option ?? {};
      }
  
      const keysToBeValid = option.keys || Object.keys(this.rules);
  
      // empty rules
      if (keysToBeValid.length === 0) {
        if (callback) {
          callback(null, source);
        }
  
        return Promise.resolve(_source);
      }
  
      // validating
      const validateResult = keysToBeValid.map((key) => {
        return this.validateField(key, source, option);
      });
      // format result to an array contains all error string and a Record<string, string[]>
      const errors = flattenOnce(
        validateResult.filter((i) => i != null) as ValidateError[][],
      );
      const fields = keysToBeValid.reduce((prev, key, index) => {
        prev[key] = validateResult[index] ?? [];
        return prev;
      }, {} as ValidateFieldsError);
  
      // validate won't reject when callback function passed.
      if (typeof callback === "function") {
        callback(errors.length ? errors : null, fields);
        return Promise.resolve(_source);
      }
  
      // promisify return value
      if (!errors.length) {
        return Promise.resolve(_source);
      } else {
        return Promise.reject({ errors, fields });
      }
    }
  
    validateField(key: string, source: Values, option: ValidateOption) {
      let errors: ValidateError[] = [];
      const callback = (error?: SyncErrorType | SyncErrorType[]) => {
        let errorList = Array.isArray(error) ? error : [error];
  
        errors = errors.concat(
          errorList.map((e) => ({
            message: e instanceof Error ? e.message : e,
            field: key,
            fieldValue: source[key],
          })),
        );
  
        if (!option.suppressWarning && errors.length) {
          Schema.warning("async-validator-next:", errors);
        }
      };
      for (let validator of this.internalValidators[key]) {
        try {
          validator(
            this.internalRules[key],
            source[key],
            callback,
            source,
            option,
          );
        } catch (e) {
          callback(e);
        }
        if (option.first && errors.length) break;
      }
      return errors.length ? errors : null;
    }
  }
  
  export { Schema, LANG };
  export default Schema;
  