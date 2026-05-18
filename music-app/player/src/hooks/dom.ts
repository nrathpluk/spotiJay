export function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

export function optionalById<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function svgById(id: string): SVGElement {
  const element = document.getElementById(id);
  if (!(element instanceof SVGElement)) throw new Error(`Missing SVG element #${id}`);
  return element;
}
