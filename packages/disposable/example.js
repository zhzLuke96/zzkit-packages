const { Disposable, usingWith, DispositionStack } = require("./dist/main.umd");

class HelloDisposable extends Disposable {
  now = Date.now();
  constructor() {
    super();
    console.log("1. Hello");
    this.onDisposed(() => {
      console.log("3. Hello disposed");
    });
  }
}

(async () => {
  const [error, result] = await usingWith(
    [new HelloDisposable(), new DispositionStack()],
    (o1, s1) => {
      console.log("2. inner scope", o1.now);

      s1.defer(() => {
        console.log("3.1 defer something doing");
      });

      s1.defer(() => {
        console.log("3.2 defer something doing");
      });

      if (Math.random() > 0.5) {
        throw new Error("just error");
      }

      return Date.now();
    }
  );
  console.log("4. result: ", result);
  console.log("4. error: ", error);
})();
