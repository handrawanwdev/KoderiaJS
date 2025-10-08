import { validateAll } from "./validator-modular";
import { applyReplacements } from "./replacer";

/**
 * Transpile kode IndoJS menjadi JavaScript
 * Akan melempar error jika validasi gagal
 */
export function transpileBahasaIndoJS(code: string, filename = "file.ina"): string {
  const lines = code.split("\n");
  const errors = validateAll(lines);

  if (errors.length > 0) {
    const errMsg =
      `Kesalahan di ${filename}:\n` + errors.map((e) => "  " + e).join("\n");
    throw new Error(errMsg);
  }

  // Gabungkan kode sebelum replacement
  const joinedCode = lines.join("\n");

  // Pastikan applyReplacements mengembalikan string
  const out: string = applyReplacements(joinedCode);

  return out;
}
