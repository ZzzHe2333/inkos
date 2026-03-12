import { Command } from "commander";
import { StateManager } from "@actalk/inkos-core";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { findProjectRoot, log, logError } from "../utils.js";

export const exportCommand = new Command("export")
  .description("Export book chapters to a single file")
  .argument("<book-id>", "Book ID")
  .option("--format <format>", "Output format (txt, md)", "txt")
  .option("--output <path>", "Output file path")
  .option("--approved-only", "Only export approved chapters")
  .action(async (bookId: string, opts) => {
    try {
      const root = findProjectRoot();
      const state = new StateManager(root);

      const book = await state.loadBookConfig(bookId);
      const index = await state.loadChapterIndex(bookId);
      const bookDir = state.bookDir(bookId);
      const chaptersDir = join(bookDir, "chapters");

      const chapters = opts.approvedOnly
        ? index.filter((ch) => ch.status === "approved")
        : index;

      if (chapters.length === 0) {
        logError("No chapters to export.");
        process.exit(1);
      }

      const parts: string[] = [];

      if (opts.format === "md") {
        parts.push(`# ${book.title}\n`);
        parts.push(`---\n`);
      } else {
        parts.push(`${book.title}\n\n`);
      }

      for (const ch of chapters) {
        const paddedNum = String(ch.number).padStart(4, "0");
        const files = await import("node:fs/promises").then((fs) =>
          fs.readdir(chaptersDir),
        );
        const match = files.find((f) => f.startsWith(paddedNum));
        if (!match) continue;

        const content = await readFile(join(chaptersDir, match), "utf-8");
        parts.push(content);
        parts.push("\n\n");
      }

      const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

      const outputPath =
        opts.output ?? join(root, `${bookId}_export.${opts.format}`);
      await writeFile(outputPath, parts.join("\n"), "utf-8");

      log(`Exported ${chapters.length} chapters (${totalWords} words)`);
      log(`Output: ${outputPath}`);
    } catch (e) {
      logError(`Failed to export: ${e}`);
      process.exit(1);
    }
  });
