# Connection Fix v6 Audit

Version: 2.2.17

## Fix applied

The v5 direct mx patch had a JavaScript temporal-dead-zone bug inside `tfRespondConnectionDirect`:

```js
const r = setTimeout(...);
chrome.tabs.query({}, (e) => {
  clearTimeout(r);
  const r = Array.isArray(e) ? e : [];
});
```

Because the callback declared its own `const r`, the earlier `clearTimeout(r)` referenced the inner `r` before initialization. Chrome reported:

```text
ReferenceError: Cannot access 'r' before initialization
```

v6 renames those variables to explicit names (`timeoutId`, `tabsResult`, `tabs`, `flowTabs`) and keeps the same direct connection behavior.

## Additional repair

Restored the original sidepanel globals:

```js
let e = null, t = null;
```

The original TurboFlow sidepanel used these for temporary status badge overrides. The modified/unminified build had dropped them.

## Validation

- `node --check src/background/runtime.js`
- `node --check src/sidepanel/sidepanel.js`
- `manifest.json` parsed and version bumped to 2.2.17
- `src/background/service-worker.js` remains a one-line importer: `importScripts("runtime.js");`
