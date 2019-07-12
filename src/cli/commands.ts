import fs from "fs-extra";
import _ from "lodash";
import { Config } from "../lib/config";
import { makeLogger } from "../lib/logging";
import { Command } from "commander";
import { ServiceRunnerServer } from "../";
import { ProxyServer } from "../lib/proxyServer";
import { getAvailableTCPPort } from "../lib/util";
import { Router } from "../lib/router";
import { ConnectionInfo } from "../lib/connection";
const logger = makeLogger("ServiceRunner", "Commands");

interface ParsedCommands {
  port: string;
  dir: string;
  extendedConfig: any;
  test: boolean;
}

const parseCommands = async (prog: Command) => {
  let dir = "./services";
  let port = "8002";
  let extendedConfig: any;
  if (prog.config) { extendedConfig = await fs.readJSON(prog.config); }
  if (prog.dir) { dir = prog.dir; }
  if (prog.port) { port = prog.port; }
  return {port, dir, test: prog.test, extendedConfig};
};

const testConfiguration = async (extendedConfig: any) => {
  // tslint:disable-next-line:no-unused-expression
  new Config(extendedConfig);
  logger.info(`Configuration is valid!`);
};

const launchCommands = async ({port, dir, extendedConfig}: ParsedCommands) => {
    const availablePort = await getAvailableTCPPort();
    const serviceRunnerServer = new ServiceRunnerServer(extendedConfig, dir, `${availablePort}`);
    const router = new Router(serviceRunnerServer.serviceManager.notifications);

    const connections = new Set<ConnectionInfo>([{ host: "localhost", port: parseInt(port, 10), protocol: "http" }]);
    const proxy = new ProxyServer(connections, router);
    logger.info(`Service Runner port starting on ${port}`);
    logger.debug(`Service Runner internal port starting on ${availablePort}`);
    await serviceRunnerServer.start();
    proxy.addServiceRunner(availablePort);
    const started = proxy.start();
    logger.info(`Service Runner started on ${port}`);
    return started;
};

export const startServiceRunner = async (program: any): Promise<void> => {
  const commands = await parseCommands(program);
  if (commands.test) {
    return testConfiguration(commands.extendedConfig);
  }
  return launchCommands(commands);
};
