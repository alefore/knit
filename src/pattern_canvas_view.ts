import {colorIds} from './constants.js';
import {ControlButton} from './control_button.js';
import {Pattern, RowSwitchStyles} from './pattern.js';
import type {KnitPoint} from './point.js'; // Added import
import {flip, minus, scale} from './point.js'; // Added import

export class PatternCanvasView {
  private canvas: HTMLCanvasElement;
  private currentPattern: Pattern|null;
  private zoomLevel: number;    // Current zoom level of the canvas.
  private offset: KnitPoint;        // Offset for panning the canvas.
  private isDragging: boolean;  // True if the canvas is being dragged.
  private lastX: number;  // Last X-coordinate of the mouse during a drag event.
  private lastY: number;  // Last Y-coordinate of the mouse during a drag event.
  // Callback function invoked when a row is selected within the canvas.
  private onRowSelected: (row: number) => void;
  private isClick: boolean;  // True if the current mouse interaction is
                             // considered a click (not a drag).
  private isFlipped: boolean =
      false;                        // True if the canvas is flipped 90 degrees.
  private selectedRow: number = 0;  // Stores the currently selected row.

  private readonly ZOOM_FACTOR = 1.1;
  private readonly MIN_ZOOM_LEVEL = 0.1;
  private readonly DRAG_THRESHOLD =
      2;  // Pixels a mouse can move before it's considered a drag, not a click.

  constructor(onRowSelected: (row: number) => void) {
    this.canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.canvas.id = 'knitCanvas';
    // Removed hardcoded styling: position, top, and height will be managed by
    // CSS.
    this.currentPattern = null;
    this.zoomLevel = 1;
    this.offset = {x: 0, y: 0};
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.onRowSelected = onRowSelected;
    this.isClick = true;

    this.setupEventListeners();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private _getPatternDimensions() {
    if (this.currentPattern === null) {
      throw new Error('No pattern to calculate dimensions for.');
    }

    const unflippedPatternSizeStitches = {
      x: this.currentPattern.rowsCount(),
      y: Math.max(...this.currentPattern.rows.map(row => row.outputStitches))
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

  public drawPattern(pattern: Pattern|null): void {
    this.currentPattern = pattern;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas width dynamically, but height is now handled by CSS.
    this.canvas.width = window.innerWidth;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentPattern === null) {
      return;
    }

    const {
      unflippedPatternSizeStitches,
      stitchSizeAtZoom1,
      unflippedPatternSizePixels
    } = this._getPatternDimensions();

    ctx.save();
    ctx.translate(this.offset.x, this.offset.y);
    ctx.scale(this.zoomLevel, this.zoomLevel);
    this.currentPattern.forEachRow((row, rowIndex) => {
      let stitchIndex = 0;
      const rowOutputStitches = row.outputStitches;
      const isRoundOrEvenRow =
          this.currentPattern!.rowSwitchStyle === RowSwitchStyles.round ||
          rowIndex % 2 === 0;
      row.flatten().forEach((stitch) => {
        if (rowIndex === this.selectedRow) {
          ctx.fillStyle = colorIds.cyan;
        } else {
          ctx.fillStyle =
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
          const final = scale(
              this.isFlipped ? flipped : unflipped, stitchSizeAtZoom1);
          ctx.fillRect(final.x, final.y, stitchSizeAtZoom1, stitchSizeAtZoom1);
          stitchIndex++;
        }
      });
    });
    ctx.restore();
  }

  public selectRow(pattern: Pattern|null, row: number): void {
    this.currentPattern = pattern;  // Update currentPattern
    this.selectedRow = row;
    this.drawPattern(this.currentPattern);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
  }

  public initializeCanvasControls(buttonsForm: HTMLFormElement): void {
    new ControlButton(null, '➕', 'Zoom In', () => this.zoomIn())
        .appendHtml(buttonsForm);

    new ControlButton(null, '➖', 'Zoom Out', () => this.zoomOut())
        .appendHtml(buttonsForm);

    new ControlButton(null, '🔁', 'Flip View', () => this.toggleFlipView())
        .appendHtml(buttonsForm);
  }

  private zoomIn(): void {
    this.zoomLevel *= this.ZOOM_FACTOR;
    this.drawPattern(this.currentPattern);
  }

  private zoomOut(): void {
    this.zoomLevel /= this.ZOOM_FACTOR;
    if (this.zoomLevel < this.MIN_ZOOM_LEVEL)
      this.zoomLevel = this.MIN_ZOOM_LEVEL;
    this.drawPattern(this.currentPattern);
  }

  private toggleFlipView(): void {
    this.isFlipped = !this.isFlipped;
    this.zoomLevel = 1;
    this.centerPattern();
    this.drawPattern(this.currentPattern);
  }

  private centerPattern(): void {
    if (this.currentPattern === null) {
      return;
    }

    const {unflippedPatternSizeStitches, stitchSizeAtZoom1} =
        this._getPatternDimensions();

    let effectivePatternSizePixels = scale(
        unflippedPatternSizeStitches, stitchSizeAtZoom1 * this.zoomLevel);

    if (this.isFlipped) {
      effectivePatternSizePixels = flip(effectivePatternSizePixels);
    }

    // Calculate offsets to center the *effective* pattern on the canvas
    this.offset.x = (this.canvas.width - effectivePatternSizePixels.x) / 2;
    this.offset.y = (this.canvas.height - effectivePatternSizePixels.y) / 2;
  }

  private getTransformedCoordinates(canvas: KnitPoint): KnitPoint {
    if (this.currentPattern === null) {
      return canvas;
    }
    // Coordinates relative to start of pattern (removing zoom level and
    // offset).
    const base = scale(minus(canvas, this.offset), 1 / this.zoomLevel);
    return this.isFlipped ? flip(base) : base;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const scaleAmount = -event.deltaY * 0.001;
    const oldZoom = this.zoomLevel;
    this.zoomLevel *= (1 + scaleAmount);
    if (this.zoomLevel < this.MIN_ZOOM_LEVEL)
      this.zoomLevel = this.MIN_ZOOM_LEVEL;

    const mouse = this.getClickCoordinates({
      x: event.clientX,
      y: event.clientY
    });
    const transformedMouse = this.getTransformedCoordinates(mouse);

    // Now adjust the offset.x and offset.y for the unflipped pattern's origin.
    this.offset.x -= (transformedMouse.x * oldZoom + this.offset.x - mouse.x) *
        (this.zoomLevel / oldZoom - 1);
    this.offset.y -= (transformedMouse.y * oldZoom + this.offset.y - mouse.y) *
        (this.zoomLevel / oldZoom - 1);

    this.drawPattern(this.currentPattern);
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.isClick = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  private getClickCoordinates(point: KnitPoint): KnitPoint {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (point.x - rect.left) * scaleX,
      y: (point.y - rect.top) * scaleY
    };
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const delta = {
        x: event.clientX - this.lastX,
        y: event.clientY - this.lastY
      };
      if (Math.abs(delta.x) > this.DRAG_THRESHOLD ||
          Math.abs(delta.y) > this.DRAG_THRESHOLD) {
        this.isClick = false;
      }

      this.offset.x += delta.x;
      this.offset.y += delta.y;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.drawPattern(this.currentPattern);
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private handleClick(event: MouseEvent): void {
    if (this.currentPattern === null || !this.isClick) {
      return;
    }

    const {stitchSizeAtZoom1} = this._getPatternDimensions();
    const xCoordinate =
        this.getTransformedCoordinates(this.getClickCoordinates({
          x: event.clientX,
          y: event.clientY
        })).x;
    const rowIndex = Math.floor(xCoordinate / stitchSizeAtZoom1);
    if (rowIndex >= 0 && rowIndex < this.currentPattern.rows.length) {
      this.onRowSelected(rowIndex);
      this.selectRow(
          this.currentPattern,
          rowIndex);  // Update the selected row and redraw.
    }
  }

  #invertColor(color: string): string {
    if (color === colorIds.black) return colorIds.white;
    if (color === colorIds.white) return colorIds.black;
    return color;
  }
}
