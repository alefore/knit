import {colorIds} from './constants.js';
import {ControlButton} from './control_button.js';
import {Pattern, RowSwitchStyles} from './pattern.js';

export class PatternCanvasView {
  private canvas: HTMLCanvasElement;
  private currentPattern: Pattern|null;
  private zoomLevel: number;  // Current zoom level of the canvas.
  private offsetX: number;    // X-offset for panning the canvas.
  private offsetY: number;    // Y-offset for panning the canvas.
  private isDragging:
      boolean;            // True if the canvas is currently being dragged.
  private lastX: number;  // Last X-coordinate of the mouse during a drag event.
  private lastY: number;  // Last Y-coordinate of the mouse during a drag event.
  // Callback function invoked when a row is selected within the canvas.
  private onRowSelected: (row: number) => void;
  private isClick: boolean;  // True if the current mouse interaction is
                             // considered a click (not a drag).

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
    this.offsetX = 0;
    this.offsetY = 0;
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

  public drawPattern(pattern: Pattern|null, currentRow: number): void {
    this.currentPattern = pattern;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas width dynamically, but height is now handled by CSS.
    this.canvas.width = window.innerWidth;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.currentPattern === null) {
      return;
    }

    const maxStitches =
        Math.max(...this.currentPattern.rows.map(row => row.outputStitches));

    const baseStitchSizeWidth =
        this.canvas.width / this.currentPattern.rowsCount();
    const baseStitchSizeHeight = this.canvas.height / maxStitches;

    const stitchSize =
        Math.min(baseStitchSizeWidth, baseStitchSizeHeight) * this.zoomLevel;

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);

    this.currentPattern.forEachRow((row, rowIndex) => {
      let stitchIndex = 0;
      const rowOutputStitches = row.outputStitches;
      const isRoundOrEvenRow =
          this.currentPattern!.rowSwitchStyle === RowSwitchStyles.round ||
          rowIndex % 2 === 0;

      row.flatten().forEach((stitch) => {
        if (rowIndex === currentRow) {
          ctx.fillStyle = colorIds.cyan;
        } else {
          ctx.fillStyle =
              isRoundOrEvenRow ? stitch.color : this.#invertColor(stitch.color);
        }

        for (let s = 0; s < stitch.outputStitches; s++) {
          const x = rowIndex * stitchSize;
          const y = stitchSize *
              (maxStitches -
               (isRoundOrEvenRow ? rowOutputStitches - stitchIndex :
                                   stitchIndex + 1));

          ctx.fillRect(x, y, stitchSize, stitchSize);
          stitchIndex++;
        }
      });
    });
    ctx.restore();
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
  }

  private zoomIn(): void {
    this.zoomLevel *= this.ZOOM_FACTOR;
    this.drawPattern(this.currentPattern, 0);
  }

  private zoomOut(): void {
    this.zoomLevel /= this.ZOOM_FACTOR;
    if (this.zoomLevel < this.MIN_ZOOM_LEVEL)
      this.zoomLevel = this.MIN_ZOOM_LEVEL;
    this.drawPattern(this.currentPattern, 0);
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const scaleAmount = -event.deltaY * 0.001;
    const oldZoom = this.zoomLevel;
    this.zoomLevel *= (1 + scaleAmount);
    if (this.zoomLevel < this.MIN_ZOOM_LEVEL)
      this.zoomLevel = this.MIN_ZOOM_LEVEL;

    // Adjust offsetX and offsetY to zoom towards the cursor
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    this.offsetX -= (mouseX - this.offsetX) * (this.zoomLevel / oldZoom - 1);
    this.offsetY -= (mouseY - this.offsetY) * (this.zoomLevel / oldZoom - 1);

    this.drawPattern(this.currentPattern, 0);
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.isClick = true;  // Assume it's a click initially
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const deltaX = event.clientX - this.lastX;
      const deltaY = event.clientY - this.lastY;
      if (Math.abs(deltaX) > this.DRAG_THRESHOLD ||
          Math.abs(deltaY) > this.DRAG_THRESHOLD) {
        this.isClick = false;
      }
      this.offsetX += deltaX;
      this.offsetY += deltaY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.drawPattern(this.currentPattern, 0);
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private handleClick(event: MouseEvent): void {
    if (this.currentPattern === null || !this.isClick) {
      return;
    }
    const currentPattern = this.currentPattern;

    const rect = this.canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const transformedX = (clickX - this.offsetX) / this.zoomLevel;

    const maxStitches =
        Math.max(...currentPattern.rows.map(row => row.outputStitches));
    const baseStitchSizeWidth = this.canvas.width / currentPattern.rowsCount();
    const baseStitchSizeHeight = this.canvas.height / maxStitches;
    const stitchSize = Math.min(baseStitchSizeWidth, baseStitchSizeHeight);

    const rowIndex = Math.floor(transformedX / stitchSize);

    if (rowIndex >= 0 && rowIndex < currentPattern.rows.length) {
      this.onRowSelected(rowIndex);
    }
  }

  #invertColor(color: string): string {
    if (color === colorIds.black) return colorIds.white;
    if (color === colorIds.white) return colorIds.black;
    return color;
  }
}
