import { get } from "./get";

export type LocaleTranslations<K extends string> = {
  [key in K]: string | ((context: any) => string);
};

export type Translations<K extends string, L extends string> = {
  [key in L]: LocaleTranslations<K>;
};

export class I18nLocale<K extends string> {
  translations: LocaleTranslations<K>;
  /**
   * Constructor
   *
   * @param translations - The translation texts
   */
  constructor(translations: LocaleTranslations<K>) {
    this.translations = translations;
  }

  /**
   * Translate text
   *
   * @param key - The translation key
   * @param context - Context for interpolation
   * @param defaultTrans - Default translation
   * @param defaultGetValue - Default value for get function
   * @returns Translated text
   */
  t(
    key: K,
    context = {} as Record<string, any>,
    defaultTrans = "",
    defaultGetValue = "-"
  ) {
    // Get the translation for key
    const translationOrFunc = this.translations[key] || defaultTrans;

    if (typeof translationOrFunc === "function") {
      // If it's a function, call it with data
      return translationOrFunc(context);
    }
    let translation = translationOrFunc as string;

    // Use regex to match {key} patterns
    const matches =
      Array.from(translation.matchAll(/{\s*([[\]\.\w\d]+?)\s*}/g)) || [];

    if (matches) {
      matches.forEach((match) => {
        const [$0, $1] = match;
        const key = $1.trim();
        const value = get(context, key, defaultGetValue);
        if (value) {
          translation = translation.replace($0, `${value || ""}`);
        }
      });
    }

    return translation;
  }
}

/**
 * Simple i18n class with template support
 */
export class I18n<K extends string = string, L extends string = string> {
  protected translations: Translations<K, L>;
  protected locales = {} as Record<L, I18nLocale<K>>;

  /**
   * Constructor
   *
   * @param translations - The translation texts
   */
  constructor(translations: Translations<K, L>) {
    this.translations = translations;
    Object.entries(translations).forEach(([locale, localeTranslations]) => {
      this.locales[locale as L] = new I18nLocale(localeTranslations as any);
    });
  }

  locale(locale: L) {
    return this.locales[locale];
  }

  /**
   * Translate text
   *
   * @param key - The translation key
   * @param locale - The locale code
   * @param context - Context for interpolation
   * @param defaultTrans - Default translation
   * @param defaultGetValue - Default value for get function
   * @returns Translated text
   */
  t(
    key: K,
    locale = "en" as L,
    context = {} as Record<string, any>,
    defaultTrans = "",
    defaultGetValue = "-"
  ) {
    const localeInstance = this.locales[locale];
    if (localeInstance) {
      return localeInstance.t(key, context, defaultTrans, defaultGetValue);
    }
    return defaultTrans;
  }
}

// Sample usage
// const i18n = new I18n({
//   en: {
//     hello: 'Hello, {name}!',
//     byebye: 'Bye bye, {name}!',
//   },
//   zh: {
//     hello: ({name}) => `你好, ${name}!`,
//     byebye: ({name}) => `再见, ${name}!`,
//   },
// });

// const t1 = i18n.t('hello', 'en', { name: 'John' });
// // => 'Hello, John!'
// console.log(t1);

// const t2 = i18n.t('hello', 'zh', { name: 'John' });
// // => '你好,John!'
// console.log(t2);
