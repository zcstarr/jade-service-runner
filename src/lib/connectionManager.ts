import { StrictEventEmitter } from "strict-event-emitter-types";
import { EventEmitter } from "events";
import WebSocket from "ws";
import { IncomingMessage, OutgoingMessage, IncomingHttpHeaders } from "http";
import {Socket} from "net";
import http, {Server} from "http";
import { backendRegistry} from "./backends";
import { frontendRegistry} from "./frontends";
import { Router } from "./router";
import { HttpConnect, ConnectionSpec, ConnectionBus, Connection, ConnectionInfo } from "./connection";

type RequestSpec = WSRequestSpec | HttpRequestSpec;

interface WSRequestSpec {
  "payload": any;
  protocol: "ws";
  "uri": string;
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

export interface ResponseEvents {
  "response": (data: any) => void;
  "established": (conn: Connection) => void;
}

// Thing to note all of these events and connections will be scoped to the proper name etc...

export interface ConnectionEvents {
  establish: (connection: ConnectionSpec) => void;
  request: (req: RequestSpec) => void; // internally router etc create a bound object to forward
  terminate: (connection: ConnectionSpec) => void;
}

const httpConnection = (connectionBus: ConnectionBus, connectionManager: ConnectionManager) => {
  const handleRequest = (req: IncomingMessage, res: OutgoingMessage) => {
    // connectionBus.emit("request", { payload: { req, res }, id: "0" });
  };

  const server = http.createServer(handleRequest);
  server.listen(9997);
};

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
        response.on("data", (data) => {
          request.conn.respond(data);
        });
        return;
    }
  }

  public manageConnections() {
    this.connectionBus.on("establish", async (connectionSpec) => {
      if (connectionSpec.req.url === undefined) {
        throw new Error("Could not resolve url");
      }
      const routingInfo = this.router.resolve(connectionSpec.req.url);
      let connection: Connection;
      switch (connectionSpec.type) {
        case "http":
          connection = await backendRegistry.http(routingInfo, connectionSpec.res);
          break;
        case "ws":
          connection = await backendRegistry.ws(routingInfo);
          break;
        default:
          throw new Error("Could not resolve backend");
      }
      connectionSpec.res.emit("established", connection);
    });
    this.connectionBus.on("request", (request) => {
      // PERMISSIONS CAN DO WHATEVER HERE IF YOU"D LIKE
      this.forwardRequest(request);
    });
  }
  public async cleanup() {
    return Promise.all(this.teardown.map((teardown) => {
      return teardown();
    }));
  }
}
