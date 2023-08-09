# @zzkit/disposable

This library provides a convenient way to manage disposable resources in TypeScript. 

## Installation

```
npm install @zzkit/disposable
```

## Usage

The `using` function allows you to work with disposable resources and ensures they are disposed properly:

```ts
import { using } from '@zzkit/disposable';

class Resource implements IDisposable {
  //...
}

const resource = new Resource();

const result = await using(resource, async (r) => {
  // use resource
  return 'result'; 
});

// resource is disposed automatically
```

The `Disposable` class allows you to register disposable callbacks:

```ts
const disposable = new Disposable();

disposable.whenDispose(() => {
  // clean up
});

await disposable.dispose(); // callbacks are invoked
```

## API

### using

```ts
function using<T extends IDisposable, U>(
  disposable: T, 
  action: (r: T) => U | Promise<U>
): Promise<[null, U] | [Error, undefined]>;

function using(
  disposable: IDisposable | IDisposable[],
  action: (...r: IDisposable[]) => any  
): Promise<[null, any] | [Error, undefined]>; 
```

Executes the `action` callback with the given disposable resource(s) and ensures they are disposed properly. Returns a Promise resolving to the result of the action, or the error if action throws.

#### using examples
```ts
class Dog implements IDisposable {
  dispose(): void | Promise<void> {
    console.log("dog dispose");
  }
}

class Cat implements IDisposable {
  dispose(): void | Promise<void> {
    console.log("cat dispose");
  }
}

(async () => {
    let [error, r] = await using([new Dog(), new Cat()], (dog, cat) => {
        console.log('using');
        throw new Error('boom');
    });
    console.log(error);
    [error, r] = await using([], () => {
      console.log('using');
      throw new Error('boom2');
  });
  console.log(error);
})();
```

### IDisposable

Interface for disposable resources:

```ts
interface IDisposable {
  dispose(): any;
}
```

### Disposable

Helper class implementing `IDisposable` that runs registered dispose callbacks:

```ts
class Disposable implements IDisposable {

  dispose(): Promise<PromiseSettledResult<any>[]>

  whenDispose(callback: () => any, options?: { top?: boolean }): void

}
```

## License

MIT