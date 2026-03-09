export interface KnitPoint {
  x: number;
  y: number;
}

export function flip(p: KnitPoint): KnitPoint {
  return {x: p.y, y: p.x};
}

export function minus(a: KnitPoint, b: KnitPoint): KnitPoint {
  return {x: a.x - b.x, y: a.y - b.y};
}

export function applyZoom(p: KnitPoint, zoom: number): KnitPoint {
  return {x: p.x * zoom, y: p.y * zoom};
}

export function scale(p: KnitPoint, scalar: number): KnitPoint {
  return {x: p.x * scalar, y: p.y * scalar};
}

export function add(a: KnitPoint, b: KnitPoint): KnitPoint {
  return {x: a.x + b.x, y: a.y + b.y};
}
