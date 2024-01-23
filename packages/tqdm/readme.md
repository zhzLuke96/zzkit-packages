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

## Options

`tqdm` accepts an options object to customize the progress bar:

- `desc` - Description text
- `total` - Total iterations

## Dependencies

This library depends on [cli-progress](https://github.com/npkgz/cli-progress) to handle the actual progress bar rendering.

## License

MIT