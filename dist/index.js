
async function __unWrap(promise) {
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
    return x;
}
let value = await __unWrap("wawan");

function ax() {
    console.log("TES DOANG");
}

console.log(value, ucapan);