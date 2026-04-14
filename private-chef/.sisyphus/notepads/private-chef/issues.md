## T02 Issues (2026-04-10)

- `vitest@4.x` requires `@types/node@^20` but project uses `@types/node@^18`. Used `--legacy-peer-deps` to work around. This will need resolution when vitest is actually used (T-tests).
- Node v18.17.1 is below vitest@4.x engine requirement (`^20.0.0`). Tests won't run until Node is upgraded or vitest is downgraded.

### PWA Precache globbing failure with Node 18
- **Issue:** Using newer versions of `vite-plugin-pwa` (e.g. `0.21.1`) installed `workbox-build@7.4.0` under the hood, crashing the build with `TypeError: (0 , L.tracingChannel) is not a function`.
- **Fix:** Fixed by explicitly pinning `vite-plugin-pwa` to `^0.17.0` which resolves to a `workbox-build` version fully compatible with Node 18 globbing APIs.
