import { EventEmitter } from "./dist/main";
// import { EventEmitter } from "./src/main";

(async () => {
  const asyncEmitter = new EventEmitter<{ tick: (count: number) => void }>();
  const iterator = EventEmitter.iterator(asyncEmitter, "tick");

  asyncEmitter.emit("tick", 1);
  asyncEmitter.emit("tick", 2);

  for await (const [count] of iterator) {
    console.log(`Tick count: ${count}`);
    if (count >= 2) break;
  }
})();
