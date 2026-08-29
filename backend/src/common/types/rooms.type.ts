import { WebSocket } from "ws";
export interface Room {
  sockets: WebSocket[];
}
