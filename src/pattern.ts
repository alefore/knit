import { colorIds } from './constants.js';
import { Stitch } from './stitch.js';
import { Row } from './row.js';
import { PatternFactoryInput } from './inputs.js';

// Define the switch styles as a const object for type safety
export const RowSwitchStyles = {
  round: 'round',
  backAndForth: 'backAndForth',
} as const;

export type RowSwitchStyle = typeof RowSwitchStyles[keyof typeof RowSwitchStyles];

export interface PatternFactory {
  factoryName: string;
  getInputs(): PatternFactoryInput[];
  build(): Pattern;
}

export class Pattern {
  public rows: Row[];
  public rowSwitchStyle: RowSwitchStyle;

  constructor() {
    this.rows = [];
    this.rowSwitchStyle = RowSwitchStyles.backAndForth;
  }

  public setRound(): this {
    this.rowSwitchStyle = RowSwitchStyles.round;
    return this;
  }

  public rowsCount(): number {
    return this.rows.length;
  }

  public lastRow(): Row {
    const last = this.rows.at(-1);
    if (!last) {
      throw new Error('Called lastRow on empty pattern.');
    }
    return last;
  }

  public get outputStitches(): number {
    return this.rows.reduce((total, row) => total + row.outputStitches, 0);
  }

  public isEmpty(): boolean {
    return this.rowsCount() === 0;
  }

  public get showRowDirection(): boolean {
    return this.rowSwitchStyle === RowSwitchStyles.backAndForth;
  }

  public addRow(row: Row): void {
    this.rows.push(row);
  }

  public forEachRow(func: (row: Row, index: number) => void): void {
    this.rows.forEach(func);
  }
}
