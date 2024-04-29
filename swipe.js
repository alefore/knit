function positionFromTouch(touch) {
  return {x: touch.clientX, y: touch.clientY};
}

class SwipeHandler {
  constructor(onLeft, onRight) {
    console.log('start');
    this.onLeft = onLeft;
    this.onRight = onRight;
    this.start = null;
    document.addEventListener('touchstart', this.touchStart, false);
    document.addEventListener('touchmove', this.touchMove, false);
  }

  touchStart(event) {
    console.log(event);
    this.start =
        positionFromTouch((event.touches || event.originalEvent.touches)[0]);
  }

  touchMove(event) {
    if (this.start == null) return;
    const release = positionFromTouch(event.touches[0]);

    const ratio = 2.0;  // x-move must exceed y-move by this ratio.
    if (Math.abs(this.start.x - release.x) <
        ratio * Math.abs(this.start.y - release.y))
      return;
    if (release.x > this.start.x)
      this.onLeft();
    else
      this.onRight();
  }
}
