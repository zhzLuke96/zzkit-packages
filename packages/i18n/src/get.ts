/**
 * get object value by path
 * @param obj - the object to get value from
 * @param path - the path of the value
 * @param defaultValue - the default value
 */
export function get(obj: any, path: string, defaultValue?: unknown): unknown {
  if (typeof path !== "string") {
    throw new Error("Path must be a string");
  }

  if (!path.length) {
    return defaultValue;
  }

  const keyRegex = /([^\[\].]+)|(\[\d+\])/g;
  const arrayKeysRegex = /[\d+]/g;

  let keys = Array.from(path.match(keyRegex) || []);

  let result = obj;

  for (const key of keys) {
    if (/^\d+$/.test(key)) {
      result = result?.[parseInt(key as string)];
    } else {
      result = result?.[key];
    }

    if (Array.isArray(result)) {
      let arrayKeys = key.match(arrayKeysRegex);

      if (arrayKeys) {
        for (const arrayKey of arrayKeys) {
          result = result?.[parseInt(arrayKey)];
        }
      }
    }

    if (result === undefined) {
      break;
    }
  }

  if (result === undefined) {
    return defaultValue;
  }

  return result;
}

// 使用示例:
//   const obj = {
//     a: {
//       b: {
//         c: [1, 2, 3]
//       }
//     }
//   };

//   console.log(get(obj, 'a.b.c[1]', 'default')); // 2
