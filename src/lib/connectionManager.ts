import { StrictEventEmitter } from "strict-event-emitter-types";
import { EventEmitter } from "events";
import WebSocket from "ws";
import { IncomingMessage, OutgoingMessage, IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
import {Socket} from "net";
import http, {Server} from "http";
import * as jsonRpcErrors from "./jsonRpcError";
import { backendRegistry} from "./backends";
import { frontendRegistry} from "./frontends";
import { Router } from "./router";
import { HttpConnect, ConnectionSpec, ConnectionBus, Connection, ConnectionInfo, connectionError } from "./connection";
import {makeLogger} from "./logging";
const logger = makeLogger("ServiceRunner", "ConnectionManager");

type RequestSpec = WSRequestSpec | HttpRequestSpec;

interface WSRequestSpec {
  payload: any;
  protocol: "ws";
  uri: string;
  conn: WebSocket;
}

interface HttpRequestSpec {
  payload: {
    headers: IncomingHttpHeaders,
    method: string,
    body: object,
  };
  protocol: "http";
  conn: HttpConnect;
  "uri": string;
}

export interface HttpDataResponse {
  headers: OutgoingHttpHeaders;
  statusCode: number | undefined;
  reason: string | undefined;
  payload: any;
}
export interface WSDataResponse {
  payload: any;
}

export type DataResponse = HttpDataResponse | WSDataResponse;

export interface DataError {
    error: Error;
    reason: string;
    statusCode: number;
}

export interface ResponseEvents<T extends DataResponse> {
  "response": (data: T) => void;
  "established": (conn: Connection) => void;
  "error": (data: jsonRpcErrors.JSONRpcError) => void;
  "terminateConnection": (data: jsonRpcErrors.JSONRpcError) => void;
}

// Thing to note all of these events and connections will be scoped to the proper name etc...

export interface ConnectionEvents {
  establish: (connection: ConnectionSpec) => void;
  request: (req: RequestSpec) => void; // internally router etc create a bound object to forward
  terminate: (connection: ConnectionSpec) => void;
}

export class ConnectionManager {
  private base: Set<ConnectionInfo>;
  private connectionBus: ConnectionBus;
  private router: Router;
  private teardown: Array<() => Promise<void>>;

  constructor(base: Set<ConnectionInfo>, router: Router) {
    this.base = base;
    this.connectionBus = new EventEmitter();
    this.router = router;
    this.teardown = [];
  }

  public setupConnections() {
    this.base.forEach((connectionInfo) => {
      const { protocol } = connectionInfo;
      const frontend = frontendRegistry.get(protocol);
      if (frontend === undefined) {
        throw new Error("Could not find protocol");
      }
      this.teardown.push(frontend(connectionInfo, this.connectionBus));
    });
    this.manageConnections();
  }

  // This manages all incoming requests
  public async forwardRequest(request: RequestSpec) {
    switch (request.protocol) {
      case "ws":
        request.conn.send(request.payload);
        return;
      case "http":
        const response = await request.conn.send(request.payload.body, request.payload.headers, request.payload.method);
        const {statusCode, statusMessage, headers} = response;
        response.on("data", (data) => {
          request.conn.respond({ headers, statusCode, reason: statusMessage, payload: data });
        });
        return;
    }
  }

  public manageConnections() {
    this.connectionBus.on("establish", async (connectionSpec) => {
      let routingInfo: ConnectionInfo;
      try {
        if (connectionSpec.req.url === undefined) {
          throw new Error("Could not resolve url");
        }
        routingInfo = this.router.resolve(connectionSpec.req.url);
      } catch (err) {
        const error = err as Error;
        const connectionErr = connectionError(jsonRpcErrors.METHOD_NOT_FOUND, 0, error.message, error, logger);
        connectionSpec.res.emit("terminateConnection", connectionErr);
        return;
      }

      let connection: Connection;
      switch (connectionSpec.type) {
        case "http":
          connection = await backendRegistry.http(routingInfo, connectionSpec.res);
          break;
        case "ws":
          connection = await backendRegistry.ws(routingInfo, connectionSpec.res);
          break;
        default:
          throw new Error("Could not resolve backend");
      }
      connectionSpec.res.emit("established", connection);
    });
    this.connectionBus.on("request", (request) => {
      this.forwardRequest(request);
    });
  }
  public async cleanup() {
    return Promise.all(this.teardown.map((teardown) => {
      return teardown();
    }));
  }
}
