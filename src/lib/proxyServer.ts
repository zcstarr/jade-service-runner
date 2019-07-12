import { ConnectionManager } from "./connectionManager";
import { ConnectionInfo } from "./connection";
import { Router } from "./router";
import { makeLogger } from "./logging";
const logger = makeLogger("ServiceRunner", "ProxyServer");
export class ProxyServer {

  private connMan: ConnectionManager;
  private router: Router;
  constructor(base: Set<ConnectionInfo>, router: Router) {
    this.connMan = new ConnectionManager(base, router);
    this.router = router;
  }

  public start() {
    logger.debug("setting up connections");
    this.connMan.setupConnections();
    logger.debug("set up connections");
  }

  public addServiceRunner(port: number) {
    this.router.addServiceRoute("/", { host: "localhost", port, protocol: "http" });
  }
}
