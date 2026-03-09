import "dotenv/config";

import { startAcpRuntimeOrThrow } from "../services/acp.js";

startAcpRuntimeOrThrow().catch((error) => {
  console.error("[ACP] Failed to start ACP runtime:", error);
  process.exitCode = 1;
});
