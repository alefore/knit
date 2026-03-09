export interface Point {
  x: number;
  y: number;
}

export function flip(p: Point): Point {
  return {x: p.y, y: p.x};
}

export function minus(a: Point, b: Point): Point {
  return {x: a.x - b.x, y: a.y - b.y};
}

export function applyZoom(p: Point, zoom: number): Point {
  return {x: p.x * zoom, y: p.y * zoom};
}
