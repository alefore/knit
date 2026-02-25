import {eventIds, htmlTags} from './constants.js';
import {EventListener} from './listener.js';

export class PatternFactoryInput {
  public name: string;
  public tooltip: string;
  public defaultValue: string|number;
  public units: string|null;
  public selectValues: string[]|null;
  public listener: EventListener;
  public tr: HTMLTableRowElement|null;
  public formInput: HTMLInputElement | HTMLSelectElement | null;
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

  setValuesFromHash(parsedHash: URLSearchParams): void {
    const input = this;

    const tr = document.createElement('tr');
    tr.id = 'tr' + this.id();
    input.tr = tr;

    const nameTd = document.createElement('td');
    nameTd.className = 'name';
    nameTd.textContent = this.name;
    tr.appendChild(nameTd);

    const rawValue = parsedHash.get(this.nameCamelCase());
    const defaultValue = rawValue ?? this.defaultValue;

    if (this.selectValues == null) {
      const td = document.createElement('td');
      const inputElement = document.createElement('input');
      inputElement.id = this.id();
      inputElement.title = this.tooltip;
      inputElement.value = String(defaultValue);
      inputElement.size = 4;
      inputElement.addEventListener(eventIds.input, () => input.listener.notify());
      input.formInput = inputElement;
      td.appendChild(inputElement);
      tr.appendChild(td);
    } else {
      const td = document.createElement('td');
      const selectElement = document.createElement('select');
      selectElement.id = this.id();
      this.selectValues.forEach((id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        selectElement.appendChild(option);
      });

      selectElement.value =
          this.selectValues.includes(String(defaultValue)) ?
          String(defaultValue) :
          String(this.defaultValue);
      selectElement.addEventListener(eventIds.input, () => input.listener.notify());
      input.formInput = selectElement;
      td.appendChild(selectElement);
      tr.appendChild(td);
    }

    if (this.units !== null) {
      const unitsTd = document.createElement('td');
      unitsTd.className = 'units';
      unitsTd.textContent = this.units;
      tr.appendChild(unitsTd);
    }
  }

  value(): string | undefined {
    return this.formInput?.value;
  }

  numberValue(): number {
    if (this.formInput) {
      return Number(this.formInput.value);
    }
    return 0;
  }

  hasDefaultValue(): boolean {
    return this.value() == this.defaultValue;
  }

  id(): string {
    return 'patternFactoryInput' + this.nameCamelCase();
  }

  nameCamelCase(): string {
    return this.name.replace(/\s:/g, '');
  }

  addVisibilityRequirement(callback: () => boolean): void {
    this.visibilityRequirements.push(callback);
  }

  adjustVisibility(): void {
    if (!this.tr) return;

    if (this.visibilityRequirements.every((fn) => fn())) {
      this.tr.style.display = '';
    } else {
      this.tr.style.display = 'none';
    }
  }
}

export function drawInputs(
    inputs: PatternFactoryInput[], parsedHash: URLSearchParams|null): void {
  const table = document.createElement('table');
  const form = document.querySelector('#inputs form');
  if (form) {
    form.appendChild(table);
  }

  const actualHash = parsedHash ?? new URLSearchParams();

  inputs.forEach((input) => {
    input.setValuesFromHash(actualHash);
    if (input.tr) {
      table.appendChild(input.tr);
    }
  });
}

export function parseHash(): URLSearchParams {
  const hash = window.location.hash.substring(1);
  return new URLSearchParams(hash);
}
