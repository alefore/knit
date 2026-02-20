interface Point {
  x: number;
  y: number;
}

function positionFromTouch(touch: Touch): Point {
  return {x: touch.clientX, y: touch.clientY};
}

export class SwipeHandler {
  private onLeft: () => void;
  private onRight: () => void;
  private start: Point | null = null;

  constructor(onLeft: () => void, onRight: () => void) {
    this.onLeft = onLeft;
    this.onRight = onRight;
    document.addEventListener('touchstart', (event: TouchEvent) => {
      this.touchStart(event);
    }, false);
    document.addEventListener('touchmove', (event: TouchEvent) => {
      this.touchMove(event);
    }, false);
  }

  touchStart(event: TouchEvent) {
    const touch = (event.touches || (event as any).originalEvent.touches)[0];
    if (touch) {
      this.start = positionFromTouch(touch);
    }
  }

  touchMove(event: TouchEvent) {
    if (this.start == null) return;
    const touch = event.touches[0];
    if (!touch) return;

    const release = positionFromTouch(touch);

    const ratio = 2.0;
    if (Math.abs(this.start.x - release.x) <
        ratio * Math.abs(this.start.y - release.y))
      return;

    if (release.x > this.start.x) {
      this.onRight();
      this.start = null;
    } else {
      this.onLeft();
      this.start = null;
    }
  }
}