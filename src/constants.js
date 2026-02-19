export function createConstants(...keys) {
  const constants = keys.reduce((obj, key) => {
    obj[key] = key;
    return obj;
  }, {});
  return new Proxy(constants, {
    get: (target, name) => {
      if (name in target)
        return target[name];
      else
        throw new Error(`Constant "${String(name)}" is not defined.`);
    }
  });
}

function constantsMap(entries = {}) {
  return new Proxy(entries, {
    get: (target, name) => {
      if (name in target)
        return target[name];
      else
        throw new Error(`Constant "${String(name)}" is not defined.`);
    }
  });
}

export const eventIds = createConstants('input');

export const colorIds = createConstants('black', 'cyan', 'white');

export const htmlTags = constantsMap([
  'div', 'form', 'input', 'p', 'span', 'td', 'tr', 'table', 'select', 'option'
].reduce(function(obj, tag) {
  obj[tag] = `<${tag}>`;
  return obj;
}, {}));

export const htmlProps = createConstants('disabled');
export const htmlInputTypes = createConstants('submit');
export const cssProps = createConstants('display');
export const cssDisplayValues = createConstants('inline', 'none');
export const urlParams = createConstants('row');
