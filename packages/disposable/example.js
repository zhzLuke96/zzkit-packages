const { Disposable, using } = require("./dist/main.umd");

class HelloDisposable extends Disposable {
  now = Date.now();
  constructor() {
    super();
    console.log("1. Hello");
    this.whenDispose(() => {
      console.log("3. Hello disposed");
    });
  }
}

(async () => {
  const [error, result] = await using(new HelloDisposable(), (o1) => {
    console.log("2. inner scope", o1.now);
    return Date.now();
  });
  console.log("4. result: ", result);
  console.log("4. error: ", error);
})();
