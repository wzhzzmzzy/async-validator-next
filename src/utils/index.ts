import type { Value } from "../types/async-validator";

const formatRegExp = /%[sdj%]/g;

export const format: (
  template: ((...args: any[]) => string) | string,
  ...args: any[]
) => string = (template, ...args) => {
  let i = 0;
  const len = args.length;
  if (typeof template === "function") {
    return template.apply(null, args);
  }
  if (typeof template === "string") {
    const str = template.replace(formatRegExp, (x) => {
      if (x === "%%") {
        return "%";
      }
      if (i >= len) {
        return x;
      }
      switch (x) {
        case "%s":
          return String(args[i++]);
        case "%d":
          return Number(args[i++]) as unknown as string;
        case "%j":
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return "[Circular]";
          }
        default:
          return x;
      }
    });
    return str;
  }
  return template;
};

export const flattenOnce: <T>(arr: T[][]) => T[] = (arr) =>
  arr.reduce((a, b) => a.concat(b || []), []);

export const deepMerge: <T extends object>(
  target: T,
  source: Partial<T>,
) => T = (target, source) => {
  if (source) {
    for (const s in source) {
      if (source.hasOwnProperty(s)) {
        const value = source[s];
        if (typeof value === "object" && typeof target[s] === "object") {
          target[s] = {
            ...target[s],
            ...value,
          };
        } else {
          target[s] = value;
        }
      }
    }
  }
  return target;
};

const isNativeStringType = (type: string) => {
  return (
    type === "string" ||
    type === "url" ||
    type === "hex" ||
    type === "email" ||
    type === "date" ||
    type === "pattern"
  );
};

export const isEmptyValue: (value: Value, type?: string) => boolean = (
  value,
  type,
) => {
  if (value === undefined || value === null) {
    return true;
  }
  if (type === "array" && Array.isArray(value) && !value.length) {
    return true;
  }
  if (isNativeStringType(type) && typeof value === "string" && !value) {
    return true;
  }
  return false;
};
