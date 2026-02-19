import {eventIds, htmlTags} from './constants.js';
import {EventListener} from './listener.js';

// Define the shape of the hash parameters
interface HashParams {
  [key: string]: string;
}

export class PatternFactoryInput {
  public name: string;
  public tooltip: string;
  public defaultValue: string|number;
  public units: string|null;
  public selectValues: string[]|null;
  public listener: EventListener;
  public tr: JQuery<HTMLElement>|null;
  public formInput: any;  // Context-dependent
  private visibilityRequirements: (() => boolean)[];

  constructor(
      name: string, tooltip: string, defaultValue: string|number,
      units: string|null = null, selectValues: string[]|null = null) {
    this.name = name;
    this.tooltip = tooltip;
    this.defaultValue = defaultValue;
    this.units = units;
    this.formInput = null;
    this.selectValues = selectValues;
    this.listener = new EventListener();
    this.tr = null;
    this.visibilityRequirements = [];
  }

  setValuesFromHash(parsedHash: HashParams): void {
    const input = this;

    // Create the table row using jQuery and constants
    input.tr = $(htmlTags.tr, {
                 id: 'tr' + this.id()
               }).append($(htmlTags.td, {class: 'name'}).text(this.name));

    const rawValue = parsedHash[this.nameCamelCase()];
    const defaultValue = rawValue ?? this.defaultValue;

    if (this.selectValues == null) {
      input.tr.append(
          $(htmlTags.td)
              .append($(htmlTags.input, {
                        id: this.id(),
                        title: this.tooltip,
                        value: defaultValue,
                        size: 4
                      }).on(eventIds.input, () => input.listener.notify())));
    } else {
      const select = $(htmlTags.select, {id: this.id()});
      this.selectValues.forEach((id) => {
        select.append($(htmlTags.option, {value: id}).text(id));
      });

      input.tr.append(
          $(htmlTags.td)
              .append(select
                          .val(
                              this.selectValues.includes(String(defaultValue)) ?
                                  defaultValue :
                                  this.defaultValue)
                          .on(eventIds.input, () => input.listener.notify())));
    }

    if (this.units !== null) {
      input.tr.append($(htmlTags.td, {class: 'units'}).text(this.units));
    }
  }

  value(): string|number|string[]|undefined {
    return $('#' + this.id()).val();
  }

  numberValue(): number {
    return Number(this.value());
  }

  hasDefaultValue(): boolean {
    return this.value() == this.defaultValue;
  }

  id(): string {
    return 'patternFactoryInput' + this.nameCamelCase();
  }

  nameCamelCase(): string {
    return this.name.replace(/[\s:]+/g, '');
  }

  addVisibilityRequirement(callback: () => boolean): void {
    this.visibilityRequirements.push(callback);
  }

  adjustVisibility(): void {
    if (!this.tr) return;

    if (this.visibilityRequirements.every((fn) => fn())) {
      this.tr.show();
    } else {
      this.tr.hide();
    }
  }
}

export function drawInputs(
    inputs: PatternFactoryInput[], parsedHash: HashParams|null): void {
  const table = $(htmlTags.table).appendTo('#inputs form');
  const actualHash = parsedHash ?? {};

  inputs.forEach((input) => {
    input.setValuesFromHash(actualHash);
    if (input.tr) {
      table.append(input.tr);
    }
  });
}

export function parseHash(): HashParams {
  const hash = window.location.hash.substring(1);
  const params: HashParams = {};
  if (!hash) return params;

  hash.split('&').forEach(part => {
    const item = part.split('=');
    if (item[0]) {
      params[item[0]] = decodeURIComponent(item[1] || '');
    }
  });
  return params;
}
