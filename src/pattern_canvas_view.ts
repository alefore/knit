import {CanvasInputHandler} from './canvas_input_handler.js';
import {ControlButton} from './control_button.js';
import {Pattern} from './pattern.js';
import {PatternRenderer} from './pattern_renderer.js';
import type {KnitPoint} from './point.js';
import {flip, minus, scale} from './point.js';

export class PatternCanvasView {
  private canvas: HTMLCanvasElement;
  private currentPattern: Pattern|null;
  private zoomLevel: number;
  private offset: KnitPoint;
  private isFlipped: boolean = false;
  private selectedRow: number = 0;
  private renderer: PatternRenderer;
  private inputHandler: CanvasInputHandler;
  private onRowSelected: (row: number) => void;

  private readonly ZOOM_FACTOR = 1.1;
  private readonly MIN_ZOOM_LEVEL = 0.1;

  constructor(onRowSelected: (row: number) => void) {
    this.canvas = document.createElement('canvas') as HTMLCanvasElement;
    this.canvas.id = 'knitCanvas';
    this.currentPattern = null;
    this.zoomLevel = 1;
    this.offset = {x: 0, y: 0};
    this.selectedRow = 0;
    this.onRowSelected = onRowSelected;  // Assigned here

    this.renderer = new PatternRenderer(this.canvas);
    this.inputHandler = new CanvasInputHandler(this.canvas, {
      onPan: this.handlePan.bind(this),
      onZoom: this.handleZoom.bind(this),
      onClick: this.handleClickOnPattern.bind(this),
      getCurrentCanvasState: this.getCurrentCanvasState.bind(this),
      redraw: () => this.drawPattern(this.currentPattern),
    });

    window.onresize = this.resizeCanvas.bind(this);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getCurrentCanvasState() {
    return {
      zoomLevel: this.zoomLevel,
      offset: this.offset,
      isFlipped: this.isFlipped,
      currentPattern: this.currentPattern,
    };
  }

  public drawPattern(pattern: Pattern|null): void {
    const isNewPattern = this.currentPattern !== pattern;
    this.currentPattern = pattern;
    if (this.currentPattern === null) {
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        this.canvas.width = window.innerWidth;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }

    if (isNewPattern) {
      this.zoomLevel = 1;
      this.offset = {x: 0, y: 0};
      this.isFlipped = false;
      this.centerPattern();
    }

    this.renderer.render(
        this.currentPattern, this.zoomLevel, this.offset, this.isFlipped,
        this.selectedRow);
  }

  public selectRow(pattern: Pattern|null, row: number): void {
    this.currentPattern = pattern;
    this.selectedRow = row;
    this.drawPattern(this.currentPattern);
  }

  public initializeCanvasControls(buttonsForm: HTMLFormElement): void {
    new ControlButton(null, '➕', 'Zoom In', () => this.zoomIn())
        .appendHtml(buttonsForm);

    new ControlButton(null, '➖', 'Zoom Out', () => this.zoomOut())
        .appendHtml(buttonsForm);

    new ControlButton(null, '🔁', 'Flip View', () => this.toggleFlipView())
        .appendHtml(buttonsForm);
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.centerPattern();
    this.drawPattern(this.currentPattern);
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
        this.renderer.getPatternDimensions(this.currentPattern);

    let effectivePatternSizePixels =
        scale(unflippedPatternSizeStitches, stitchSizeAtZoom1 * this.zoomLevel);

    if (this.isFlipped) {
      effectivePatternSizePixels = flip(effectivePatternSizePixels);
    }

    this.offset.x = (this.canvas.width - effectivePatternSizePixels.x) / 2;
    this.offset.y = (this.canvas.height - effectivePatternSizePixels.y) / 2;
  }

  private handlePan(delta: KnitPoint): void {
    this.offset.x += delta.x;
    this.offset.y += delta.y;
    this.drawPattern(this.currentPattern);
  }

  private handleZoom(scaleAmount: number, mouseCanvasCoords: KnitPoint): void {
    const oldZoom = this.zoomLevel;
    this.zoomLevel *= (1 + scaleAmount);
    if (this.zoomLevel < this.MIN_ZOOM_LEVEL)
      this.zoomLevel = this.MIN_ZOOM_LEVEL;

    const transformedMouse = this.getTransformedCoordinates(mouseCanvasCoords);

    this.offset.x -=
        (transformedMouse.x * oldZoom + this.offset.x - mouseCanvasCoords.x) *
        (this.zoomLevel / oldZoom - 1);
    this.offset.y -=
        (transformedMouse.y * oldZoom + this.offset.y - mouseCanvasCoords.y) *
        (this.zoomLevel / oldZoom - 1);

    this.drawPattern(this.currentPattern);
  }

  private handleClickOnPattern(patternCoords: KnitPoint): void {
    if (this.currentPattern === null) {
      return;
    }
    const {stitchSizeAtZoom1} =
        this.renderer.getPatternDimensions(this.currentPattern);

    const rowIndex = Math.floor(patternCoords.x / stitchSizeAtZoom1);
    if (rowIndex >= 0 && rowIndex < this.currentPattern.rows.length) {
      this.onRowSelected(rowIndex);
      this.selectRow(this.currentPattern, rowIndex);
    }
  }

  private getTransformedCoordinates(canvas: KnitPoint): KnitPoint {
    if (this.currentPattern === null) {
      return canvas;
    }
    const base = scale(minus(canvas, this.offset), 1 / this.zoomLevel);
    return this.isFlipped ? flip(base) : base;
  }
}
