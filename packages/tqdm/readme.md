# @zzkit/tqdm

A progress bar library for showing progress of loops and asynchronous tasks in the terminal.

## Install

```
npm install @zzkit/tqdm
```

## Usage

Import and wrap your loops or async tasks with the `tqdm` function:

```js
import { tqdm, range } from "@zzkit/tqdm";

for (const i of tqdm(range(100), { desc: "Training" })) {
  // Loop task
}
```

This will display a progress bar in the terminal, indicating the progress of the loop.

```
Training 2%|█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|5/170 [00:03<01:40, 1.65it/s]
```

Without for loop

```js
import { TqdmInstance } from "@zzkit/tqdm";
const bar1 = new TqdmInstance({ total: 1000, initial: 250 });
// do sth...
bar1.update(500); // update to 500
// do sth...
bar1.reset(100); // reset total to 100 and set n => 0
// do sth...
bar1.update(50);
// finally...
bar1.close();
```

## Options

`tqdm` accepts an options object to customize the progress bar:

- `desc` - Description text
- `total` - Total iterations

## Dependencies

This library depends on [cli-progress](https://github.com/npkgz/cli-progress) to handle the actual progress bar rendering.

## License

MIT
