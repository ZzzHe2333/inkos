import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findProjectRoot, log, logError } from "../utils.js";

export const doctorCommand = new Command("doctor")
  .description("Check environment and project health")
  .action(async () => {
    const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
    const root = findProjectRoot();

    // 1. Check Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1).split(".")[0]!, 10);
    checks.push({
      name: "Node.js >= 20",
      ok: major >= 20,
      detail: nodeVersion,
    });

    // 2. Check inkos.json exists
    try {
      await readFile(join(root, "inkos.json"), "utf-8");
      checks.push({ name: "inkos.json", ok: true, detail: "Found" });
    } catch {
      checks.push({ name: "inkos.json", ok: false, detail: "Not found. Run 'inkos init'" });
    }

    // 3. Check .env exists
    try {
      await readFile(join(root, ".env"), "utf-8");
      checks.push({ name: ".env", ok: true, detail: "Found" });
    } catch {
      checks.push({ name: ".env", ok: false, detail: "Not found" });
    }

    // 4. Check LLM API key
    try {
      const raw = await readFile(join(root, "inkos.json"), "utf-8");
      const config = JSON.parse(raw);
      const hasKey = config.llm?.apiKey && config.llm.apiKey.length > 10;
      checks.push({
        name: "LLM API Key",
        ok: hasKey,
        detail: hasKey ? "Configured" : "Missing or too short",
      });
    } catch {
      checks.push({ name: "LLM API Key", ok: false, detail: "Cannot read config" });
    }

    // 5. Check books directory
    try {
      const { StateManager } = await import("@actalk/inkos-core");
      const state = new StateManager(root);
      const books = await state.listBooks();
      checks.push({
        name: "Books",
        ok: true,
        detail: `${books.length} book(s) found`,
      });
    } catch {
      checks.push({ name: "Books", ok: true, detail: "0 books" });
    }

    // Output
    log("InkOS Doctor\n");
    for (const check of checks) {
      const icon = check.ok ? "[OK]" : "[!!]";
      log(`  ${icon} ${check.name}: ${check.detail}`);
    }

    const failed = checks.filter((c) => !c.ok);
    if (failed.length > 0) {
      log(`\n${failed.length} issue(s) found.`);
    } else {
      log("\nAll checks passed.");
    }
  });
