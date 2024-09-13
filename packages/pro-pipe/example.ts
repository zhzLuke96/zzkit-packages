import { pipe, pipeWith } from "./src/main";

// 辅助函数：延迟执行
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 测试用例
async function runTests() {
  // 测试1：基本的 pipe 功能
  const addOne = (x: number) => x + 1;
  const double = (x: number) => x * 2;
  const square = (x: number) => x * x;

  const basicPipe = pipe(addOne, double, square);
  console.assert((await basicPipe(2)) === 36, "Test 1 - Basic pipe failed");

  // 测试2：使用异步函数
  const asyncDouble = async (x: number) => {
    await delay(100);
    return x * 2;
  };

  const asyncPipe = pipe(addOne, asyncDouble, square);
  console.assert((await asyncPipe(2)) === 36, "Test 2 - Async pipe failed");

  // 测试3：使用上下文
  const withContext = pipeWith(
    { multiplier: 3 },
    addOne,
    (x, ctx) => x * ctx.multiplier,
    square
  );
  console.assert(
    (await withContext(2, {})) === 81,
    "Test 3 - With context failed"
  );

  // 测试4：使用 break
  const withBreak = pipeWith(
    {},
    addOne,
    (x, ctx) => {
      if (x >= 5) ctx.break();
      return x * 2;
    },
    square
  );
  console.assert(
    (await withBreak(2, {})) === 36,
    "Test 4 - With break (not breaking) failed"
  );
  console.assert(
    (await withBreak(4, {})) === 10,
    "Test 4 - With break (breaking) failed"
  );

  // 测试5：compose 能力
  const composed = pipe(
    addOne,
    pipe(double, square), // 内部 pipe
    (x) => x + 5
  );
  console.assert((await composed(2)) === 41, "Test 5 - Compose failed");

  // 测试6：复杂的 compose 和上下文组合
  const complexCompose = pipeWith<
    {
      base: number;
      multiplier: number;
    },
    number
  >(
    { base: 10, multiplier: 3 },
    (x, ctx) => x + ctx.base,
    pipe(double, (x, ctx) => x * ctx.multiplier, square),
    (x) => x + 5
  );
  console.assert(
    (await complexCompose(2, { multiplier: 3 })) === 5189,
    "Test 6 - Complex compose failed"
  );

  // 测试7：错误处理
  const errorPipe = pipe(
    addOne,
    (x) => {
      if (x === 3) throw new Error("Test error");
      return x;
    },
    double
  );
  try {
    await errorPipe(2);
    console.assert(
      false,
      "Test 7 - Error handling failed: error was not thrown"
    );
  } catch (error) {
    console.assert(
      error.message === "Test error",
      "Test 7 - Error handling failed: unexpected error"
    );
  }

  console.log("All tests completed successfully");
}

// 运行测试
runTests().catch((error) => console.error("Test suite failed:", error));
