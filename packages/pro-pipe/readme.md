# @zzkit/pro-pipe

`@zzkit/pro-pipe` is a simple library for chaining functions. It supports both synchronous and asynchronous functions, passing context, and breaking the chain when needed.

## Installation

```bash
npm install @zzkit/pro-pipe
```

or

```bash
yarn add @zzkit/pro-pipe
```

## Why?

When you have a sequence of asynchronous operations with conditions, your code can quickly become complex and hard to follow. It often leads to deeply nested `then` chains or early returns, making it difficult to maintain. `@zzkit/pro-pipe` simplifies this by flattening these chains and giving you control over the flow, including breaking out of the sequence when needed.

**Without `@zzkit/pro-pipe`:**

```javascript
initSession().then(() => {
  return getUser().then((user) => {
    if (!user) return getDefaultUser().then((defaultUser) => setUser(defaultUser));
    
    if (user.isGuest) {
      return;
    }
    
    return getUserPreferences(user.id).then((prefs) => {
      if (!prefs) return;
      updateUI(prefs);
    });
  });
});
```

This pattern of `if` checks and `return` statements makes the flow harder to follow, especially as it grows. With `@zzkit/pro-pipe`, you can replace these `return` statements with `break()` for a clearer flow.

**With `@zzkit/pro-pipe`:**

```javascript
pipeWith(
  {},
  initSession,
  getUser,
  (user, ctx) => user || getDefaultUser(),
  (user, ctx) => {
    if (user.isGuest) return ctx.break();
    return user;
  },
  (user) => getUserPreferences(user.id),
  updateUI
)();
```

In this version, the `break()` function simplifies the conditional exit, making the pipeline cleaner and easier to understand. If the user is a guest, the pipeline breaks early, avoiding unnecessary operations. This structure is not only more readable but also more efficient.

## Usage

### Basic Example

Chain multiple functions together:

```javascript
import { pipe } from '@zzkit/pro-pipe';

const addOne = (x) => x + 1;
const double = (x) => x * 2;
const square = (x) => x * x;

const pipeline = pipe(addOne, double, square);

pipeline(2).then((result) => console.log(result)); // 36
```

### Async Functions

You can mix async and sync functions:

```javascript
import { pipe } from '@zzkit/pro-pipe';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const asyncDouble = async (x) => {
  await delay(100);
  return x * 2;
};

const pipeline = pipe((x) => x + 1, asyncDouble, (x) => x * x);

pipeline(2).then((result) => console.log(result)); // 36
```

### Using Context

Add a context that gets passed between functions:

```javascript
import { pipeWith } from '@zzkit/pro-pipe';

const pipeline = pipeWith(
  { multiplier: 3 },
  (x) => x + 1,
  (x, ctx) => x * ctx.multiplier,
  (x) => x * x
);

pipeline(2).then((result) => console.log(result)); // 81
```

### Breaking the Chain

You can stop the chain early if needed:

```javascript
import { pipeWith } from '@zzkit/pro-pipe';

const pipeline = pipeWith(
  {},
  (x) => x + 1,
  (x, ctx) => {
    if (x >= 5) ctx.break();
    return x * 2;
  },
  (x) => x * x
);

pipeline(2).then((result) => console.log(result)); // 36 (no break)
pipeline(4).then((result) => console.log(result)); // 10 (breaks early)
```

### Composing Pipelines

You can nest pipes within pipes:

```javascript
import { pipe } from '@zzkit/pro-pipe';

const composedPipeline = pipe(
  (x) => x + 1,
  pipe((x) => x * 2, (x) => x * x), // Nested pipe
  (x) => x + 5
);

composedPipeline(2).then((result) => console.log(result)); // 41
```

## License

MIT
