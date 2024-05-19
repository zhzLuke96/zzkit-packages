import { AdoptedStyleSheet, BaseStyleSheet, StyleSheet } from "./StyleSheet";
import { NestedCSSProperties } from "./types";

/**
 * Creates a style sheet based on the provided properties and options.
 *
 * @param {NestedCSSProperties} props - the CSS properties for the style sheet
 * @param {object} options - optional parameters for creating the style sheet
 * @param {boolean} options.adopted - indicates whether to use the new CSSStyleSheet API to create a stylesheet
 * @param {boolean} options.disabled - indicates whether to disable the stylesheet
 * @return {BaseStyleSheet} the created style sheet
 */
export const createStyleSheet = (
  props: NestedCSSProperties,
  options?: {
    /**
     * Use the new CSSStyleSheet API to create a stylesheet
     */
    adopted?: boolean;
    /**
     * Disable the stylesheet
     */
    disabled?: boolean;
  }
) => {
  const sheet: BaseStyleSheet = options?.adopted
    ? new AdoptedStyleSheet()
    : new StyleSheet();

  sheet.update(props);

  if (!options?.disabled) {
    sheet.mount();
  }

  return sheet;
};

createStyleSheet.id2sheet = BaseStyleSheet.id2sheet;
createStyleSheet.cls2sheet = BaseStyleSheet.cls2sheet;
createStyleSheet.unmount = (idOrClassName: string) => {
  const sheet =
    BaseStyleSheet.id2sheet.get(idOrClassName) ||
    BaseStyleSheet.cls2sheet.get(idOrClassName);
  if (sheet) {
    sheet.unmount();
  }
  return sheet;
};
