import { colorIds, createConstants } from './constants.js';
import { Stitch } from './stitch.js';
import { Row } from './row.js';

// Define the switch styles as a const object for type safety
const RowSwitchStyles = createConstants('round', 'backAndForth') as {
  readonly round: string;
  readonly backAndForth: string;
};

export class Pattern {
  public static readonly rowSwitchStyles = RowSwitchStyles;

  private rows: Row[];
  private rowSwitchStyle: string;

  constructor() {
    this.rows = [];
    this.rowSwitchStyle = Pattern.rowSwitchStyles.backAndForth;
  }

  public setRound(): this {
    this.rowSwitchStyle = Pattern.rowSwitchStyles.round;
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
    return this.rowSwitchStyle === Pattern.rowSwitchStyles.backAndForth;
  }

  public addRow(row: Row): void {
    this.rows.push(row);
  }

  public forEachRow(func: (row: Row, index: number) => void): void {
    this.rows.forEach(func);
  }

  public drawToCanvas(canvas: HTMLCanvasElement, currentRow: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = 150;

    const maxStitches = Math.max(...this.rows.map(row => row.outputStitches));

    const stitchSizeWidth = canvas.width / this.rowsCount();
    const stitchSizeHeight = canvas.height / maxStitches;
    const stitchSize = Math.min(stitchSizeWidth, stitchSizeHeight);

    this.forEachRow((row, rowIndex) => {
      let stitchIndex = 0;
      const rowOutputStitches = row.outputStitches;

      row.flatten().forEach((stitch) => {
        if (rowIndex === currentRow) {
          ctx.fillStyle = colorIds.cyan;
        } else {
          ctx.fillStyle =
            this.rowSwitchStyle === Pattern.rowSwitchStyles.round ||
            rowIndex % 2 === 0
              ? stitch.color
              : this.#invertColor(stitch.color);
        }

        for (let s = 0; s < stitch.outputStitches; s++) {
          const x = rowIndex * stitchSize;
          const y =
            stitchSize *
            (maxStitches -
              (this.rowSwitchStyle === Pattern.rowSwitchStyles.round ||
              rowIndex % 2 === 0
                ? rowOutputStitches - stitchIndex
                : stitchIndex + 1));
          
          ctx.fillRect(x, y, stitchSize, stitchSize);
          stitchIndex++;
        }
      });
    });
  }

  #invertColor(color: string): string {
    if (color === colorIds.black) return colorIds.white;
    if (color === colorIds.white) return colorIds.black;
    return color;
  }
}
