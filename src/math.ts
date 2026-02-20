// Computes a point in a cubic bezier.
function cubicBezierPoint(t: number, p0: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}): {x: number, y: number} {
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

export function cubicBezierArray(n: number, p0: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}): number[] {
  const output: number[] = Array(n).fill(0);

  if (n === 0) return [];
  if (n === 1) return [Math.round(p0.y)];

  const sampleCount = n * 10; 
  for (let i = 0; i <= sampleCount; i++) {
    const t = i / sampleCount;
    const point = cubicBezierPoint(t, p0, p1, p2, p3);
    const xIndex = Math.floor(point.x);
    if (xIndex >= 0 && xIndex < n) {
      output[xIndex] = Math.round(point.y);
    }
  }

  let prevY: number = Math.round(p0.y); 
  let prevX: number = 0;

  for (let i = 0; i < n; i++) {
    const currentOutputValue: number = output[i] as number; // Type assertion
    if (currentOutputValue === 0) { 
      let nextY: number = prevY; 
      let nextX: number = i;

      for (let j = i + 1; j < n; j++) {
        const nextOutputValue: number = output[j] as number; // Type assertion
        if (nextOutputValue !== 0) {
          nextY = nextOutputValue;
          nextX = j;
          break;
        }
      }

      if (nextX === i) { 
        output[i] = prevY;
      } else {
        output[i] = Math.round(prevY + (nextY - prevY) * (i - prevX) / (nextX - prevX));
      }
    } else { 
      prevY = currentOutputValue;
      prevX = i;
    }
  }
  return output;
}
