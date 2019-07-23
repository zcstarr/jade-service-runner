import { mockServer } from "../../../fixtures/src/util";
import { AddressInfo } from "net";
import http from "http";
import { HttpConnection, ConnectionBus, ResponseBus } from "../connection";
import { httpFrontend } from "./httpFrontend";
import { getFreePorts, getAvailableTCPPort } from "../util";
import { ExternalServiceNotificationEvents, ExternalServiceNotifications } from "../events";
import { EventEmitter } from "events";
import _ from "lodash";
import { MockWSDesc } from "fixtures/src/util";
import { httpBackend } from "../backends/httpBackend";
import fetch from "node-fetch";

describe("Frontend allows for a connection", () => {
  let httpServiceServer: http.Server;
  let tcpPort: number;
  beforeAll(async () => {
    httpServiceServer = await mockServer("");
    tcpPort = await getAvailableTCPPort();
  });

  afterAll(async () => {
    await new Promise((resolve) => {
      httpServiceServer.close(() => resolve());
    });
  });

  it("should allow http client connection to reach established backend", async () => {

    const address = httpServiceServer.address() as AddressInfo;
    const location = `http://localhost:${address.port}`;
    const connectionBus: ConnectionBus = new EventEmitter();
    const ESTABLISH = 1;
    const REQUEST = 2;
    const RESPONSE = 3;
    const testSeq = [ESTABLISH, REQUEST, RESPONSE];
    const actualSeq: number[] = [];
    const testMessage = "TEST_MESSAGE";
    let backendClient: HttpConnection;
    let connResponse: ResponseBus;
    await new Promise( async (resolve) => {
      const teardown = httpFrontend({ host: "localhost", port: tcpPort, protocol: "http" }, connectionBus);
      connectionBus.on("establish", async (data) => {
        actualSeq.push(ESTABLISH);
        connResponse = data.res;
        backendClient = await httpBackend({ protocol: "http", host: "localhost", port: address.port }, data.res);
        connResponse.emit("established", { type: "http", conn: backendClient.conn, host: "localhost" });
      });
      connectionBus.on("request", async (data) => {
        actualSeq.push(REQUEST);
        if (data.protocol === "http") {
          const res = await backendClient.conn.send(data.payload.body, data.payload.headers, data.payload.method);
          res.on("data", (d) => {
            connResponse.emit("response", d);
          });
        }
      });
      const result = await fetch(`http://localhost:${tcpPort}/`, {
        headers: {
          path: "/",
        },
        method: "POST",
        body: JSON.stringify({ test: "payload" }),
      });
      resolve();
    });
  });
});
