// src/core/replacer.ts
export function applyReplacements(code: string): string {
  const replacements: [RegExp, string][] = [
    // ===== Deklarasi Variabel =====
    [/\bAngka\s+([a-zA-Z_$][\w$]*)\s*=\s*(-?\d+);?/g, "let $1 = $2;"],
    [
      /\bDesimal\s+([a-zA-Z_$][\w$]*)\s*=\s*(-?\d+(?:\.\d+)?);?/g,
      "let $1 = $2;",
    ],
    [/\bTeks\s+([a-zA-Z_$][\w$]*)\s*=\s*['"](.*?)['"];?/g, 'let $1 = "$2";'],
    [
      /\bLogika\s+([a-zA-Z_$][\w$]*)\s*=\s*(benar|salah);?/gi,
      "let $1 = $2;",
    ],

    // ===== Fungsi =====
    [
      /\basinkron\s+fungsi\s+([a-zA-Z_$][\w$]*)\s*\((.*?)\)\s*\{/g,
      "async function $1($2) {",
    ],
    [/\bfungsi\s+([a-zA-Z_$][\w$]*)\s*\((.*?)\)\s*\{/g, "function $1($2) {"],
    [/\bkembalikan\s+(.*?);/g, "return $1;"],

    // ===== Konversi Tipe =====
    [/\bkeAngka\s*\((.*?)\)/g, "Number($1)"],
    [/\bkeDesimal\s*\((.*?)\)/g, "parseFloat($1)"],
    [/\bkeTeks\s*\((.*?)\)/g, "String($1)"],
    [/\bkeLogika\s*\((.*?)\)/g, "Boolean($1)"],
    [/\b.keBiner\s*\((.*?)\)/g, ".toString(2)"],
    [/\b.keOktal\s*\((.*?)\)/g, ".toString(8)"],
    [/\b.keDesimal\s*\((.*?)\)/g, ".toString(10)"],
    [/\b.keHeksa\s*\((.*?)\)/g, ".toString(16)"],

    // ===== Logika dan perulangan =====
    [/\bjika\s*(\()/g, "if$1"],
    [/\blain\s+jika\s*(\()/g, "else if$1"],
    [/\blain\s*\{/g, "else {"],
    [/\bulang\s*\((.*?)\)\s*\{/g, "for ($1) {"],
    [/\bsaat\s*\((.*?)\)\s*\{/g, "while ($1) {"],

    // ===== Nilai literal =====
    [/\bbenar\b/g, "true"],
    [/\bsalah\b/g, "false"],
    [/\bhilang\b/g, "null"],

    // ===== Penulisan variabel umum =====
    [/\bbuat\s+/g, "let "],
    [/\btetap\s+/g, "const "],

    // ===== Print ke konsol =====
    [/\btulis\s*\((.*?)\);?/g, "console.log($1);"],
  ];

  // Apply top-level await jika perlu
  code = applyTopLevelAwaitIfNeeded(code);

  // 2. Ambil / take → comment saja
  code = code.replace(/^\s*ambil\s+(\w+);?/gm, (_, varName) => `/* ambil ${varName} */`);

  // 3. Clone / duplikat → gunakan structuredClone agar ownership terpisah
  code = code.replace(
    /^\s*duplikat\s+(\w+)\s+sebagai\s+(\w+);?/gm,
    (_, original, cloneName) => `let ${cloneName} = structuredClone(${original});`
  );

  code = replaceMatchToJS(code);

  code = code.replace(
  /^\s*(buat|tetap)\s+(\w+)\s*=\s*([a-zA-Z_$][\w$]*)(\s*;)?/gm,
  (_, keyword, lhs, rhs) => {
    // Jangan lakukan ownership jika RHS bukan variabel sederhana
    if (/^[a-zA-Z_$][\w$]*$/.test(rhs) && lhs !== rhs) {
      return `let ${lhs} = ${rhs}; ${rhs} = undefined;`;
    }
    return `let ${lhs} = ${rhs};`;
  }
);


  let result = code;
  for (const [regex, replacement] of replacements) {
    result = result.replace(regex, replacement);
  }

  return result;
}

function replaceMatchToJS(code: string): string {
  return code.replace(
    /(buat|tetap)\s+(\w+)\s*=\s*match\s+(\w+)\s*\{([^}]*)\};?/g,
    (_, keyword, targetVar, matchVar, body) => {
      const lines = body.split(",");
      const jsLines: string[] = [];
      lines.forEach(line => {
        const m = line.trim().match(/^(.+?)=>\s*(.+)$/);
        if (m) {
          const patterns = m[1].trim().split("|").map(p => p.trim());
          const expr = m[2].trim();
          patterns.forEach(p => {
            if (p === "_") {
              jsLines.push(`default: ${targetVar} = ${expr}; break;`);
            } else {
              jsLines.push(`case ${p}: ${targetVar} = ${expr}; break;`);
            }
          });
        }
      });
      return `${keyword === "buat" ? "let" : "const"} ${targetVar};\nswitch (${matchVar}) {\n${jsLines.join("\n")}\n}`;
    }
  );
}


function applyTopLevelAwaitIfNeeded(code: string): string {
  // Cek apakah ada syntax 'hasil? nama = await ...;'
  const hasTopLevelAwait = /^\s*hasil\?\s+[a-zA-Z_]\w*\s*=\s*await\s+.+;?/m.test(code);

  if (!hasTopLevelAwait) return code; // kalau nggak ada, kembalikan kode asli

  // Inject wrapper jika belum ada
  if (!code.includes("async function __awaitWrap(")) {
    const wrapper = `
async function __awaitWrap(promise) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

`;
    code = wrapper + code;
  }

  // Replace 'hasil? nama = await ekspresi;' → top-level await
  code = code.replace(
    /^\s*hasil\?\s+([a-zA-Z_]\w*)\s*=\s*await\s+(.+?);?$/gm,
    (_, varName, expr) => `let ${varName} = await __awaitWrap(${expr});`
  );

  return code;
}
