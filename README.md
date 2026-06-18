# `getSnapshotData` swallows the parse error, making snapshot failures impossible to debug

## What happens

In browser mode, when the page is served with a CSP that blocks `eval` (no `'unsafe-eval'`), external `.snap` files silently fail to load. The snapshot data ends up empty, which produces 1 failed snapshot and 1 obsolete snapshot. 

The `.snap` file parses fine in Node. The actual cause is never reported.

**NOTE** This happens only when `CI=true` is set, which is the default in GitHub Actions. There is no error in non-CI mode, which makes this even more confusing to debug.

## Reproduction

`npm run test:ci`

```
 FAIL   browser (chromium)  src/repro.test.ts > repro > should match snapshot
Error: Snapshot `repro > should match snapshot 1` mismatched

Failure screenshot:
  - src/__screenshots__/repro.test.ts/repro-should-match-snapshot-1.png

 ❯ src/repro.test.ts:5:21
      3| describe("repro", () => {
      4|   it("should match snapshot", () => {
      5|     expect({ a: 1 }).toMatchSnapshot(); // external .snap → new Function → CSP blocks it
       |                     ^
      6|   });
      7| });

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


  Snapshots  1 failed
             1 files obsolete

 Test Files  1 failed (1)
      Tests  1 failed (1)
   Start at  15:23:36
   Duration  1.64s (transform 0ms, setup 0ms, import 6ms, tests 105ms, environment 0ms)
```

`npm run test` (without `CI=true`) works fine

## Why

`getSnapshotData` parses `.snap` files with `new Function("exports", contents)`, which CSP blocks. The resulting error is thrown away:

```js
// @vitest/snapshot/dist/index.js
try {
  snapshotContents = content;
  const populate = new Function("exports", snapshotContents);
  populate(data);
} catch {} // <- error discarded, data stays empty
```

With the `catch {}` in place there's nothing in the logs pointing at CSP/eval. Adding a `console.log(err)` there immediately surfaces the real error.

## Proposed solution

The `catch {}` should be removed, or at least the error should be logged. This would make snapshot failures in browser mode much easier to debug.