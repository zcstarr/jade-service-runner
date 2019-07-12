import { wsBackend } from "./wsBackend";
import { httpBackend } from "./httpBackend";
import { Protocol } from "../util";
import { SocketBackend, HttpBackend } from "./types";
interface BackendRegistry {
  "ws": SocketBackend;
  "http": HttpBackend;
}
export const backendRegistry = {
  ws: wsBackend,
  http: httpBackend,
};
