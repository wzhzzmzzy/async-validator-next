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
import {
  VALIDATION_MESSAGES as EN_VALIDATION_MESSAGES,
  MESSAGES as enMessages,
} from "./lang/en";

import { getInternalRule } from "./validators";
import { deepMerge, flattenOnce } from "./utils";

export * from "./types/async-validator";

class Schema {
  /* Static Config */
  static messages = EN_VALIDATION_MESSAGES();

  /* Static Method */
  static warning(prefix: string, content: any) {
    console.warn(prefix, content);
  }

  // static get lang() {
  //   return Schema._lang
  // }
  //
  // static set lang(_lang) {
  //   Schema._lang = _lang
  //   Schema._errorMessage = _lang === LANG.ZH ? zhMessages : enMessages
  //   Schema._validationMessage
  //     = _lang === LANG.ZH ? ZH_VALIDATION_MESSAGES() : EN_VALIDATION_MESSAGES()
  // }

  static get errorMessage() {
    return Schema._errorMessage;
  }

  static get validationMessage() {
    return Schema._validationMessage;
  }

  /* Private Static Members */
  // protected static _lang: LANG = LANG.EN
  protected static _errorMessage = enMessages;
  protected static _validationMessage = EN_VALIDATION_MESSAGES();
  protected static t(messageName: keyof typeof enMessages) {
    return Schema.errorMessage[messageName] || "failed";
  }

  protected static newMessage() {
    // if (Schema.lang === LANG.ZH)
    //   return ZH_VALIDATION_MESSAGES()
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

    this._option = option || {};

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
      option = _option || {};
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
    let hasFirstError = false;
    const validateResult: ValidateError[][] = [];
    const asyncValidatePromise: Promise<void>[] = [];

    for (const key of keysToBeValid) {
      const p = this.asyncValidateField(key, source, option).then((errors) => {
        validateResult.push(errors);
        if (!hasFirstError && errors && errors.length) hasFirstError = true;
      });
      if (option.first) {
        await p;
        if (hasFirstError) break;
      } else {
        asyncValidatePromise.push(p);
      }
    }
    const parallelValidatePromise = Promise.all(asyncValidatePromise);

    for (const key of keysToBeValid) {
      if (option.first && hasFirstError) {
        break;
      }
      const result = this.syncValidateField(key, source, option);
      validateResult.push(result);
      if (!hasFirstError && result && result.length) hasFirstError = true;
    }

    // deep rule validating
    let hasDeepFields = false;
    const deepValidatePromise = Promise.all(
      keysToBeValid.map((key) => {
        if (this.internalRules[key].some((r) => r.subSchema)) {
          hasDeepFields = true;
          return this.deepValidateField(key, source, option);
        }
        return Promise.resolve(null);
      }),
    );

    const [_, deepValidateResult]: [void[], (ValidateError[] | null)[]] =
      await Promise.all([parallelValidatePromise, deepValidatePromise]);

    // format result to an array contains all error string and a Record<string, string[]>
    const errors = flattenOnce(validateResult.filter((i) => i != null)).concat(
      flattenOnce(deepValidateResult.filter((i) => i !== null)),
    );
    const fields = keysToBeValid.reduce((prev, key, index) => {
      prev[key] = validateResult[index] || [];
      return prev;
    }, {} as ValidateFieldsError);

    // Append deep fields to return value
    if (option.returnDeepFields === true && hasDeepFields) {
      for (const result of deepValidateResult) {
        if (result && Array.isArray(result) && result.length) {
          const field = result[0].field;
          fields[field] = result;
        }
      }
    }

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
      // eslint-disable-next-line prefer-promise-reject-errors
      return Promise.reject({ errors, fields });
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

  makeValidateCallback(
    key: string,
    errors: ValidateError[],
    internalRule: InternalRuleItem,
    source: Values,
    option: ValidateOption,
  ) {
    return (error?: SyncErrorType | SyncErrorType[]) => {
      if (!error) return;

      let errorList = Array.isArray(error) ? error : [error];

      if (errorList.length && internalRule.message !== undefined) {
        if (typeof internalRule.message === "function") {
          errorList = [
            internalRule.message(internalRule.fullField || internalRule.field),
          ];
        } else {
          errorList = [internalRule.message];
        }
      }

      const rules = (this.internalRules[key] || [])[0];
      const newErrors = errorList.map((e) => ({
        message: e instanceof Error ? e.message : e,
        field: rules ? rules.fullField || key : key,
        fieldValue: source[key],
      }));
      for (const error of newErrors) {
        errors.push(error);
      }

      if (!option.suppressWarning && errors.length) {
        Schema.warning("async-validator-next:", errors);
      }
    };
  }

  postErrorCallback(
    result: SyncValidateResult | void,
    callback: ReturnType<Schema["makeValidateCallback"]>,
    internalRule: InternalRuleItem,
    option: ValidateOption,
  ) {
    if (result === false) {
      if (typeof internalRule.message === "function") {
        callback(
          internalRule.message(internalRule.fullField || internalRule.field),
        );
      } else {
        callback(
          internalRule.message ||
            // || format(
            //   option.messages.default,
            //   internalRule.fullField || internalRule.field,
            // )
            `${internalRule.fullField || internalRule.field} fails`,
        );
      }
    } else if (Array.isArray(result)) {
      callback(result);
    } else if (result instanceof Error) {
      callback(result.message);
    } else if (result === true || (option.allowTruthy && !!result)) {
      callback();
    }
  }

  /**
    @description synchronize validate method
   */
  syncValidateField(key: string, source: Values, option: ValidateOption) {
    const errors: ValidateError[] = [];

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
        const callback = this.makeValidateCallback(
          key,
          errors,
          internalRule,
          source,
          option,
        );
        try {
          res = validator!(internalRule, fieldValue, callback, source, option);
        } catch (error) {
          console.error(error);
          // rethrow to report error
          if (!option.suppressValidatorError) {
            setTimeout(() => {
              throw error;
            }, 0);
          }
          callback(error);
        }
        this.postErrorCallback(res, callback, internalRule, option);
        if (!errors.length) continue;
        /* option.first means stop when validate failed first time */
        if (option.first) {
          return errors;
        }
        /* option.firstFields means stop when current field validate failed first time */
        let firstField = option.firstFields === true;
        if (Array.isArray(option.firstFields)) {
          firstField = option.firstFields.includes(key);
        }
        if (firstField) {
          return errors;
        }
      }
    }
    return errors.length ? errors : null;
  }

  async asyncValidateField(
    key: string,
    source: Values,
    option: ValidateOption,
  ) {
    const errors: ValidateError[] = [];
    const promises = [];

    for (const internalRule of this.internalRules[key]) {
      if (!internalRule.asyncValidator) continue;

      let fieldValue = source[key];
      if (typeof internalRule.transform === "function") {
        fieldValue = internalRule.transform(source[key]);
        if (option.noTransformSource !== true) {
          source[key] = fieldValue;
        }
      }

      const callback = this.makeValidateCallback(
        key,
        errors,
        internalRule,
        source,
        option,
      );
      let res: SyncValidateResult | void;
      const validatePromise = (async () => {
        try {
          res = await internalRule.asyncValidator(
            internalRule,
            fieldValue,
            callback,
            source,
            option,
          );
        } catch (error) {
          // rethrow to report error
          if (!option.suppressValidatorError) {
            console.error(error);
            setTimeout(() => {
              throw error;
            }, 0);
          }
          callback(error);
        }
        this.postErrorCallback(res, callback, internalRule, option);
      })();

      let first = option.first || option.firstFields === true;
      if (Array.isArray(option.firstFields)) {
        first = option.firstFields.includes(key);
      }
      if (first) {
        await validatePromise;
        if (errors.length) return errors;
      } else {
        promises.push(validatePromise);
      }
    }

    await Promise.all(promises);
    return errors;
  }
}

export default Schema;
