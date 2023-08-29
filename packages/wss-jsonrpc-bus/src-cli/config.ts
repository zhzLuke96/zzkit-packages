// 读配置
import { Command } from "commander";
import fs from "fs";

import packageJson from "../package.json";

// 创建一个Commander对象
const program = new Command();

// 定义命令行参数和选项
program.version(packageJson.version); // 设置版本号

program
  .command("sidecar") // 设置子命令
  .option("-c, --config <path>", "指定配置文件的路径") // 设置选项
  .description("使用sidecar模式创建分布式服务") // 设置子命令描述
  .action(sidecar); // 设置子命令动作函数
program
  .command("center") // 设置子命令
  .option("-c, --config <path>", "指定配置文件的路径") // 设置选项
  .description("使用center模式创建分布式服务") // 设置子命令描述
  .action(center); // 设置子命令动作函数

program.parse(process.argv); // 解析命令行参数和选项

// 获取命令行参数和选项
const options = program.opts();

const loadJSONFile = async <Data = unknown>(filepath: string) =>
  JSON.parse(
    await (await fs.promises.readFile(filepath, "utf-8")).toString()
  ) as Data;

interface CLIConfig {
  logger?: {
    level?: string;
    dir?: string;
  };
}

// 定义sidecar动作函数
function sidecar() {
  // TODO: 连接本地的服务，注册到中心服务中
  // TODO: 使用axios发送http请求，例如：
  // axios.post('http://center-service.com/register', { localService: configData.localService })
  //   .then(response => {
  //     console.log('注册成功');
  //   })
  //   .catch(error => {
  //     console.error('注册失败');
  //   });
}

interface CenterConfig extends CLIConfig {
  port: number;
  host?: number;
}

// 定义center动作函数
async function center({ config }) {
  const configJson = await loadJSONFile(config);

  // TODO: 创建最简单的单进程中心服务
  // TODO: 使用fs写入文件，例如：
  // fs.writeFileSync('center-service.js', 'console.log("Hello, world!");');
}
