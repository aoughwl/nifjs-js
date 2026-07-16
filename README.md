# nifjs-js

A `.s.nif` → **native-JavaScript** backend for [nimony](https://github.com/nim-lang/nimony).

`nifjs-js` reads a typed nimony NIF (`.s.nif`) — the artifact the compiler emits
after `nimsem`, with symbols resolved and overloads picked — and transpiles it to
**real JavaScript**, mapping nimony values onto native JS values (`int`/`float` →
`number`, `string` → `string`, `seq` → `Array`, `bool` → `boolean`) instead of
onto a simulated linear memory. The browser's JIT then compiles the result, so it
runs at **near-native-JS speed** and the emitted code is **readable**.

It is the **Native JS** engine in the
[nimony playground](https://aoughwl.github.io/playground/).

## Why it's fast *and* readable

Nimony's faithful web backend ([`nimony-web`](https://github.com/aoughwl/nimony-web))
lowers to a C-like IR and simulates one linear `ArrayBuffer` — exact (int64,
pointers, ARC, C FFI), but slow (`DataView` per access) and mangled. `nifjs-js` works
from the **higher-level typed IR** and emits native values, so it is fast *and*
legible for the same reason. It's the fast path; the interpreter
([`nifi`](https://github.com/aoughwl/nifi)) is the faithful fallback.

```
$ node run.js --emit examples/fib.s.nif
function fib(n){
  if ((n < 2)) { return n; }
  return (fib((n - 1)) + fib((n - 2)));
}
…
```

Measured on a tight arithmetic loop: **~2.1 ns/iter** (native-JS speed),
**~18,000–28,000× faster** than the interpreter, 10 M iterations in ~21 ms with
no out-of-memory. Output is byte-identical to the interpreter on supported
programs.

## Use

Zero dependencies — one JS file.

```sh
node run.js examples/fizz.s.nif          # transpile + run
node run.js --emit examples/fib.s.nif    # print the emitted JavaScript
```

Or as a library (browser or Node):

```js
const njs = require("./nifjs-js.js");   // browser: window.NifiAssemble-style global `NifiJs`
njs.run(snifText);        // -> program output (string)
njs.compile(snifText);    // -> emitted JavaScript source (string)
```

Get a `.s.nif` from nimony: `nimony c yourfile.nim` writes them into the nimcache;
the playground produces them in-browser via `nifparser` → `nimsem`.

## Coverage

Coverage is broad — nifjs-js runs essentially all of the language nimony can
currently express: procs and recursion (mutual **and nested / closures**);
**generic** instances (monomorphised); `int` **and** `float` arithmetic (float
`/` kept distinct from integer `div`) and comparisons; logical `and`/`or`/`not`
**and** bitwise `and`/`or`/`xor`/`not`/`shl`/`shr`; `if`/`elif`/`else` **and
if-expressions**; `case` (statement and expression, ranges, string selectors);
`while` with `break`/`continue`; `for` over ranges, collections, `countdown`, and
`for i, x in` pairs; `inc`/`dec`; `const`, **enums** (→ ordinals), `when`,
`discard`; `seq`/array literals (`@[…]`), `len`, indexing (get/set), `add`/`pop`;
**objects** (construct / field read+write, incl. through a seq), object
**variants**, and **tuples** (construct / access / unpack); `string` concat,
`add`, `$`, `len`, indexing, `ord`/`chr`; `echo` (float-aware); `bool`. Anything
outside makes the transpiler throw `unsupported …` and fall back to the
interpreter.

Plus **enums** (values → ordinals), **const**, fixed-size **arrays**, and a
**shim registry** — the native-JS equivalent of stdlib / `importc` routines
(`math.*` → `Math.*`, `strutils.*` → `String`/`Array` methods, `parseInt`/…),
keyed by proc name, so those run at native speed with no body to transpile and
no marshaling. This is nifjs-js's FFI story: a user proc of the same name always
wins; otherwise a matching shim is emitted directly.

**Robustness & safety:** nifjs-js never emits a reference to a routine it didn't
build — a call to a proc/func it can't transpile (a complex stdlib routine, an
unsupported node) triggers a clean fall back to the interpreter rather than a
runtime crash. A `var`/`out` parameter (whose mutation can't round-trip through
JS's pass-by-value) drops the routine so its callers fall back too — never
silently wrong. Correctness is never worse than a normal run.

Growing next: `Table`/`HashSet`, objects / tuples / variants, exceptions,
closures, and monomorphized generics.

The fidelity trade-off: native JS numbers are exact only to 2⁵³ (not full int64
wraparound), and there's no pointer identity / ARC timing / C FFI — which is why
the faithful backend stays the default for exact semantics.

**📖 Full docs → [aoughwl.github.io/docs/nifjs-js](https://aoughwl.github.io/docs/nifjs-js)**

## License

MIT — see [LICENSE](LICENSE).
