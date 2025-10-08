
async function __awaitWrap(promise) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

let x = 10;
let xy = x; x = undefined;
console.log(xy); 

let hari = "Selasa";
let ucapan;
switch (hari) {
case "Senin": ucapan = "Awali minggu"; break;
case "Selasa": ucapan = "Hello Semangat Kerja Baru"; break;
case "Rabu": ucapan = "Hello Semangat Kerja Baru"; break;
}

async function sayTo() {
    let x = 20.2;
    return "Hello Handrawan";
}
let value = await __awaitWrap(sayTo());

console.log(value, ucapan);