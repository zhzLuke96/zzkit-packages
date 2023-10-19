# @zzkit/create-dom

Create DOM elements with a declarative React-like syntax.

## Usage

Install

```
npm install @zzkit/create-dom
```

Import

```js
import { CreateDom } from '@zzkit/create-dom';
```

Creating elements:

```jsx
const { createDom } = CreateDom;
const el = createDom('div', {
  id: 'container',
  style: { color: 'blue' }
},
  createDom('h1', {}, 'Hello World'),
  createDom('p', {}, 'This is my app')
);
```

- The first argument is the tag name 
- The second argument is props object
- Additional arguments are children

### Props

- `style` - CSS styles object or string
- `className` - CSS classes 
- `on[Event]` - Event handlers like `onClick` 
- `ref` - Callback ref or object with `current`
- `id`, `name`, `data-*` attributes
- And more...

### Children 

- DOM elements
- Strings (become text nodes)
- Array (becomes fragment - no wrapper element)

### Returns

The corresponding DOM element.

```js
// el is <div id="container" style="color: blue">...</div>
```

You can then append it, return from a function, etc.

## License

MIT
