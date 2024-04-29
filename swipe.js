function positionFromTouch(touch) {
  return {x: touch.clientX, y: touch.clientY};
}

class SwipeHandler {
  constructor(onLeft, onRight) {
    this.onLeft = onLeft;
    this.onRight = onRight;
    this.start = null;
    const handler = this;
    document.addEventListener('touchstart', function() {
      handler.touchStart(event);
    }, false);
    document.addEventListener('touchmove', function() {
      handler.touchMove(event);
    }, false);
  }

  touchStart(event) {
    this.start =
        positionFromTouch((event.touches || event.originalEvent.touches)[0]);
  }

  touchMove(event) {
    console.log(this.onLeft);
    if (this.start == null) return;
    const release = positionFromTouch(event.touches[0]);

    const ratio = 2.0;  // x-move must exceed y-move by this ratio.
    if (Math.abs(this.start.x - release.x) <
        ratio * Math.abs(this.start.y - release.y))
      return;

    // We reset `start` to avoid multiple calls for the same swipe; whichever
    // direction triggers first, that's where we stay.
    if (release.x > this.start.x) {
      this.onRight();
      this.start = null;
    } else {
      this.onLeft();
      this.start = null;
    }
  }
}
