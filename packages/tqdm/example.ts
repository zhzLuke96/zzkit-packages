import { tqdm } from "./src/main";
import { range } from "./src/range";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  for (const i of tqdm(range(170), { desc: "outer" })) {
    // console.log(i);
    await sleep(2000 * Math.random());
  }
};

main();
