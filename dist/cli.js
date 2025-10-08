#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { transpileBahasaIndoJS } from "./core/transpiler.js"; // ← penting: tambahkan .js kalau ESM/TSX
const program = new Command();
program
    .name("indojs")
    .description("Bahasa Indonesia → JavaScript Transpiler")
    .version("1.0.0");
// === Compile satu file ===
program
    .command("compile <inputFile>")
    .description("Transpile satu file .ina ke .js")
    .option("-o, --out-dir <dir>", "Folder output", "dist")
    .action((inputFile, options) => {
    try {
        if (!inputFile.endsWith(".ina")) {
            console.error(chalk.red("❌ File harus berekstensi .ina"));
            process.exit(1);
        }
        if (!fs.existsSync(inputFile)) {
            console.error(chalk.red(`❌ File tidak ditemukan: ${inputFile}`));
            process.exit(1);
        }
        const code = fs.readFileSync(inputFile, "utf8");
        const js = transpileBahasaIndoJS(code);
        const base = path.basename(inputFile, ".ina");
        const outPath = path.join(options.outDir, `${base}.js`);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, js, "utf8");
        console.log(chalk.green(`✅ ${inputFile} → ${outPath}`));
    }
    catch (err) {
        console.error(chalk.red("💥 Error:"), err.message);
        process.exit(1);
    }
});
// === Build seluruh project ===
program
    .command("build")
    .description("Compile semua file .ina dalam folder ke folder dist")
    .option("-r, --root-dir <dir>", "Folder sumber", ".")
    .option("-o, --out-dir <dir>", "Folder output", "dist")
    .action((options) => {
    const rootDir = path.resolve(options.rootDir);
    const outDir = path.resolve(options.outDir);
    if (!fs.existsSync(rootDir)) {
        console.error(chalk.red(`❌ Folder sumber tidak ditemukan: ${rootDir}`));
        process.exit(1);
    }
    const walk = (dir) => {
        let entries;
        try {
            entries = fs.readdirSync(dir);
        }
        catch (err) {
            console.error(chalk.red(`⚠️ Tidak bisa baca folder: ${dir}`));
            return;
        }
        for (const file of entries) {
            const full = path.join(dir, file);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                walk(full);
            }
            else if (file.endsWith(".ina")) {
                try {
                    const code = fs.readFileSync(full, "utf8");
                    const js = transpileBahasaIndoJS(code);
                    const rel = path.relative(rootDir, full);
                    const outFile = path.join(outDir, rel.replace(/\.ina$/, ".js"));
                    fs.mkdirSync(path.dirname(outFile), { recursive: true });
                    fs.writeFileSync(outFile, js, "utf8");
                    console.log(chalk.green(`✅ ${rel} → ${path.relative(process.cwd(), outFile)}`));
                }
                catch (err) {
                    console.error(chalk.red(`💥 Gagal compile ${file}:`), err.message);
                }
            }
        }
    };
    console.log(chalk.blue(`🔍 Mencari file .ina di: ${rootDir}`));
    walk(rootDir);
    console.log(chalk.green(`\n✨ Semua file berhasil di-compile ke: ${outDir}`));
});
// === Penting: jalankan CLI ===
program.parse();
