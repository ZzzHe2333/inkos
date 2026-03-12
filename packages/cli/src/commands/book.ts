import { Command } from "commander";
import { PipelineRunner, StateManager, type BookConfig } from "@actalk/inkos-core";
import { loadConfig, createClient, findProjectRoot, log, logError } from "../utils.js";

export const bookCommand = new Command("book")
  .description("Manage books");

bookCommand
  .command("create")
  .description("Create a new book with AI-generated foundation")
  .requiredOption("--title <title>", "Book title")
  .option("--genre <genre>", "Genre", "xuanhuan")
  .option("--platform <platform>", "Target platform", "tomato")
  .option("--target-chapters <n>", "Target chapter count", "200")
  .option("--chapter-words <n>", "Words per chapter", "3000")
  .action(async (opts) => {
    try {
      const config = await loadConfig();
      const client = createClient(config);
      const root = findProjectRoot();

      const bookId = opts.title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 30);

      const now = new Date().toISOString();
      const book: BookConfig = {
        id: bookId,
        title: opts.title,
        platform: opts.platform,
        genre: opts.genre,
        status: "outlining",
        targetChapters: parseInt(opts.targetChapters, 10),
        chapterWordCount: parseInt(opts.chapterWords, 10),
        createdAt: now,
        updatedAt: now,
      };

      log(`Creating book "${book.title}" (${book.genre} / ${book.platform})...`);

      const pipeline = new PipelineRunner({
        client,
        model: config.llm.model,
        projectRoot: root,
      });

      await pipeline.initBook(book);

      log(`Book created: ${bookId}`);
      log(`  Location: books/${bookId}/`);
      log(`  Story bible, outline, style guide generated.`);
      log("");
      log(`Next: inkos write next ${bookId}`);
    } catch (e) {
      logError(`Failed to create book: ${e}`);
      process.exit(1);
    }
  });

bookCommand
  .command("list")
  .description("List all books")
  .action(async () => {
    try {
      const root = findProjectRoot();
      const state = new StateManager(root);
      const bookIds = await state.listBooks();

      if (bookIds.length === 0) {
        log("No books found. Create one with: inkos book create --title '...'");
        return;
      }

      for (const id of bookIds) {
        const book = await state.loadBookConfig(id);
        const nextChapter = await state.getNextChapterNumber(id);
        log(`  ${id} | ${book.title} | ${book.genre}/${book.platform} | ${book.status} | chapters: ${nextChapter - 1}`);
      }
    } catch (e) {
      logError(`Failed to list books: ${e}`);
      process.exit(1);
    }
  });
