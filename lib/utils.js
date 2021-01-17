exports.parseCliResponseObject = (response, fields) => {
    return response
        .filter(l => fields.some(f => l.includes(f + ': ') || l.includes(f + ' = ')))
        .map(l => {
            const obj = {};
            fields.forEach(f => {
                const propname = f.replace(' ', '');
                if (l.includes(f + ': ')) {
                    obj[propname] = l.split(f + ': ')[1];
                }
                else if (l.includes(f + ' = ')) {
                    obj[propname] = l.split(f + ' = ')[1];
                }
            })
            return obj;
        })
        .reduce((a, b) => Object.assign(a, b), {});
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
const isObject = function(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
exports.isObject = isObject;

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
const mergeDeep = function(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
  
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
  
    return mergeDeep(target, ...sources);
}
exports.mergeDeep = mergeDeep;