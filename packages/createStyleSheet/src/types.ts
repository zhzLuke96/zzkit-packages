import type * as CSS from "csstype";

type CSSProperties = CSS.Properties;

export type NestedCSSProperties = CSSProperties & {
  [k: string]: NestedCSSProperties | CSSProperties[keyof CSSProperties];
};
