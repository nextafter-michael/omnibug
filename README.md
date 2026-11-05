Omnibug
==========

Ensuring the seamless performance of your MarTech tools should be a breeze, yet the reality is often quite the opposite. Many vendors fall short in providing user-friendly solutions, leaving businesses grappling with technical complexities, poor documentation, and a plethora of outdated browser extensions. Enter Omnibug – your simplified quality assurance partner, designed to effortlessly streamline the process and put the power back in your hands.

For further details, see the [main project page](https://omnibug.io/).

## Get it
[Chrome](https://chrome.google.com/webstore/detail/omnibug/bknpehncffejahipecakbfkomebjmokl?utm_source=githubo&utm_medium=readme&utm_campaign=omnibug.io-2020), 
[Edge](https://microsoftedge.microsoft.com/addons/detail/omnibug/eideoafecdnkjfiomaaplogicinmmlee?utm_source=githubo&utm_medium=readme&utm_campaign=omnibug.io-2020), 
[Firefox](https://addons.mozilla.org/en-US/firefox/addon/omnibug/?utm_source=githubo&utm_medium=readme&utm_campaign=omnibug.io-2020)

## Contributing
We're always looking for contributors to the project! Whether you're a developer wanting to add new features, or a 
platform looking to add their tool to Omnibug, we're excited for your input. You can learn more on our [contributing page](CONTRIBUTING.md).


## Custom Chrome build

This fork is maintained independently. Platform changes live on separate local feature branches and are merged into `staging` for local Chrome testing. Nothing is automatically published or pushed upstream.

| Feature branch | Coverage |
| --- | --- |
| `codex/vwo` | JSON events, regional endpoints, legacy exposure/goal beacons, and script initialization |
| `codex/optimizely` | Legacy events and modern batched decisions/conversions; retains the `OPTIMIZELYX` settings key |
| `codex/adobe-target` | Legacy mbox, Delivery API execution/prefetch/notifications, and Target/personalization detail groups in Adobe Web SDK |
| `codex/nextafter-pixel-legacy` | `pxl.nextafter.org/tracker.php` conversions only; excludes reporting endpoints |
| `codex/taboola` | Browser `unip` events, account IDs, and conversion parameters |
| `codex/retention` | SDK loads and verified collection, suppression, order, and event endpoints, including Base64 JSON bodies |
| `codex/decide` | Supplied `cdn1.decide.dev/tracking/*_lander.js` and `*_donation.js` script requests |
| `codex/stackadapt` | Universal pixels, conversion pixels, and audience/page tracking |
| `codex/radiant` | Patheos lead relays, versioned Facebook conversion relays, and Pathfinder pending/conversion/frame impressions |

`codex/provider-icons` supplies the platform favicons and their source list. `codex/request-body-decoding` preserves complete UTF-8 POST payloads across upload chunks.

### Build and load

From `staging`, install dependencies and build:

```sh
yarn install --frozen-lockfile
yarn grunt build-production:chrome
```

In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `platform/chromium` directory. After rebuilding, reload the extension and reopen the inspected page's DevTools. The Omnibug panel shows requests sent while DevTools is open.

The Chrome ZIP is generated in `build/`. Generated provider bundles, CSS, `platform/`, and ZIPs are ignored by Git; edit the original JavaScript and SCSS sources.

### Validation

Provider tests use AVA and the existing browser mocks. The legacy AVA/esm stack is incompatible with Node 24; the repository's original Node 12 runtime runs the legacy test stack. This compatibility invocation runs it without changing the installed system Node:

```sh
npx --yes --package=node@12 -- node node_modules/yarn/bin/yarn.js test --concurrency=2
```

New and modified providers should also be linted explicitly with `eslint --no-ignore`, because the inherited ESLint configuration broadly ignores source files.

Validation on 2026-11-05: the Chrome build, explicit provider lint, compiled script/manifest checks, and all 45 tests in changed suites pass. The full test-and-coverage command reports 330 passing tests, 5 failures and 24 TODOs. The same five failures were reproduced against an untouched `master` snapshot with the same runtime/dependencies:

- Three tracker tests expect an enabled analytics implementation, while the existing tracker is a disabled stub.
- One settings test asserts a Node-version-specific exception message.
- One SplitIO test calls its JSON parser without a request body.

These unrelated baseline failures remain unchanged. The full suite therefore does not exit successfully even though the integration tests pass.


### Request interpretation

- One row represents one network request. Batched events retain their indexes in expanded details rather than being assigned to experiments or visitors that were not sent in the payload.
- Known parameters receive readable names/groups; additional transmitted fields remain visible. Missing donation type, currency, or experiment names are not invented.
- A script load confirms a request for the script. Decide tracker loads and Retention/Pathfinder initialization are not proof that downstream conversion processing succeeded. Decide's downstream beacon format has not yet been verified.
- Retention matching uses known SDK hosts and paths rather than claiming arbitrary AWS traffic. Other SDK host variants need captured requests before extending the matcher.
- Pathfinder pending impressions, standalone conversion impressions, and frame impressions have separate labels. Frame-mode or manual-mode `complete` calls may only send `postMessage` or invoke configured webhooks; those do not guarantee a dedicated Pathfinder request.
- Adobe Web SDK traffic keeps its existing provider identity. Shared Edge traffic is not automatically relabeled as Adobe Target, and returned offer content or activity names are not inferred from outgoing requests.
- Tests use synthetic/sanitized fixtures. No real donations, contacts, or conversion events are submitted during validation. End-to-end validation against the team's actual pages is still required before a remote push.

Implementation references: [VWO event payload](https://gist.github.com/vwo-kb/7868280b25961e21db6ecf7ea1ded9c3), [Optimizely Event API](https://docs.optimizely.com/experimentation-strategy/data-api/log-endpoint), [Adobe Target](https://experienceleague.adobe.com/en/docs/target-dev/developer/api/delivery-api/overview), [Taboola browser SDK](https://cdn.taboola.com/libtrc/unip/123456/tfa.js), [Retention setup](https://support.retention.com/en/articles/8826332-custom-website-installation-guide), and [StackAdapt browser SDK](https://tags.srv.stackadapt.com/events.js). NextAfter, Decide and Radiant formats also use the implementation documentation/snippets supplied for this fork. Icon sources are recorded in [SOURCES.md](src/assets/images/icons/SOURCES.md).
