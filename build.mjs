// Cripteaza app.src.html -> data.bin si genereaza index.html (pagina de deblocare).
// Folosire:  node build.mjs "parola-aleasa"
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const ITER = 600000;
const SRC = "app.src.html";
const OUT_DATA = "data.bin";
const OUT_PAGE = "index.html";

const password = process.argv[2];
if (!password) {
  console.error('Lipseste parola.  Folosire:  node build.mjs "parola"');
  process.exit(1);
}

const plaintext = readFileSync(SRC);
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await crypto.subtle.importKey(
  "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
  baseKey,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"]
);
const ciphertext = new Uint8Array(
  await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
);

// Format: salt(16) | iv(12) | ciphertext, totul base64.
const blob = new Uint8Array(salt.length + iv.length + ciphertext.length);
blob.set(salt, 0);
blob.set(iv, salt.length);
blob.set(ciphertext, salt.length + iv.length);
writeFileSync(OUT_DATA, Buffer.from(blob).toString("base64"));

writeFileSync(OUT_PAGE, page(ITER));
console.log(`OK  sursa ${plaintext.length} octeti  ->  ${OUT_DATA} ${blob.length} octeti (base64)`);

function page(iter) {
  return `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="CECCAR">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="theme-color" content="#1f5c4a">
<meta name="robots" content="noindex, nofollow">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<title>CECCAR: exersare Contabilitate</title>
<style>
:root{
  --paper:#F5F7F4; --sheet:#FFFFFF; --ink:#1A2230; --muted:#5B6573;
  --rule:#D6DDD5; --ledger:#1F5C4D; --storno:#A3262B; --focus:#2B6CB0;
  color-scheme:light;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --paper:#141A20; --sheet:#1B232B; --ink:#E6EAE6; --muted:#9AA5B1;
    --rule:#33403F; --ledger:#6FC3A8; --storno:#F08A8D; --focus:#7FB2F0;
    color-scheme:dark;
  }
}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;height:100%}
body{
  background:var(--paper); color:var(--ink);
  font:400 16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;
  display:grid; place-items:center; padding:24px;
  padding-top:calc(24px + env(safe-area-inset-top,0px));
  padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));
}
.card{
  width:100%; max-width:380px; background:var(--sheet);
  border:1px solid var(--rule); border-radius:14px; padding:28px 24px;
  box-shadow:0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05);
}
.mark{
  width:44px; height:44px; border-radius:11px; background:var(--ledger);
  display:grid; place-items:center; margin:0 0 18px;
  color:#fff; font-weight:700; font-size:17px; letter-spacing:.02em;
}
h1{margin:0 0 6px; font-size:19px; font-weight:600; letter-spacing:-.01em}
p.sub{margin:0 0 22px; color:var(--muted); font-size:14px}
label{display:block; font-size:13px; font-weight:500; margin:0 0 7px; color:var(--muted)}
input[type=password]{
  width:100%; padding:12px 14px; font-size:16px; font-family:inherit;
  color:var(--ink); background:var(--paper);
  border:1px solid var(--rule); border-radius:9px; -webkit-appearance:none;
}
input[type=password]:focus{outline:2px solid var(--focus); outline-offset:1px; border-color:transparent}
.row{display:flex; align-items:center; gap:8px; margin:14px 0 20px}
.row input{width:16px; height:16px; accent-color:var(--ledger); margin:0}
.row label{margin:0; font-size:13.5px; color:var(--ink); font-weight:400}
button{
  width:100%; padding:12px 16px; font:600 15px/1 inherit; color:#fff;
  background:var(--ledger); border:0; border-radius:9px; cursor:pointer;
}
button:disabled{opacity:.6; cursor:default}
button:focus-visible{outline:2px solid var(--focus); outline-offset:2px}
.msg{margin:14px 0 0; font-size:13.5px; min-height:1.2em; color:var(--storno)}
.msg[data-kind="info"]{color:var(--muted)}
</style>
</head>
<body>
<main class="card">
  <div class="mark" aria-hidden="true">CC</div>
  <h1>Exersare Contabilitate</h1>
  <p class="sub">Materialul este protejat. Introdu parola pentru a continua.</p>
  <form id="f">
    <label for="p">Parola</label>
    <input id="p" type="password" autocomplete="current-password" autocapitalize="off"
           autocorrect="off" spellcheck="false" required>
    <div class="row">
      <input id="r" type="checkbox" checked>
      <label for="r">Tine minte pe acest telefon</label>
    </div>
    <button id="b" type="submit">Deschide</button>
    <p class="msg" id="m" role="status" aria-live="polite"></p>
  </form>
</main>
<script>
(function(){
  "use strict";
  var ITER = ${iter}, STORE = "ceccar.k";
  var f=document.getElementById("f"), p=document.getElementById("p"),
      r=document.getElementById("r"), b=document.getElementById("b"), m=document.getElementById("m");
  var dataPromise = fetch("data.bin", {cache:"no-cache"}).then(function(res){
    if(!res.ok) throw new Error("fetch " + res.status);
    return res.text();
  });

  function say(text, kind){ m.textContent = text; m.setAttribute("data-kind", kind || "error"); }
  function b64ToBytes(s){
    var bin = atob(s.trim()), out = new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function store(rawKey){
    try{
      var b = new Uint8Array(rawKey), s = "";
      for(var i=0;i<b.length;i++) s += String.fromCharCode(b[i]);
      localStorage.setItem(STORE, btoa(s));
    }catch(e){/* mod privat sau storage blocat - mergem mai departe */}
  }
  function forget(){ try{ localStorage.removeItem(STORE); }catch(e){} }

  function show(html){
    document.open();
    document.write(html);
    document.close();
  }

  async function decryptWith(key, blob){
    var salt = blob.subarray(0,16), iv = blob.subarray(16,28), ct = blob.subarray(28);
    var buf = await crypto.subtle.decrypt({name:"AES-GCM", iv:iv}, key, ct);
    return new TextDecoder().decode(buf);
  }

  async function keyFromPassword(password, salt, extractable){
    var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password),
      "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      {name:"PBKDF2", salt:salt, iterations:ITER, hash:"SHA-256"},
      base, {name:"AES-GCM", length:256}, !!extractable, ["decrypt"]);
  }

  // Incercam cheia memorata, ca sa nu mai cerem parola la fiecare deschidere.
  (async function auto(){
    var saved = null;
    try{ saved = localStorage.getItem(STORE); }catch(e){}
    if(!saved) return;
    try{
      var blob = b64ToBytes(await dataPromise);
      var key = await crypto.subtle.importKey("raw", b64ToBytes(saved),
        {name:"AES-GCM"}, false, ["decrypt"]);
      show(await decryptWith(key, blob));
    }catch(e){ forget(); }
  })();

  f.addEventListener("submit", async function(ev){
    ev.preventDefault();
    b.disabled = true; say("Se deschide...", "info");
    try{
      var blob = b64ToBytes(await dataPromise);
      var salt = blob.subarray(0,16);
      var key = await keyFromPassword(p.value, salt, r.checked);
      var html = await decryptWith(key, blob);
      if(r.checked){
        try{ store(await crypto.subtle.exportKey("raw", key)); }catch(e){}
      } else { forget(); }
      show(html);
    }catch(err){
      b.disabled = false;
      say(err && err.name === "OperationError" ? "Parola gresita. Mai incearca." :
          "Nu s-a putut incarca materialul. Verifica internetul.");
      p.select();
    }
  });
})();
</script>
</body>
</html>
`;
}
