// src/core/transpiler.ts
export function transpileBahasaIndoJS(code) {
    const replacements = [
        // Import & ekspor
        [/\bekspor\s+jenis\b/g, 'export type'],
        [/\bekspor\s+antarmuka\b/g, 'export interface'],
        [/\bekspor\s+bawa\s+(\w+)\b/g, 'export { $1 };'],
        [/\bekspor\s+default\s+(\w+)\b/g, 'export default $1;'],
        [/\bekspor\b/g, 'export'],
        [/\bimpor\s+bawa\s+(\w+)\b/g, 'import { $1 }'],
        [/\bimpor\s+jenis\b/g, 'import type'],
        [/\bimpor\b/g, 'import'],
        [/\bdari\b/g, 'from'],
        [/\bbutuh\b/g, 'require'],
        // Fungsi & variabel
        [/\bfungsi\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(\()/g, 'function $1$2'],
        [/\b(buat|tetap)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'let $1'],
        // integer
        [/\b(buat|tetap)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([0-9]+);/g, 'int $1 = $2;'],
        // float / double
        [/\b(buat|tetap)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([0-9]+\.[0-9]+);/g, 'double $1 = $2;'],
        // string
        [/\b(buat|tetap)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*["'](.*?)["'];/g, 'String $1 = "$2";'],
        // boolean
        [/\b(buat|tetap)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*benar;/g, 'boolean $1 = true;'],
        [/\b(buat|tetap)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*salah;/g, 'boolean $1 = false;'],
        // [/\btetap\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'const $1'],
        [/\btipe\s+([A-Z][a-zA-Z0-9_]*)\s*=/g, 'type $1 ='],
        [/\bantarmuka\s+([A-Z][a-zA-Z0-9_]*)\s*\{/g, 'interface $1 {'],
        // Logika & alur
        [/\blain\s+jika\s*(\()/g, 'else if$1'],
        [/\blain\s*\{/g, 'else {'],
        [/\bjika\s*(\()/g, 'if$1'],
        [/\blain\b/g, 'else'],
        [/\buntuk\s*(\()/g, 'for$1'],
        [/\bselama\s*(\()/g, 'while$1'],
        [/\blakukan\b/g, 'do'],
        [/\bkembali\b/g, 'return'],
        [/\bberhenti\b/g, 'break'],
        [/\blanjut\b/g, 'continue'],
        // Nilai boolean & null
        [/\bbenar\b/g, 'true'],
        [/\bsalah\b/g, 'false'],
        [/\bkosong\b/g, 'null'],
        [/\btakTerdefinisi\b/g, 'undefined'],
        // Kelas & objek
        [/\bkelas\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, 'class $1'],
        [/\bkonstuktor\b/g, 'constructor'],
        [/\bkonstruktor\b/g, 'constructor'],
        [/\bini\b/g, 'this'],
        // Async & await
        [/\basinkron\b/g, 'async'],
        [/\btunggu\b/g, 'await'],
        // Console.log
        [/\btulis\s*(\()/g, 'console.log$1'],
        // Method umum
        [/\.panjang\b/g, '.length'],
        [/\.peta\s*(\()/g, '.map$1'],
        [/\.saring\s*(\()/g, '.filter$1'],
        [/\.ulangTerus\s*(\()/g, '.forEach$1'],
    ];
    let result = code;
    for (const [regex, replacement] of replacements) {
        result = result.replace(regex, replacement);
    }
    return result;
}
