#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { transpileBahasaIndoJS } from "./core/transpiler.js";

const program = new Command();

program
  .name("indojs")
  .description("Bahasa Indonesia → JavaScript Transpiler")
  .version("1.0.0");

// ==================== Kompilasi satu file ====================
program
  .command("compile <inputFile>")
  .description("Transpile satu file .ina ke .js")
  .option("-o, --out-dir <dir>", "Folder output", "dist")
  .action((inputFile: string, options: { outDir: string }) => {
    try {
      if (!inputFile.endsWith(".ina"))
        throw new Error("File harus berekstensi .ina");

      if (!fs.existsSync(inputFile))
        throw new Error(`File tidak ditemukan: ${inputFile}`);

      const code = fs.readFileSync(inputFile, "utf8");
      const js = transpileBahasaIndoJS(code, inputFile);

      const base = path.basename(inputFile, ".ina");
      const outPath = path.join(options.outDir, `${base}.js`);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, js, "utf8");

      console.log(chalk.green(`✅ ${inputFile} → ${outPath}`));
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

// ==================== Kompilasi semua file .ina ====================
program
  .command("build")
  .description("Compile semua file .ina dalam folder ke folder dist")
  .option("-r, --root-dir <dir>", "Folder sumber", ".")
  .option("-o, --out-dir <dir>", "Folder output", "dist")
  .action((options: { rootDir: string; outDir: string }) => {
    const rootDir = path.resolve(options.rootDir);
    const outDir = path.resolve(options.outDir);

    if (!fs.existsSync(rootDir)) {
      console.error(chalk.red(`❌ Folder sumber tidak ditemukan: ${rootDir}`));
      process.exit(1);
    }

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir);
      for (const file of entries) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (file.endsWith(".ina")) {
          const rel = path.relative(rootDir, fullPath);
          try {
            const code = fs.readFileSync(fullPath, "utf8");
            const js = transpileBahasaIndoJS(code, fullPath);
            const outFile = path.join(outDir, rel.replace(/\.ina$/, ".js"));
            fs.mkdirSync(path.dirname(outFile), { recursive: true });
            fs.writeFileSync(outFile, js, "utf8");

            console.log(chalk.green(`✅ ${rel} → ${path.relative(process.cwd(), outFile)}`));
          } catch (err) {
            console.error((err as Error).message);
            process.exit(1);
          }
        }
      }
    };

    console.log(chalk.blue(`🔍 Mencari file .ina di: ${rootDir}`));
    walk(rootDir);
    console.log(chalk.green(`\n✨ Semua file berhasil di-compile ke: ${outDir}`));
  });

// Parse CLI
program.parse();
