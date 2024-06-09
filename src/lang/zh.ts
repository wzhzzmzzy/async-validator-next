import type { InternalValidateMessages } from "../types/async-validator";

export const MESSAGES = {
  RULES_REQUIRED: "初始化 Schema 失败，缺少参数",
  RULES_TYPE: "初始化参数需要是 Object",
};

export function VALIDATION_MESSAGES(): InternalValidateMessages {
  return {
    default: "字段%s验证错误",
    required: "%s是必需的",
    enum: "%s必须是%s之一",
    whitespace: "%s不能为空",
    date: {
      format: "%s日期%s格式无效，应为%s",
      parse: "%s日期无法解析，%s无效",
      invalid: "%s日期%s无效",
    },
    types: {
      string: "%s不是%s",
      method: "%s不是%s（函数）",
      array: "%s不是%s",
      object: "%s不是%s",
      number: "%s不是%s",
      date: "%s不是%s",
      boolean: "%s不是%s",
      integer: "%s不是%s",
      float: "%s不是%s",
      regexp: "%s不是有效的%s",
      email: "%s不是有效的%s",
      url: "%s不是有效的%s",
      hex: "%s不是有效的%s",
    },
    string: {
      len: "%s必须是%s个字符",
      min: "%s至少必须是%s个字符",
      max: "%s不能超过%s个字符",
      range: "%s必须在%s和%s个字符之间",
    },
    number: {
      len: "%s必须等于%s",
      min: "%s不能小于%s",
      max: "%s不能大于%s",
      range: "%s必须在%s和%s之间",
    },
    array: {
      len: "%s的长度必须正好是%s",
      min: "%s的长度不能小于%s",
      max: "%s的长度不能大于%s",
      range: "%s的长度必须在%s和%s之间",
    },
    pattern: {
      mismatch: "%s的值%s不符合模式%s",
    },
    clone() {
      const cloned = JSON.parse(JSON.stringify(this));
      cloned.clone = this.clone;
      return cloned;
    },
  };
}
