export const eventIds = {
  input: 'input',
} as const;

export const colorIds = {
  black: 'black',
  cyan: 'cyan',
  white: 'white',
} as const;

export const htmlProps = {
  disabled: 'disabled',
} as const;

export const htmlInputTypes = {
  submit: 'submit',
} as const;

export const cssProps = {
  display: 'display',
} as const;

export const cssDisplayValues = {
  inline: 'inline',
  none: 'none',
} as const;

export const urlParams = {
  row: 'row',
} as const;

const tags = [
  'div', 'form', 'input', 'p', 'span', 'td', 'tr', 'table', 'select', 'option', 'canvas'
] as const;

export const htmlTags = tags.reduce((obj, tag) => {
  return { ...obj, [tag]: `<${tag}>` };
}, {} as { [K in typeof tags[number]]: string }) as { [K in typeof tags[number]]: string };
