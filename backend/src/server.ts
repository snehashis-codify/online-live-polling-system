import "dotenv/config";
import { createServer } from "http";
import createApplication from "./index.js";
import attachLiveResults from "./modules/live/live.socket.js";
async function main() {
  try {
    const server = createServer(createApplication());
    const PORT = Number(process.env.PORT) || 5000;
    attachLiveResults(server);
    server.listen(PORT, () => {
      console.log(`Server is listening to PORT ${PORT}`);
    });
  } catch (error) {
    console.log("Error while connecting server");
    throw error;
  }
}
main();
