// validator-modular.ts
import chalk from "chalk";

interface Scope {
  vars: Set<string>;
}

interface ScanScope {
  vars: Set<string>;
}

const KEYWORDS = new Set([
  "buat", "tetap", "fungsi", "latar", "hasil?", "ambil", "duplikat",
  "Angka", "Desimal", "Teks", "Logika", "match",
  "benar", "salah", "true", "false", "_", "sebagai", "dengan", "jika", "lain", "selama", "untuk", "kembalikan",
]);

export function scanVariablesAndKeywords(lines: string[]) {
  const errors: string[] = [];
  const scopeStack: ScanScope[] = [{ vars: new Set() }];
  const functions = new Set<string>();
  const BUILTIN_FUNCS = new Set(["tulis"]);

  function currentScope() { return scopeStack[scopeStack.length - 1]; }

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    // ----- Masuk / Keluar Scope -----
    if (line.endsWith("{")) { scopeStack.push({ vars: new Set() }); return; }
    if (line === "}") { scopeStack.pop(); return; }

    // ----- Deklarasi fungsi -----
    const funcMatch = line.match(/^(latar\s+)?fungsi\s+(\w+)\s*\(/);
    if (funcMatch) {
      const [, , funcName] = funcMatch;
      functions.add(funcName);
      return;
    }

    // ----- Deklarasi variabel -----
    const varMatch = line.match(/^(buat|tetap|Angka|Desimal|Teks|Logika|hasil\?)\s+(\w+)/);
    if (varMatch) {
      const varName = varMatch[2];
      currentScope().vars.add(varName);
      return;
    }

    // ----- Tokenisasi -----
    // Skip literal string / angka
    // Hapus string literal, bisa menggunakan dua tipe kutip " atau '
    const cleanedLine = line.replace(/(["'])(?:\\.|[^\\])*?\1/g, "");
    const tokens = cleanedLine.match(/\b\w+\b/g) || [];

    tokens.forEach(token => {
      if (KEYWORDS.has(token) || functions.has(token) || BUILTIN_FUNCS.has(token)) return;

      // Cek apakah token sudah dideklarasikan di scope manapun
      let defined = false;
      for (let s = scopeStack.length - 1; s >= 0; s--) {
        if (scopeStack[s].vars.has(token)) {
          defined = true;
          break;
        }
      }

      if (!defined) {
        errors.push(`Baris ${i + 1}: Variabel "${token}" belum didefinisikan`);
        errors.push(`> ${rawLine}`);
      }
    });
  });

  return errors;
}


// -------------------- Validasi Dasar --------------------
export function validateBraces(lines: string[]) {
  const errors: string[] = [];
  let openBraces = 0;
  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    const open = (line.match(/{/g) || []).length;
    const close = (line.match(/}/g) || []).length;
    openBraces += open - close;
    if (openBraces < 0) {
      errors.push(`${chalk.yellow(`Baris ${i+1}`)}: Terlalu banyak '}'`);
      errors.push(chalk.red(`> ${rawLine}`));
      openBraces = 0;
    }
  });
  if (openBraces > 0) {
    errors.push(chalk.yellow("File memiliki '{' yang belum ditutup"));
  }
  return errors;
}

export function validateParens(lines: string[]) {
  const errors: string[] = [];
  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    const open = (line.match(/\(/g) || []).length;
    const close = (line.match(/\)/g) || []).length;
    if (open !== close) {
      errors.push(
        `${chalk.yellow(`Baris ${i+1}`)}: Jumlah tanda '(' dan ')' tidak sesuai`
      );
      errors.push(chalk.red(`> ${rawLine}`));
    }
  });
  return errors;
}

// -------------------- Async / Await --------------------
export function validateAsyncAwait(lines: string[]) {
  const errors: string[] = [];
  const asyncFuncs = new Set<string>();
  const allFuncs = new Set<string>();
  // 1. Scan deklarasi fungsi terlebih dahulu
  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    const funcDefMatch = line.match(/^(latar\s+)?fungsi\s+(\w+)\s*\(/);
    if (funcDefMatch) {
      const [, asyncKeyword, funcName] = funcDefMatch;

      // Cek duplikat fungsi
      if (allFuncs.has(funcName)) {
        errors.push(`${chalk.yellow(`Baris ${i + 1}`)}: Fungsi "${funcName}" sudah didefinisikan sebelumnya`);
        errors.push(chalk.red(`> ${rawLine}`));
      } else {
        allFuncs.add(funcName);
        if (asyncKeyword) asyncFuncs.add(funcName);
      }
    }
  });

  let insideAsyncFunction = false;
  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (/^latar\s+fungsi\s+\w+\s*\(/.test(line)) insideAsyncFunction = true;
    if (insideAsyncFunction && line.includes("}")) insideAsyncFunction = false;

    if (/^hasil\s+\w+\s*=\s*await\b/.test(line) && !insideAsyncFunction) {
      errors.push(`${chalk.yellow(`Baris ${i+1}`)}: "await" di luar async harus pakai "hasil?"`);
      errors.push(chalk.red(`> ${rawLine}`));
    }

    if (/^hasil\?\s+\w+\s*=/.test(line) && !line.includes("await")) {
      errors.push(`${chalk.yellow(`Baris ${i+1}`)}: "hasil?" hanya boleh dipakai jika ada "await"`);
      errors.push(chalk.red(`> ${rawLine}`));
    }

    if (/\?\s+\w+\s*=/.test(line) && !/^hasil\?/.test(line)) {
      errors.push(`${chalk.yellow(`Baris ${i+1}`)}: Gunakan "?" hanya dengan "hasil?"`);
      errors.push(chalk.red(`> ${rawLine}`));
    }
    
  });
  return errors;
}

// -------------------- Legacy Types --------------------
export function validateLegacyTypes(lines: string[]) {
  const errors: string[] = [];
  
  // 1. Scan deklarasi Legacy Types terlebih dahulu
  const legacyTypes = new Set<string>();
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const legacyTypeMatch = line.match(/^(Angka|Desimal|Teks|Logika)\s+(\w+)\s*=/);
    if (legacyTypeMatch) {
      const [, , varName] = legacyTypeMatch;
      legacyTypes.add(varName);
    }
  });

  // 2. Validasi penggunaan Legacy Types
  const usedLegacyTypes = new Set<string>();
  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    legacyTypes.forEach((varName) => {
      const regex = new RegExp(`\\b${varName}\\b`);
      if (regex.test(line)) {
        usedLegacyTypes.add(varName);
      }
    });
  });

  // 3. Validasi nilai sesuai tipe  
  lines.forEach((rawLine, i) => {
    const nomor = i+1;
    let match;

    if ((match = rawLine.match(/^Angka\s+(\w+)\s*=\s*(.+);?$/))) {
      const [, , value] = match;
      const num = value.trim().replace(/;$/, "");
      if (!/^-?\d+$/.test(num)) {
        errors.push(`${chalk.yellow(`Baris ${nomor}`)}: Nilai untuk "Angka" harus bilangan bulat`);
        errors.push(chalk.red(`> ${rawLine}`));
        errors.push(chalk.cyan(`Contoh: Angka x = 10`));
      }
    }

    else if ((match = rawLine.match(/^Desimal\s+(\w+)\s*=\s*(.+);?$/))) {
      const [, , value] = match;
      const num = value.trim().replace(/;$/, "");
      if (!/^-?\d+(\.\d+)?$/.test(num)) {
        errors.push(`${chalk.yellow(`Baris ${nomor}`)}: Nilai untuk "Desimal" harus angka (boleh desimal)`);
        errors.push(chalk.red(`> ${rawLine}`));
        errors.push(chalk.cyan(`Contoh: Desimal y = 3.14`));
      }
    }

    else if ((match = rawLine.match(/^Teks\s+(\w+)\s*=\s*(.+);?$/))) {
      const [, , value] = match;
      const val = value.trim().replace(/;$/, "");
      if (!/^(['"]).*\1$/.test(val)) {
        errors.push(`${chalk.yellow(`Baris ${nomor}`)}: Nilai untuk "Teks" harus diapit tanda kutip`);
        errors.push(chalk.red(`> ${rawLine}`));
        errors.push(chalk.cyan(`Contoh: Teks nama = "Handrawan"`));
      }
    }

    else if ((match = rawLine.match(/^Logika\s+(\w+)\s*=\s*(.+);?$/i))) {
      const [, , value] = match;
      const val = value.trim().replace(/;$/, "").toLowerCase();
      if (!["benar", "salah", "true", "false"].includes(val)) {
        errors.push(`${chalk.yellow(`Baris ${nomor}`)}: Nilai untuk "Logika" harus "benar", "salah", "true", atau "false"`);
        errors.push(chalk.red(`> ${rawLine}`));
        errors.push(chalk.cyan(`Contoh: Logika aktif = benar`));
      }
    }
  });
  return errors;
}

// -------------------- Deklarasi tanpa inisialisasi --------------------
export function validateVarInit(lines: string[]) {
  const errors: string[] = [];
  lines.forEach((rawLine, i) => {
    if (/^(buat|tetap)\s+\w+\s*;/.test(rawLine.trim())) {
      errors.push(`${chalk.yellow(`Baris ${i+1}`)}: Variabel harus langsung diinisialisasi`);
      errors.push(chalk.red(`> ${rawLine}`));
    }
  });
  return errors;
}

// -------------------- Variabel ganda --------------------
export function validateDuplicateVars(lines: string[]) {
  const errors: string[] = [];
  const declaredVars = new Set<string>();
  lines.forEach((rawLine, i) => {
    const varDecl = rawLine.match(/^(buat|tetap|Angka|Desimal|Teks|Logika)\s+(\w+)\s*=/i);
    if (varDecl) {
      const varName = varDecl[2];
      if (declaredVars.has(varName)) {
        errors.push(`${chalk.yellow(`Baris ${i+1}`)}: Variabel "${varName}" sudah dideklarasikan`);
        errors.push(chalk.red(`> ${rawLine}`));
      } else {
        declaredVars.add(varName);
      }
    }
  });
  return errors;
}

export function validateOwnershipRust(lines: string[]) {
  const errors: string[] = [];
  const ownership: Record<string, boolean> = {}; // true = masih dimiliki, false = sudah diambil

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    // 1. Deklarasi variabel dengan optional RHS
    const decl = line.match(/^(buat|tetap|Angka|Desimal|Teks|Logika)\s+(\w+)\s*(?:=\s*(.+))?/i);
    if (decl) {
      const varName = decl[2];
      const rhs = decl[3] || "";
      ownership[varName] = true;

      // Assignment dari variabel lain → pindahkan ownership dari RHS
      Object.keys(ownership).forEach((v) => {
        if (v === varName) return;
        const regex = new RegExp(`\\b${v}\\b`);
        if (regex.test(rhs) && ownership[v]) {
          ownership[v] = false; // ownership pindah
        }
      });
      return; // jangan cek baris ini sendiri
    }

    // 2. Ambil / take → pindahkan ownership
    const takeMatch = line.match(/^ambil\s+(\w+)/);
    if (takeMatch) {
      const varName = takeMatch[1];
      if (ownership[varName]) ownership[varName] = false;
      return; // jangan cek baris ini sendiri
    }

    // 3. Clone / duplikat → ownership baru
    const cloneMatch = line.match(/^duplikat\s+(\w+)\s+sebagai\s+(\w+)/);
    if (cloneMatch) {
      const [, original, cloneName] = cloneMatch;
      if (ownership[original]) {
        ownership[cloneName] = true; // clone baru punya ownership sendiri
      } else {
        errors.push(`Baris ${i + 1}: Variabel "${original}" sudah diambil, tidak bisa diduplikat`);
        errors.push(`> ${rawLine}`);
      }
      return; // jangan cek baris ini sendiri
    }

    // 4. Cek penggunaan variabel yang sudah diambil
    Object.keys(ownership).forEach((v) => {
      if (ownership[v] === false) {
        const regex = new RegExp(`\\b${v}\\b`);
        if (regex.test(line)) {
          errors.push(`Baris ${i + 1}: Variabel "${v}" sudah diambil`);
          errors.push(`> ${rawLine}`);
        }
      }
    });

    // **Jangan hapus variabel** → biarkan status false tetap ada
  });

  return errors;
}


function validateMatchAndOwnership(code: string): string {
  const result: string[] = [];
  const lines = code.split(/\r?\n/);

  const ownershipVars: Set<string> = new Set();

  for (let rawLine of lines) {
    let line = rawLine.trim();

    // ===== Match 1-bariss =====
    const singleLineMatch = line.match(/^(buat|tetap)\s+(\w+)\s*=\s*match\s+(\w+)\s*\{(.+)\};?$/);
    if (singleLineMatch) {
      const [, kw, targetVar, matchVar, body] = singleLineMatch;

      // Deklarasi variabel target
      result.push(`${kw === "buat" ? "let" : "const"} ${targetVar};`);
      ownershipVars.add(targetVar);

      // Split patterns
      const patterns = body.split(/\s*,\s*/);
      result.push(`switch (${matchVar}) {`);
      for (const pat of patterns) {
        const m = pat.match(/^(.+?)=>\s*(.+)$/);
        if (m) {
          const rawPattern = m[1].trim();
          let expr = m[2].trim();

          // Ownership: jika ekspresi hanya variabel sederhana
          if (/^[a-zA-Z_$][\w$]*$/.test(expr) && ownershipVars.has(expr)) {
            expr = `${expr}; ${expr} = undefined`;
            ownershipVars.delete(expr.split(";")[0].trim()); // hapus yang diambil
          }

          const cases = rawPattern.split("|").map(p => p.trim());
          for (const c of cases) {
            if (c === "_") {
              result.push(`default: ${targetVar} = ${expr}; break;`);
            } else {
              result.push(`case ${c}: ${targetVar} = ${expr}; break;`);
            }
          }
        }
      }
      result.push("}");
      continue;
    }

    // ===== Match multi-baris =====
    const multiLineStart = line.match(/^(buat|tetap)\s+(\w+)\s*=\s*match\s+(\w+)\s*\{?$/);
    if (multiLineStart) {
      // Bisa gunakan versi parser multi-baris lama
      // Untuk sementara push as-is, nanti replace di tahap parser multi-baris
      result.push(rawLine);
      continue;
    }

    // ===== Assignment ownership biasa =====
    const assignMatch = line.match(/^(buat|tetap)\s+(\w+)\s*=\s*([a-zA-Z_$][\w$]*)(\s*;)?$/);
    if (assignMatch) {
      const [, kw, lhs, rhs] = assignMatch;
      if (lhs !== rhs && ownershipVars.has(rhs)) {
        result.push(`let ${lhs} = ${rhs}; ${rhs} = undefined;`);
        ownershipVars.add(lhs);
        ownershipVars.delete(rhs);
      } else {
        result.push(`let ${lhs} = ${rhs};`);
        ownershipVars.add(lhs);
      }
      continue;
    }

    // ===== Baris biasa =====
    result.push(rawLine);
  }

  return result.join("\n");
}

export function validateLegacyTypesWithScope(lines: string[]) {
  const errors: string[] = [];
  const scopeStack: Scope[] = [{ vars: new Set() }];

  function currentScope() {
    return scopeStack[scopeStack.length - 1];
  }

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    // Masuk scope baru
    if (line.includes("{")) {
      scopeStack.push({ vars: new Set() });
    }

    // Keluar scope
    if (line.includes("}")) {
      scopeStack.pop();
    }

    // Validasi deklarasi legacy type
    const match = line.match(/^(Angka|Desimal|Teks|Logika)\s+(\w+)\s*=\s*(.+?);?$/);
    if (match) {
      const [, type, varName, value] = match;
      const val = value.trim();

      if (type === "Angka" && !/^-?\d+$/.test(val)) {
        errors.push(`Baris ${i + 1}: Nilai untuk "Angka" harus bilangan bulat`);
        errors.push(`> ${line}`);
      }

      if (type === "Desimal" && !/^-?\d+\.\d+$/.test(val)) {
        errors.push(`Baris ${i + 1}: Nilai untuk "Desimal" harus angka desimal`);
        errors.push(`> ${line}`);
      }


      if (type === "Teks" && !/^(['"])(.*)\1$/.test(val)) {
        errors.push(`Baris ${i + 1}: Nilai untuk "Teks" harus diapit tanda kutip`);
        errors.push(`> ${line}`);
      }

      if (type === "Logika" && !["benar", "salah", "true", "false"].includes(val.toLowerCase())) {
        errors.push(`Baris ${i + 1}: Nilai untuk "Logika" harus "benar", "salah", "true", atau "false"`);
        errors.push(`> ${line}`);
      }
    }

    // Simpan variabel di scope saat ini
    const varDecl = line.match(/^(buat|tetap|Angka|Desimal|Teks|Logika)\s+(\w+)\s*=/i);
    if (varDecl) {
      const varName = varDecl[2];
      if (currentScope().vars.has(varName)) {
        errors.push(`Baris ${i + 1}: Variabel "${varName}" sudah dideklarasikan di scope ini`);
        errors.push(`> ${line}`);
      } else {
        currentScope().vars.add(varName);
      }
    }


   
  });

  return errors;
}


// -------------------- Custom validation --------------------
export function validateCustom(lines: string[]) {
  const errors: string[] = [];
  // Tambahkan rules baru di sini
  return errors;
}

// -------------------- Validate All --------------------
export function validateAll(lines: string[]) {
  
  return [
    ...validateBraces(lines),
    ...validateParens(lines),
    ...validateAsyncAwait(lines),
    ...validateLegacyTypes(lines),
    ...validateVarInit(lines),
    ...validateDuplicateVars(lines),
    ...validateOwnershipRust(lines),
    ...validateMatchAndOwnership(lines.join("\n")).includes("Baris") ? [validateMatchAndOwnership(lines.join("\n"))] : [],
    ...validateLegacyTypesWithScope(lines),
    ...scanVariablesAndKeywords(lines),

  ];
}
