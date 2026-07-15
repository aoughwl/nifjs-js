# nifjs

A `.s.nif` → **native-JavaScript** backend for [nimony](https://github.com/nim-lang/nimony).

`nifjs` reads a typed nimony NIF (`.s.nif`) — the artifact the compiler emits
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
pointers, ARC, C FFI), but slow (`DataView` per access) and mangled. `nifjs` works
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
const njs = require("./nifjs.js");   // browser: window.NifiAssemble-style global `NifiJs`
njs.run(snifText);        // -> program output (string)
njs.compile(snifText);    // -> emitted JavaScript source (string)
```

Get a `.s.nif` from nimony: `nimony c yourfile.nim` writes them into the nimcache;
the playground produces them in-browser via `nifparser` → `nimsem`.

## Coverage

Supported today: procs and recursion; `int`/`float` arithmetic and comparisons;
`if`/`elif`/`else` and `case` (statement and expression, incl. ranges); `while`;
`for` over integer ranges and over collections; `inc`/`dec`; `seq`/array literals
(`@[…]`), `len`, indexing, `add`; `string` concatenation and `$`; `echo`; `bool`
— enough for the whole FizzBuzz / primes / Collatz / seq-building class of
program. Anything outside the subset makes the transpiler throw `unsupported …`
(the playground then falls back to the faithful interpreter, so correctness is
never worse than a normal run).

Growing next: `Table`/`HashSet`, objects / tuples / variants, exceptions,
closures, and monomorphized generics.

The fidelity trade-off: native JS numbers are exact only to 2⁵³ (not full int64
wraparound), and there's no pointer identity / ARC timing / C FFI — which is why
the faithful backend stays the default for exact semantics.

**📖 Full docs → [aoughwl.github.io/docs/nifjs](https://aoughwl.github.io/docs/nifjs)**

## License

MIT — see [LICENSE](LICENSE).
