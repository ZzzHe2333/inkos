import { Command } from "commander";
import { PipelineRunner, StateManager } from "@actalk/inkos-core";
import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { loadConfig, createClient, findProjectRoot, log, logError } from "../utils.js";

export const writeCommand = new Command("write")
  .description("Write chapters");

writeCommand
  .command("next")
  .description("Write the next chapter for a book")
  .argument("<book-id>", "Book ID")
  .option("--count <n>", "Number of chapters to write", "1")
  .action(async (bookId: string, opts) => {
    try {
      const config = await loadConfig();
      const client = createClient(config);
      const root = findProjectRoot();

      const pipeline = new PipelineRunner({
        client,
        model: config.llm.model,
        projectRoot: root,
        notifyChannels: config.notify,
      });

      const count = parseInt(opts.count, 10);

      for (let i = 0; i < count; i++) {
        log(`Writing chapter for "${bookId}"...`);

        const result = await pipeline.writeNextChapter(bookId);

        log(`  Chapter ${result.chapterNumber}: ${result.title}`);
        log(`  Words: ${result.wordCount}`);
        log(`  Audit: ${result.auditResult.passed ? "PASSED" : "NEEDS REVIEW"}`);
        if (result.revised) {
          log("  Auto-revised: YES (critical issues were fixed)");
        }
        log(`  Status: ${result.status}`);

        if (result.auditResult.issues.length > 0) {
          log("  Issues:");
          for (const issue of result.auditResult.issues) {
            log(`    [${issue.severity}] ${issue.category}: ${issue.description}`);
          }
        }

        log("");
      }

      log("Done.");
    } catch (e) {
      logError(`Failed to write chapter: ${e}`);
      process.exit(1);
    }
  });

writeCommand
  .command("rewrite")
  .description("Re-generate a specific chapter (removes it and writes fresh)")
  .argument("<book-id>", "Book ID")
  .argument("<chapter>", "Chapter number to rewrite")
  .action(async (bookId: string, chapterStr: string) => {
    try {
      const config = await loadConfig();
      const client = createClient(config);
      const root = findProjectRoot();
      const chapterNum = parseInt(chapterStr, 10);

      const state = new StateManager(root);
      const bookDir = state.bookDir(bookId);
      const chaptersDir = join(bookDir, "chapters");

      // Remove existing chapter file
      const files = await readdir(chaptersDir);
      const paddedNum = String(chapterNum).padStart(4, "0");
      const existing = files.filter((f) => f.startsWith(paddedNum) && f.endsWith(".md"));
      for (const f of existing) {
        await unlink(join(chaptersDir, f));
        log(`Removed: ${f}`);
      }

      // Remove from index (and all chapters after it)
      const index = await state.loadChapterIndex(bookId);
      const trimmed = index.filter((ch) => ch.number < chapterNum);
      await state.saveChapterIndex(bookId, trimmed);

      // Also remove later chapter files since state will be rolled back
      const laterFiles = files.filter((f) => {
        const num = parseInt(f.slice(0, 4), 10);
        return num > chapterNum && f.endsWith(".md");
      });
      for (const f of laterFiles) {
        await unlink(join(chaptersDir, f));
        log(`Removed later chapter: ${f}`);
      }

      // Restore state to previous chapter's end-state
      if (chapterNum > 1) {
        const restored = await state.restoreState(bookId, chapterNum - 1);
        if (restored) {
          log(`State restored from chapter ${chapterNum - 1} snapshot.`);
        } else {
          log(`Warning: no snapshot for chapter ${chapterNum - 1}. Using current state.`);
        }
      }

      log(`Regenerating chapter ${chapterNum}...`);

      const pipeline = new PipelineRunner({
        client,
        model: config.llm.model,
        projectRoot: root,
        notifyChannels: config.notify,
      });

      const result = await pipeline.writeNextChapter(bookId);

      log(`  Chapter ${result.chapterNumber}: ${result.title}`);
      log(`  Words: ${result.wordCount}`);
      log(`  Audit: ${result.auditResult.passed ? "PASSED" : "NEEDS REVIEW"}`);
      log(`  Status: ${result.status}`);
    } catch (e) {
      logError(`Failed to rewrite chapter: ${e}`);
      process.exit(1);
    }
  });
