import {Pattern} from './pattern.js';  // Added import for Pattern
import {PatternRenderer} from './pattern_renderer.js';
import type {KnitPoint} from './point.js';
import {flip, minus, scale} from './point.js';

interface CanvasInputHandlerDelegate {
  onPan(delta: KnitPoint): void;
  onZoom(zoomFactor: number, mouseCanvasCoords: KnitPoint): void;
  onClick(patternCoords: KnitPoint): void;
  getCurrentCanvasState(): {
    zoomLevel: number,
    offset: KnitPoint,
    isFlipped: boolean,
    currentPattern: Pattern|null,
  };
  redraw(): void;
}

export class CanvasInputHandler {
  private canvas: HTMLCanvasElement;
  private delegate: CanvasInputHandlerDelegate;

  private isDragging: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private isClick: boolean = true;

  private readonly DRAG_THRESHOLD = 2;

  constructor(canvas: HTMLCanvasElement, delegate: CanvasInputHandlerDelegate) {
    this.canvas = canvas;
    this.delegate = delegate;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
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

  private getTransformedCoordinates(canvas: KnitPoint): KnitPoint {
    const {currentPattern, offset, zoomLevel, isFlipped} =
        this.delegate.getCurrentCanvasState();
    if (currentPattern === null) {
      return canvas;
    }
    const base = scale(minus(canvas, offset), 1 / zoomLevel);
    return isFlipped ? flip(base) : base;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const scaleAmount = -event.deltaY * 0.001;
    this.delegate.onZoom(
        scaleAmount,
        this.getClickCoordinates({x: event.clientX, y: event.clientY}));
  }

  private handleMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.isClick = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
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

      this.delegate.onPan(delta);
      this.lastX = event.clientX;
      this.lastY = event.clientY;
      this.delegate.redraw();
    }
  }

  private handleMouseUp(): void {
    this.isDragging = false;
  }

  private handleClick(event: MouseEvent): void {
    const {currentPattern} = this.delegate.getCurrentCanvasState();
    if (currentPattern === null || !this.isClick) {
      return;
    }

    const patternCoords = this.getTransformedCoordinates(
        this.getClickCoordinates({x: event.clientX, y: event.clientY}));
    this.delegate.onClick(patternCoords);
  }
}
