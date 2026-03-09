import {colorIds} from './constants.js';
import {Pattern, RowSwitchStyles} from './pattern.js';
import type {KnitPoint} from './point.js';
import {flip, scale} from './point.js';

export class PatternRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D rendering context for canvas.');
    }
    this.ctx = ctx;
  }

  public getPatternDimensions(pattern: Pattern) {
    const unflippedPatternSizeStitches = {
      x: pattern.rowsCount(),
      y: Math.max(...pattern.rows.map(row => row.outputStitches))
    };

    const baseStitchSizeWidth =
        this.canvas.width / unflippedPatternSizeStitches.x;
    const baseStitchSizeHeight =
        this.canvas.height / unflippedPatternSizeStitches.y;
    const stitchSizeAtZoom1 =
        Math.min(baseStitchSizeWidth, baseStitchSizeHeight);
    const unflippedPatternSizePixels =
        scale(unflippedPatternSizeStitches, stitchSizeAtZoom1);

    return {
      unflippedPatternSizeStitches,
      unflippedPatternSizePixels,
      baseStitchSizeWidth,
      baseStitchSizeHeight,
      stitchSizeAtZoom1,
    };
  }

  public render(
      pattern: Pattern, zoomLevel: number, offset: KnitPoint,
      isFlipped: boolean, selectedRow: number): void {
    this.canvas.width = window.innerWidth;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (pattern === null) {
      return;
    }

    const {
      unflippedPatternSizeStitches,
      stitchSizeAtZoom1,
    } = this.getPatternDimensions(pattern);

    this.ctx.save();
    this.ctx.translate(offset.x, offset.y);
    this.ctx.scale(zoomLevel, zoomLevel);
    pattern.forEachRow((row, rowIndex) => {
      let stitchIndex = 0;
      const rowOutputStitches = row.outputStitches;
      const isRoundOrEvenRow =
          pattern.rowSwitchStyle === RowSwitchStyles.round ||
          rowIndex % 2 === 0;
      row.flatten().forEach((stitch) => {
        if (rowIndex === selectedRow) {
          this.ctx.fillStyle = colorIds.cyan;
        } else {
          this.ctx.fillStyle =
              isRoundOrEvenRow ? stitch.color : this.#invertColor(stitch.color);
        }

        for (let s = 0; s < stitch.outputStitches; s++) {
          const unflipped = {
            x: rowIndex,
            y: (unflippedPatternSizeStitches.y - 1) -
                (isRoundOrEvenRow ? rowOutputStitches - stitchIndex - 1 :
                                    stitchIndex)
          };

          const flipped = {
            x: isRoundOrEvenRow ? rowOutputStitches - stitchIndex - 1 :
                                  stitchIndex,
            y: rowIndex
          };
          const final =
              scale(isFlipped ? flipped : unflipped, stitchSizeAtZoom1);
          this.ctx.fillRect(
              final.x, final.y, stitchSizeAtZoom1, stitchSizeAtZoom1);
          stitchIndex++;
        }
      });
    });
    this.ctx.restore();
  }

  #invertColor(color: string): string {
    if (color === colorIds.black) return colorIds.white;
    if (color === colorIds.white) return colorIds.black;
    return color;
  }
}
