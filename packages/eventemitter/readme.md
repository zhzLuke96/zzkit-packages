# @zzkit/eventemitter

This is a new `EventEmitter` library that provides functionalities for event registration, emission, one-time listeners, removing listeners, canceling listeners with signals, and more.

## Installation

You can install this library using npm:

```bash
npm install @zzkit/eventemitter
```

## Usage

### Creating an EventEmitter Instance

First, you need to create an `EventEmitter` instance:

```typescript
import { EventEmitter } from '@zzkit/eventemitter';

type MyEvents = {
  greet: (name: string) => void;
  farewell: (name: string) => void;
  data: (payload: any) => void;
};

const emitter = new EventEmitter<MyEvents>({ maxListeners: 5 });
```

### Example 1: Registering and Emitting Events

```typescript
emitter.on('greet', (name) => {
  console.log(`Hello, ${name}!`);
});

emitter.emit('greet', 'Alice'); // Output: Hello, Alice!
```

### Example 2: Using One-Time Listeners

```typescript
emitter.once('farewell', (name) => {
  console.log(`Goodbye, ${name}!`);
});

emitter.emit('farewell', 'Bob'); // Output: Goodbye, Bob!
emitter.emit('farewell', 'Charlie'); // No output
```

### Example 3: Removing Listeners

```typescript
const dataListener = (payload: any) => {
  console.log(`Received data: ${JSON.stringify(payload)}`);
};
emitter.on('data', dataListener);

emitter.emit('data', { key: 'value' }); // Output: Received data: {"key":"value"}
emitter.off('data', dataListener);
emitter.emit('data', { key: 'value2' }); // No output
```

### Example 4: Canceling Listeners with Signals

```typescript
const controller = new AbortController();
emitter.on(
  'greet',
  (name) => {
    console.log(`Greetings, ${name}!`);
  },
  { signal: controller.signal }
);

emitter.emit('greet', 'Dave'); // Output: Greetings, Dave!
controller.abort();
emitter.emit('greet', 'Eve'); // No output
```

### Example 5: Iterator Pattern

```typescript
(async () => {
  const asyncEmitter = new EventEmitter<{ tick: (count: number) => void }>();
  const iterator = EventEmitter.iterator(asyncEmitter, 'tick');

  asyncEmitter.emit('tick', 1);
  asyncEmitter.emit('tick', 2);

  for await (const [count] of iterator) {
    console.log(`Tick count: ${count}`);
    if (count >= 2) break;
  }
})();
// Output:
// Tick count: 1
// Tick count: 2
```

### Example 6: Listener Count and Event Names

```typescript
console.log(emitter.listenerCount('greet')); // Output: 1
console.log(emitter.eventNames()); // Output: ['greet']
```

### Example 7: Setting Maximum Listeners

```typescript
emitter.setMaxListeners(2);
emitter.on('greet', () => console.log('Another greet listener'));
emitter.on('greet', () => console.log('Yet another greet listener')); // Warning: Max listeners (2) for event 'greet' exceeded!
```

### Example 8: Removing All Listeners

```typescript
emitter.removeAllListeners();
console.log(emitter.eventNames()); // Output: []
```

## Contributing

We welcome issues and pull requests. Feel free to open a discussion in the issue section or submit a pull request.

## License

This project is licensed under the MIT License.
