import type {
  InternalRuleItem,
  Rule,
  RuleItem,
  Rules,
  SchemaOption,
  SyncErrorType,
  SyncValidateResult,
  ValidateCallback,
  ValidateError,
  ValidateFieldsError,
  ValidateOption,
  Values,
} from "./types/async-validator";
import { SchemaError } from "./types/error";
import { LANG } from "./lang";
import {
  VALIDATION_MESSAGES as EN_VALIDATION_MESSAGES,
  MESSAGES as enMessages,
} from "./lang/en";
import {
  VALIDATION_MESSAGES as ZH_VALIDATION_MESSAGES,
  MESSAGES as zhMessages,
} from "./lang/zh";
import { getInternalRule } from "./validators";
import { deepMerge, flattenOnce, format } from "./utils";

export * from "./types/async-validator";

class Schema {
  /* Static Config */
  static messages = EN_VALIDATION_MESSAGES();

  /* Static Method */
  static warning(prefix: string, content: any) {
    console.warn(prefix, content);
  }

  static get lang() {
    return Schema._lang;
  }

  static set lang(_lang) {
    Schema._lang = _lang;
    Schema._errorMessage = _lang === LANG.ZH ? zhMessages : enMessages;
    Schema._validationMessage =
      _lang === LANG.ZH ? ZH_VALIDATION_MESSAGES() : EN_VALIDATION_MESSAGES();
  }

  static get errorMessage() {
    return Schema._errorMessage;
  }

  static get validationMessage() {
    return Schema._validationMessage;
  }

  /* Private Static Members */
  protected static _lang: LANG = LANG.EN;
  protected static _errorMessage = enMessages;
  protected static _validationMessage = EN_VALIDATION_MESSAGES();
  protected static t(messageName: keyof typeof enMessages) {
    return Schema.errorMessage[messageName] || "failed";
  }

  protected static newMessage() {
    if (Schema.lang === LANG.ZH) return ZH_VALIDATION_MESSAGES();
    return EN_VALIDATION_MESSAGES();
  }

  /* Instance */
  protected rules: Record<string, RuleItem[]> = {};
  protected internalRules: Record<string, InternalRuleItem[]> = {};
  protected _messages = Schema.messages;
  protected _option: SchemaOption = {};
  protected _provisionalKeys: string[] = [];

  /* Define validate rules, prepare validators */
  public constructor(rules: Rules, option?: SchemaOption) {
    if (!rules) {
      throw new SchemaError(Schema.t("RULES_REQUIRED"));
    }
    if (typeof rules !== "object" || Array.isArray(rules)) {
      throw new SchemaError(Schema.t("RULES_TYPE"));
    }

    this._option = option ?? {};

    Object.keys(rules).forEach((name) => {
      const item: Rule = rules[name];
      this.define(name, Array.isArray(item) ? item : [item]);
    });
  }

  protected define(name: string, rules: RuleItem[]) {
    this.rules[name] = rules;
    this.internalRules[name] = rules
      .map((r) => getInternalRule(name, r, this._option))
      .filter((i) => i !== null) as InternalRuleItem[];
  }

  protected removeProvisionalKeys() {
    if (!this._provisionalKeys.length) return;
    for (const name of this._provisionalKeys) {
      delete this.rules[name];
      delete this.internalRules[name];
    }
    this._provisionalKeys = [];
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
    _callback?: ValidateCallback,
  ): Promise<Values> {
    const source = { ..._source };
    let option: ValidateOption;
    let callback: ValidateCallback = _callback;

    // solve function overload
    if (typeof _option === "function") {
      callback = _option;
      option = {};
    } else {
      option = _option ?? {};
    }

    /* support defaultFields, define provisional keys before validate */
    this.removeProvisionalKeys();
    const defaultField = this._option.defaultField;
    if (typeof defaultField === "object") {
      for (const key of Object.keys(source)) {
        if (!this.rules[key]) {
          this._provisionalKeys.push(key);
          this.define(
            key,
            Array.isArray(defaultField) ? defaultField : [defaultField],
          );
        }
      }
    }

    const keysToBeValid = option.keys || Object.keys(this.rules);

    // nothing to be validated, skip and return null.
    if (keysToBeValid.length === 0) {
      if (callback) {
        callback(null, source);
      }

      return Promise.resolve(_source);
    }

    // merge option.messages and global messages
    if (option.messages) {
      option.messages = deepMerge(Schema.newMessage(), option.messages);
    } else {
      option.messages = Schema.validationMessage;
    }

    // validating
    const validateResult = keysToBeValid.map((key) => {
      return this.syncValidateField(key, source, option);
    });
    // deep rule validating
    const deepValidateResult = await Promise.all(
      keysToBeValid.map((key) => {
        if (this.internalRules[key].some((r) => r.subSchema)) {
          return this.deepValidateField(key, source, option);
        }
      }),
    );
    // format result to an array contains all error string and a Record<string, string[]>
    const errors = flattenOnce(validateResult.filter((i) => i != null)).concat(
      flattenOnce(deepValidateResult.filter((i) => i !== null)),
    );
    const fields = keysToBeValid.reduce((prev, key, index) => {
      prev[key] = validateResult[index] ?? [];
      return prev;
    }, {} as ValidateFieldsError);

    // validate won't reject when callback function passed.
    if (typeof callback === "function") {
      if (errors.length) {
        callback(errors, fields);
      } else {
        callback(null, source);
      }
      return Promise.resolve(source);
    }

    // promisify return value
    if (!errors.length) {
      return Promise.resolve(source);
    } else {
      return Promise.reject({ errors, source });
    }
  }

  async deepValidateField(key: string, source: Values, option: ValidateOption) {
    let errors: ValidateError[] = [];

    /**
      @description collect errors from validator
     */
    const callback = (subSchemaErrors?: ValidateError[]) => {
      if (!subSchemaErrors) return;

      errors = errors.concat(subSchemaErrors);
    };

    await Promise.all(
      this.internalRules[key].map((internalRule) => {
        if (!internalRule.subSchema) return null;
        if (!source[key]) return null;
        return internalRule.subSchema.validate(source[key], option, (errors) =>
          callback(errors),
        );
      }),
    );

    return errors.length ? errors : null;
  }

  /**
    @description synchronize validate method
   */
  syncValidateField(key: string, source: Values, option: ValidateOption) {
    let errors: ValidateError[] = [];

    /**
      @description collect errors from validator
     */
    const validateCallback =
      (internalRule: InternalRuleItem) =>
      (error?: SyncErrorType | SyncErrorType[]) => {
        if (!error) return;

        let errorList = Array.isArray(error) ? error : [error];

        if (errorList.length && internalRule.message !== undefined) {
          if (typeof internalRule.message === "function") {
            errorList = [
              internalRule.message(
                internalRule.fullField || internalRule.field,
              ),
            ];
          } else {
            errorList = [internalRule.message];
          }
        }

        const rules = this.internalRules[key]?.[0];
        errors = errors.concat(
          errorList.map((e) => ({
            message: e instanceof Error ? e.message : e,
            field: rules?.fullField ?? key,
            fieldValue: source[key],
          })),
        );

        if (!option.suppressWarning && errors.length) {
          Schema.warning("async-validator-next:", errors);
        }
      };

    /* traverse all validators in rules */
    for (const internalRule of this.internalRules[key]) {
      if (!internalRule.validators) continue;

      let fieldValue = source[key];
      if (typeof internalRule.transform === "function") {
        fieldValue = internalRule.transform(source[key]);
        if (option.noTransformSource !== true) {
          source[key] = fieldValue;
        }
      }
      for (const validator of internalRule.validators) {
        let res: SyncValidateResult | void;
        const callback = validateCallback(internalRule);
        try {
          res = validator!(internalRule, fieldValue, callback, source, option);
        } catch (error) {
          console.error?.(error);
          // rethrow to report error
          if (!option.suppressValidatorError) {
            setTimeout(() => {
              throw error;
            }, 0);
          }
          callback(error);
        }
        if (res === false) {
          if (typeof internalRule.message === "function") {
            callback(
              internalRule.message(
                internalRule.fullField || internalRule.field,
              ),
            );
          } else {
            callback(
              internalRule.message ||
                format(
                  option.messages.default,
                  internalRule.fullField || internalRule.field,
                ) ||
                `${internalRule.fullField || internalRule.field} fails`,
            );
          }
        } else if (Array.isArray(res)) {
          callback(res);
        } else if (res instanceof Error) {
          callback(res.message);
        } else if (res === true || (option.allowTruthy && !!res)) {
          callback();
        }
        /* option.first means stop when validate failed first time */
        if (option.first && errors.length) break;
      }
    }
    return errors.length ? errors : null;
  }
}

export { Schema, LANG };
export default Schema;
