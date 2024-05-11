function createConstants(...keys) {
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

const eventIds = createConstants('input');

const colorIds = createConstants('black', 'white');

const htmlTags = constantsMap([
  'div', 'form', 'input', 'p', 'td', 'tr', 'table', 'select', 'option'
].reduce(function(obj, tag) {
  obj[tag] = `<${tag}>`;
  return obj;
}, {}));

const htmlProps = createConstants('disabled');
const htmlInputTypes = createConstants('submit');
const cssProps = createConstants('display');
const cssDisplayValues = createConstants('inline', 'none');
