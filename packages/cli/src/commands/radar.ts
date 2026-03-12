import { Command } from "commander";
import { PipelineRunner } from "@actalk/inkos-core";
import { loadConfig, createClient, findProjectRoot, log, logError } from "../utils.js";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export const radarCommand = new Command("radar")
  .description("Market intelligence");

radarCommand
  .command("scan")
  .description("Scan market for opportunities")
  .option("--platforms <platforms>", "Platforms to scan (comma-separated)", "tomato,feilu")
  .action(async (opts) => {
    try {
      const config = await loadConfig();
      const client = createClient(config);
      const root = findProjectRoot();

      const pipeline = new PipelineRunner({
        client,
        model: config.llm.model,
        projectRoot: root,
      });

      log("Scanning market...");

      const result = await pipeline.runRadar();

      log(`\nMarket Summary:\n${result.marketSummary}\n`);
      log("Recommendations:");

      for (const rec of result.recommendations) {
        log(`  [${(rec.confidence * 100).toFixed(0)}%] ${rec.platform}/${rec.genre}`);
        log(`    Concept: ${rec.concept}`);
        log(`    Reasoning: ${rec.reasoning}`);
        log(`    Benchmarks: ${rec.benchmarkTitles.join(", ")}`);
        log("");
      }

      // Save radar result
      const radarDir = join(root, "radar");
      await mkdir(radarDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      await writeFile(
        join(radarDir, `scan-${timestamp}.json`),
        JSON.stringify(result, null, 2),
        "utf-8",
      );

      log(`Radar result saved to radar/scan-${timestamp}.json`);
    } catch (e) {
      logError(`Radar scan failed: ${e}`);
      process.exit(1);
    }
  });
