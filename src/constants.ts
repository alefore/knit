/**
 * Creates an object where keys and values are identical.
 * Uses a Proxy to throw an error if a non-existent key is accessed.
 */
export function createConstants<T extends string>(...keys: T[]):
    {readonly[K in T]: K} {
  const constants = keys.reduce((obj, key) => {
    obj[key] = key;
    return obj;
  }, {} as Record<string, string>);

  return new Proxy(constants, {
           get: (target, name: string) => {
             if (name in target) return target[name];
             throw new Error(`Constant "${String(name)}" is not defined.`);
           }
         }) as {readonly[K in T]: K};
}

/**
 * Wraps an existing object in a Proxy to prevent accessing undefined keys.
 */
function constantsMap<T extends Record<string, any>>(entries: T): Readonly<T> {
  return new Proxy(entries, {
           get: (target, name: string) => {
             if (name in target) return target[name];
             throw new Error(`Constant "${String(name)}" is not defined.`);
           }
         }) as Readonly<T>;
}

// --- Implementations ---

export const eventIds = createConstants('input');

export const colorIds = createConstants('black', 'cyan', 'white');

// Type safety for the reduced object
const tags = [
  'div', 'form', 'input', 'p', 'span', 'td', 'tr', 'table', 'select', 'option'
] as const;

export const htmlTags = constantsMap(tags.reduce((obj, tag) => {
  obj[tag] = `<${tag}>`;
  return obj;
}, {} as Record<typeof tags[number], string>));

export const htmlProps = createConstants('disabled');
export const htmlInputTypes = createConstants('submit');
export const cssProps = createConstants('display');
export const cssDisplayValues = createConstants('inline', 'none');
export const urlParams = createConstants('row');
