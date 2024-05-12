// Computes a point in a cubic bezier.
function cubicBezierPoint(t, p0, p1, p2, p3) {
  if (t < 0 || t > 1) throw new Error(`Invalid value for t: ${t}`);
  const cx = 3 * (p1.x - p0.x);
  const bx = 3 * (p2.x - p1.x) - cx;
  const ax = p3.x - p0.x - cx - bx;

  const cy = 3 * (p1.y - p0.y);
  const by = 3 * (p2.y - p1.y) - cy;
  const ay = p3.y - p0.y - cy - by;

  const x = ax * t * t * t + bx * t * t + cx * t + p0.x;
  const y = ay * t * t * t + by * t * t + cy * t + p0.y;

  return {x: x, y: y};
}

// Fills all indices of array in range [i, n). At index x, stores a valid
// value for y at a value in [x, x+1).
function fillCubicBezierArray(array, i, n, ti, tn, p0, p1, p2, p3) {
  if (i < 0 || i >= array.length)
    throw new Error(
        `Invalid index i for bezier array: ${i} (size: ${array.length})`);
  if (n < 0 || n > array.length)
    throw new Error(`Invalid index n for bezier array: ${n}`);
  const middle = (ti + tn) / 2;
  const newPoint = cubicBezierPoint(middle, p0, p1, p2, p3);
  const newIndex = Math.round(newPoint.x);
  array[Math.floor(newPoint.x)] = Math.round(newPoint.y);
  if (i < newIndex && newIndex < n) {
    fillCubicBezierArray(array, newIndex, n, middle, tn, p0, p1, p2, p3);
    fillCubicBezierArray(array, i, newIndex, ti, middle, p0, p1, p2, p3);
  }
}

function cubicBezierArray(n, p0, p1, p2, p3) {
  const output = Array(n).fill(null);
  fillCubicBezierArray(output, 0, n, 0, 1, p0, p1, p2, p3);
  return output;
}
