const formatRegExp = /%[sdj%]/g

export function format(
  template: ((...args: any[]) => string) | string,
  ...args: any[]
): string {
  let i = 0
  const len = args.length
  if (typeof template === "function") {
    return template.apply(null, args)
  }
  if (typeof template === "string") {
    const str = template.replace(formatRegExp, (x) => {
      if (x === "%%") {
        return "%"
      }
      if (i >= len) {
        return x
      }
      switch (x) {
        case "%s":
          return String(args[i++])
        case "%d":
          return Number(args[i++]) as unknown as string
        case "%j":
          try {
            return JSON.stringify(args[i++])
          }
          catch (_) {
            return "[Circular]"
          }
        default:
          return x
      }
    })
    return str
  }
  return template
}

export const flattenOnce: <T>(arr: T[][]) => T[] = arr =>
  arr.reduce((a, b) => a.concat(b || []), [])
