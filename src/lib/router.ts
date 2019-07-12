import * as events from "./events";
import * as util from "./util";
import _ from "lodash";
import { makeLogger } from "./logging";
interface RoutingInfo {
  host: "localhost";
  port: number;
  protocol: util.Protocol;
}
const logger = makeLogger("ServiceRunner", "Router");
export class Router {

  public table: Map<string, RoutingInfo>;
  private serviceNotifications: events.ExternalServiceNotifications;
  constructor(serviceNotifications: events.ExternalServiceNotifications) {
    this.table = new Map();
    this.serviceNotifications = serviceNotifications;
    // subscribe to events that add services to the routing table;
    this.serviceNotifications.on("launched", this.handleNewService.bind(this));
    this.serviceNotifications.on("terminated", this.handleTerminatedService.bind(this));
  }

  public handleNewService(event: events.ExternalServiceNotification) {
    const { protocol, rpcPort } = event;
    logger.debug(`new service event ${JSON.stringify(event, null, 2)}`);
    const port = parseInt(rpcPort, 10);
    switch (protocol) {
      case "http":
      case "ws":
        this.addServiceRoute(`/${event.name}/${event.env}/${event.version}`, { protocol, port, host: "localhost" });
        return;
    }
  }

  public handleTerminatedService(event: events.ExternalServiceNotification) {
    const { protocol, rpcPort } = event;
    logger.debug(`terminate service event ${JSON.stringify(event, null, 2)}`);
    const port = parseInt(rpcPort, 10);
    switch (protocol) {
      case "http":
      case "ws":
        this.rmServiceRoute(`/${event.name}/${event.env}/${event.version}`, { protocol, port, host: "localhost" });
        return;
    }
  }

  public resolve(url: string): RoutingInfo {
    // TODO should handle dynamic routing for /serviceName/environment/version
    const route = this.table.get(url);
    if (route === undefined) {
      logger.error(`could not find ${url} corresponding service`);
      throw new Error("Service could not be found");
    }
    return route;
  }

  public addServiceRoute(path: string, routeInfo: RoutingInfo) {
    this.table.set(path, routeInfo);
    logger.debug(`added service ${path} with ${routeInfo.port} ${routeInfo.protocol} to routing table`);
  }

  public rmServiceRoute(path: string, routeInfo: RoutingInfo) {
    const route = this.table.get(path);
    if (route !== undefined) {
      if (_.isEqual(route, routeInfo) === true) {
        this.table.delete(path);
        logger.debug(`removed service ${path} with ${routeInfo.port} ${routeInfo.protocol} from routing table`);
      }
    }
  }
}
