import { wsBackend } from "./wsBackend";
import { httpBackend } from "./httpBackend";

export const backendRegistry = {
  ws: wsBackend,
  http: httpBackend,
};
