import { parseCSSProps } from "./parseCSSProps";
import { NestedCSSProperties } from "./types";

export class BaseStyleSheet {
  protected _id = Math.random().toString(36).slice(2);
  protected _props: NestedCSSProperties = {};

  constructor(readonly root: ShadowRoot | Document = document) {}

  get className() {
    return `ss-${this._id}`;
  }

  protected parse(props: NestedCSSProperties) {
    const css_text = parseCSSProps(props, `.${this.className}`, {
      beautify: false,
    });
    return css_text;
  }

  update(props: NestedCSSProperties) {
    const css_text = this.parse(props);
    this.replace(css_text);
    this._props = props;
  }

  patch(props: NestedCSSProperties) {
    const next_props = { ...this._props, ...props };
    this.update(next_props);
  }

  replace(css_text: string) {
    throw new Error("Method not implemented.");
  }

  mount() {
    throw new Error("Method not implemented.");
  }

  unmount() {
    throw new Error("Method not implemented.");
  }
}

export class AdoptedStyleSheet extends BaseStyleSheet {
  protected _sheet = new CSSStyleSheet();

  update(props: NestedCSSProperties) {
    const css_text = this.parse(props);
    this._sheet.replaceSync(css_text);
  }

  mount() {
    this.root.adoptedStyleSheets = [
      ...this.root.adoptedStyleSheets,
      this._sheet,
    ];
  }

  unmount() {
    this.root.adoptedStyleSheets = this.root.adoptedStyleSheets.filter(
      (x) => x !== this._sheet
    );
  }
}

export class StyleSheet extends BaseStyleSheet {
  protected _style = document.createElement("style");

  update(props: NestedCSSProperties) {
    const css_text = this.parse(props);
    this._style.innerHTML = css_text;
  }

  mount() {
    const container = this.root instanceof Document ? document.head : this.root;
    container.appendChild(this._style);
  }

  unmount() {
    this._style.remove();
  }
}
