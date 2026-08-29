import "dotenv/config";
import { createServer } from "http";
import createApplication from "./index.js";
import { WebSocketServer } from "ws";
import type { Room } from "./common/types/rooms.type.js";
async function main() {
  try {
    const server = createServer(createApplication());
    const PORT = Number(process.env.PORT) || 5000;
    const rooms: Record<string, Room> = {};
    const wss = new WebSocketServer({ port: PORT });

    wss.on("connection", function connection(ws) {
      ws.on("error", console.error);

      ws.on("message", function message(data) {
        console.log("received: %s", data);
      });

      ws.send("something");
    });
    server.listen(PORT, () => {
      console.log(`Server is listening to PORT ${PORT}`);
    });
  } catch (error) {
    console.log("Error while connecting server");
    throw error;
  }
}
main();
