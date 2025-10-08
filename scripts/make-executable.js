import { chmod } from "fs";

chmod("dist/cli.js", 0o755, (err) => {
  if (err) console.error("Gagal set permission:", err);
  else console.log("✅ File dist/cli.js siap dijalankan!");
});
