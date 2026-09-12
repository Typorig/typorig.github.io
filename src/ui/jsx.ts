/**
 * Mini JSX Runtime thuần - Zero-dependency
 * Chuyển đổi thẻ JSX thành Real DOM Node (HTMLElement / SVGElement / DocumentFragment)
 */

type Child = Node | string | number | boolean | null | undefined | Child[];

export type ComponentFunction<P = Record<string, unknown>> = (props: P, ...children: Node[]) => Node;

const SVG_TAGS = new Set([
  "svg", "path", "circle", "rect", "line", "polyline", "polygon", "g", "defs", "use", "mask"
]);

export function h(
  tag: string | ComponentFunction<any> | typeof Fragment,
  props: Record<string, any> | null,
  ...children: Child[]
): Node {
  // Fragment
  if (tag === Fragment) {
    return Fragment({ ...(props || {}), children: flatten(children) });
  }

  // Component function
  if (typeof tag === "function") {
    return tag({ ...(props || {}), children: flatten(children) });
  }

  // SVG or HTML Element
  const isSvg = SVG_TAGS.has(tag.toLowerCase());
  const el = isSvg
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag);

  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || key === "children") continue;

      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, value);
      } else if (key === "className" || key === "class") {
        if (isSvg) {
          el.setAttribute("class", String(value));
        } else {
          (el as HTMLElement).className = String(value);
        }
      } else if (key === "style" && typeof value === "object") {
        Object.assign((el as HTMLElement).style, value);
      } else if (key === "style" && typeof value === "string") {
        el.setAttribute("style", value);
      } else if (typeof value === "boolean") {
        if (value) {
          el.setAttribute(key, "");
        }
      } else if (key === "innerHTML" && typeof value === "string") {
        (el as HTMLElement).innerHTML = value;
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }

  appendChildren(el, children);
  return el;
}

export function Fragment(props: { children?: Child[] }): DocumentFragment {
  const frag = document.createDocumentFragment();
  if (props && props.children) {
    appendChildren(frag, props.children);
  }
  return frag;
}

function appendChildren(parent: Node, children: Child[]): void {
  for (const child of flatten(children)) {
    if (child === null || child === undefined || typeof child === "boolean") {
      continue;
    }
    if (child instanceof Node) {
      parent.appendChild(child);
    } else {
      parent.appendChild(document.createTextNode(String(child)));
    }
  }
}

function flatten(arr: Child[]): (Node | string | number)[] {
  const result: (Node | string | number)[] = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flatten(item));
    } else if (item !== null && item !== undefined && typeof item !== "boolean") {
      result.push(item);
    }
  }
  return result;
}

// Global JSX namespace typing cho TypeScript
declare global {
  namespace JSX {
    interface Element extends HTMLElement {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
