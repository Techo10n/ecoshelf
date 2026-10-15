import express from "express";
import cors from "cors";
import trimTitleRouter from "./trimTitle.ts";

try {
  process.loadEnvFile();
} catch {
  // No .env: rely on the real environment. trimTitle reports a missing key per request.
}

const app = express();
const PORT = 8000;

app.use(express.json());
// Only the extension may call this. Any website could otherwise spend the OpenAI credit through
// a visitor's browser while the server is running.
app.use(cors({ origin: /^(chrome|moz)-extension:\/\// }));
app.use(trimTitleRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
