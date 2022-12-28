export const parseCliResponseObject = (response: string[], fields: string[]) => {
  return response
    .filter((l) => fields.some((f) => l.includes(f + ': ') || l.includes(f + ' = ')))
    .map((l) => {
      const obj: any = {}
      fields.forEach((f) => {
        const propname = f.replace(' ', '')
        if (l.includes(f + ': ')) {
          obj[propname] = l.split(f + ': ')[1]
        } else if (l.includes(f + ' = ')) {
          obj[propname] = l.split(f + ' = ')[1]
        }
      })
      return obj
    })
    .reduce((a, b) => Object.assign(a, b), {})
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export const isObject = function (item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
// export const mergeDeep2 = function (target: any, ...sources: any): any {
//   if (!sources.length) return target
//   const source = sources.shift()

//   if (isObject(target) && isObject(source)) {
//     for (const key in source) {
//       if (isObject(source[key])) {
//         if (!target[key]) Object.assign(target, { [key]: {} })
//         mergeDeep(target[key], source[key])
//       } else {
//         Object.assign(target, { [key]: source[key] })
//       }
//     }
//   }

//   return mergeDeep(target, ...sources)
// }

export const mergeDeep = function <T1 extends Record<string, unknown>, T2, T3, T4>(
  target: T1,
  ...sources: Array<T2 | T3 | T4>
): T1 & T2 & T3 & T4 {
  return mergeDeepInner({}, target, ...sources)
}

const mergeDeepInner = function <T1 extends Record<string, unknown>, T2, T3, T4>(target: T1, ...sources: any): any {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeepInner(target[key] as Record<string, unknown>, source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeepInner(target, ...sources) as T1 & T2 & T3 & T4
}
