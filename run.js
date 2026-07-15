#!/usr/bin/env node
// run.js — transpile a typed nimony NIF (.s.nif) to JavaScript with nifjs and
// run it (or just print the emitted JS).
//
//   node run.js <file.s.nif>          transpile + run, print program output
//   node run.js --emit <file.s.nif>   print the emitted JavaScript instead
//
// nifjs covers a growing subset of the language; on anything it doesn't support
// it throws `nifjs: unsupported …` (in the playground that triggers a fall back
// to the faithful nifi interpreter).
"use strict";
const fs = require("fs");
const path = require("path");
const njs = require(path.join(__dirname, "nifjs.js"));

const args = process.argv.slice(2);
const emit = args[0] === "--emit";
const file = emit ? args[1] : args[0];
if (!file) {
  console.error("usage: node run.js [--emit] <file.s.nif>");
  process.exit(2);
}

const snif = fs.readFileSync(file, "utf8");
try {
  if (emit) process.stdout.write(njs.compile(snif) + "\n");
  else process.stdout.write(njs.run(snif));
} catch (e) {
  console.error("nifjs: " + (e && e.message || e));
  process.exit(1);
}
