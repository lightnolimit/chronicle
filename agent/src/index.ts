import "dotenv/config";

import { startHttpServer } from "./server.js";
import { startAcpRuntimeIfEnabled } from "./services/acp.js";

startHttpServer();

startAcpRuntimeIfEnabled().catch((error) => {
  console.error("[ACP] Failed to start ACP runtime:", error);
});
