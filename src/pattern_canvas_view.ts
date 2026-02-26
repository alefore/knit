import { colorIds } from './constants.js';
import { Pattern, RowSwitchStyles } from './pattern.js';

export class PatternCanvasView {
  private canvas: HTMLCanvasElement;
  private currentPattern: Pattern | null;

  constructor() {
    this.canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.canvas.id = 'knitCanvas';
    this.currentPattern = null;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public drawPattern(pattern: Pattern | null, currentRow: number): void {
    this.currentPattern = pattern;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentPattern === null) {
        return;
    }

    this.canvas.width = window.innerWidth;
    this.canvas.height = 150;

    const maxStitches = Math.max(...this.currentPattern.rows.map(row => row.outputStitches));

    const stitchSizeWidth = this.canvas.width / this.currentPattern.rowsCount();
    const stitchSizeHeight = this.canvas.height / maxStitches;
    const stitchSize = Math.min(stitchSizeWidth, stitchSizeHeight);

    this.currentPattern.forEachRow((row, rowIndex) => {
      let stitchIndex = 0;
      const rowOutputStitches = row.outputStitches;
      const isRoundOrEvenRow = this.currentPattern!.rowSwitchStyle === RowSwitchStyles.round || rowIndex % 2 === 0;

      row.flatten().forEach((stitch) => {
        if (rowIndex === currentRow) {
          ctx.fillStyle = colorIds.cyan;
        } else {
          ctx.fillStyle =
            isRoundOrEvenRow
              ? stitch.color
              : this.#invertColor(stitch.color);
        }

        for (let s = 0; s < stitch.outputStitches; s++) {
          const x = rowIndex * stitchSize;
          const y =
            stitchSize *
            (maxStitches -
              (isRoundOrEvenRow
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
