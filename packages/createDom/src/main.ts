import type * as CSS from "csstype";

export namespace CreateDom {
  export type ElementTag = keyof HTMLElementTagNameMap;
  export type LiteElement<T extends ElementTag = ElementTag> = {
    type: T;
    props: {
      style?: string | CSS.Properties;
      ref?: ((el: HTMLElement) => void) | { current: HTMLElement | null };
      className?: string | string[] | Record<string, boolean>;
      id?: string;
      name?: string;
      dataset?: Record<string, string>;
      attachShadow?: "open" | "closed";
      innerHTML?: string;
      innerText?: string;
      textContent?: string;
      [key: string]: any;
    };
    children: any[];
  };

  /**
   * Converts an HTML element to a LiteElement object.
   *
   * @param {HTMLElement} element - The HTML element to convert.
   * @return {LiteElement} The converted LiteElement object.
   */
  export function toJson(element: HTMLElement): LiteElement {
    const props: any = {};

    if (element.style && element.style.cssText) {
      props.style = element.style.cssText;
    }

    if (element.className) {
      props.className = element.className.split(" ");
    }

    if (element.id) {
      props.id = element.id;
    }

    if (element.shadowRoot) {
      props.attachShadow = "open";
    }

    if ((element as any).name) {
      props.name = (element as any).name;
    }

    if (element.dataset && Object.keys(element.dataset).length > 0) {
      props.dataset = element.dataset;
    }

    let children: any[] = [];

    [
      ...Array.from(element.childNodes || []),
      ...Array.from(element.shadowRoot?.childNodes || []),
    ].forEach((child) => {
      if (child instanceof HTMLElement) {
        children.push(toJson(child));
      } else {
        children.push(child.textContent);
      }
    });

    const tagName = element.tagName.toLowerCase();
    if (["template", "style", "script"].some((tag) => tag === tagName)) {
      props.innerHTML = element.innerHTML;
      children = [];
    }

    return {
      type: element.tagName.toLowerCase() as any,
      props,
      children,
    };
  }

  /**
   * Converts a JSON object into a DOM element.
   *
   * @param {LiteElement<T>} element - The JSON object representing the element.
   * @return {HTMLElementTagNameMap[T]} - The converted DOM element.
   */
  export function fromJson<T extends ElementTag>(element: LiteElement<T>) {
    const el = createDom<T>(element.type, element.props);

    element.children.forEach((child) => {
      if (typeof child === "object") {
        el.appendChild(fromJson(child));
      } else {
        el.appendChild(document.createTextNode(child));
      }
    });

    return el as HTMLElementTagNameMap[T];
  }

  /**
   * Creates a new DOM element of the specified type with the given properties and children.
   *
   * @param {T} type - The type of the element to create. Must be a valid HTML tag name.
   * @param {Object} props - Optional properties for the element.
   *   @property {string | CSS.Properties} style - The inline style of the element.
   *   @property {((el: HTMLElement) => void) | { current: HTMLElement | null }} ref - A callback function or a ref object for referencing the element.
   *   @property {string | string[] | Record<string, boolean>} className - The class name(s) for the element.
   *   @property {string} id - The ID of the element.
   *   @property {string} name - The name attribute of the element.
   *   @property {Record<string, string>} dataset - Custom data attributes for the element.
   *   @property {"open" | "closed"} attachShadow - Indicates whether to attach a shadow root to the element.
   *   @property {string} innerHTML - The HTML content of the element.
   *   @property {string} innerText - The text content of the element.
   *   @property {string} textContent - The text content of the element.
   *   @property {any} [key] - Additional properties for the element.
   * @param {...any} children - The child elements to append to the element.
   * @return {HTMLElementTagNameMap[T]} - The created DOM element.
   */
  export function createDom<T extends ElementTag>(
    type: T,
    props?: LiteElement<T>["props"],
    ...children: LiteElement<T>["children"]
  ): HTMLElementTagNameMap[T] {
    // query by id if exists
    const uniqDom = props?.id
      ? (document.getElementById(props.id) as HTMLElementTagNameMap[T])
      : null;
    const el: HTMLElementTagNameMap[T] =
      uniqDom || document.createElement(type);

    children = children.flat(42).filter((x) => x !== undefined && x !== null);

    const shadowRoot = el.shadowRoot
      ? el.shadowRoot
      : props?.attachShadow
      ? el.attachShadow({ mode: props.attachShadow })
      : null;

    // class => className
    if (props?.class) {
      props.className = props.class;
    }

    for (const prop in props) {
      if (prop === "ref") {
        const ref = props.ref;
        if (typeof ref === "function") {
          ref(el);
        } else if (ref?.current) {
          ref.current = el;
        }
      } else if (prop === "className") {
        const className = Array.isArray(props.className)
          ? props.className
          : typeof props.className === "object"
          ? Object.entries(props.className)
              .filter(([, v]) => v)
              .map(([key]) => key)
          : props.className?.split(" ") || [];
        for (let c of className) {
          el.classList.add(c);
        }
      } else if (prop === "style") {
        const style = props.style;
        if (typeof style === "string") {
          el.style.cssText = style;
        } else {
          for (let s in style) {
            el.style[s as any] = (style as any)[s];
          }
        }
      } else if (prop === "dataset") {
        for (let d in props.dataset) {
          el.dataset[d] = props.dataset[d];
        }
      } else if (prop === "innerHTML") {
        el.innerHTML = props.innerHTML || "";
      } else if (prop === "innerText" || prop === "textContent") {
        el.textContent = props.textContent || "";
      } else if (prop.startsWith("on")) {
        el.addEventListener(prop.slice(2).toLowerCase(), props[prop]);
      } else {
        delete props?.attachShadow;
        const value = props[prop];
        if (typeof value === "boolean") {
          if (value) {
            el.setAttribute(prop, "");
          }
        } else {
          el.setAttribute(prop, props[prop]);
        }
      }
    }

    const root = shadowRoot || el;
    for (let child of children) {
      if (child instanceof Element) {
        root.appendChild(child);
      } else {
        root.appendChild(document.createTextNode(String(child)));
      }
    }

    return el;
  }
}
