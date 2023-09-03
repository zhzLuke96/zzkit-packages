# @zzkit/i18n

A simple i18n library for Node.js with template support.

## Installation

```
npm install @zzkit/i18n
```

## Usage

```js
import { I18n } from "@zzkit/i18n";

const i18n = new I18n({
  en: {
    hello: "Hello, { user.name }!",
    byebye: "Bye bye, { user.name }!",
  },
  zh: {
    hello: ({ user: { name } }) => `你好,${name}!`,
    byebye: ({ user: { name } }) => `再见,${name}!`,
  },
});

const context = {
  user: {
    name: "luke",
  },
};

const t1 = i18n.t("hello", "en", context);
// => 'Hello, John!'

const t2 = i18n.t("hello", "zh", context);
// => '你好,John!'
```

The `I18n` class takes in a translations object where keys are locale codes and values are translation objects.

The `t()` method translates a text key for the given locale. It supports interpolation using `{key}` in the translation text. Functions can also be used as translations to support more complex logic.

## API

### `new I18n(translations)`

Creates a new instance with the given `translations`.

### `i18n.t(key, [locale], [context], [defaultTrans?], [defaultGetValue?])`

Translates `key` for the given `locale`.

- `key` - The text key to translate
- `locale` - The locale code. Default `en`.
- `context` - Object with keys to interpolate.
- `defaultTrans` - Default translation if key not found.
- `defaultGetValue` - Default value for get function.

### `i18n.locale(locale)`

Get the `I18nLocale` instance for `locale`. Useful for calling methods like `t()` directly.

## License

MIT
