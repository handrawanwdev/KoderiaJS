
async function __awaitWrap(promise) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

let x = 10;
let xy = x; x = undefined;
console.log(xy);     // ✅ aman

let hari = "Selasa";
let ucapan;
switch (hari) {
case "Senin": ucapan = "Awali minggu"; break;
case "Selasa": ucapan = xy; break;
case "Rabu": ucapan = xy; break;
}

async function sayTo() {
    return "Hello Handrawan";
}
let value = await __awaitWrap(sayTo());

console.log(value);