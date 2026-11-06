import test from "ava";
import NextAfterPixelLegacyProvider from "../source/providers/NextAfterPixelLegacy.js";
import { OmnibugProvider } from "../source/providers.js";

test("NextAfter matches conversion hits and excludes data fetches and lookalike hosts", t => {
    const provider = new NextAfterPixelLegacyProvider();
    t.true(provider.checkUrl("https://pxl.nextafter.org/tracker.php?id=client&amt=25"));
    ["get.php", "get_cors.php", "all_donations_cors.php", "tracker.php/extra", "tracker.php.bak"].forEach(path => {
        t.false(provider.checkUrl(`https://pxl.nextafter.org/${path}?id=client`));
    });
    t.false(provider.checkUrl("https://pxl.nextafter.org.example.com/tracker.php"));
    t.false(provider.checkUrl("https://example.com/?url=https://pxl.nextafter.org/tracker.php"));
});

test("NextAfter preserves conversion values and optional donor fields", t => {
    const result = OmnibugProvider.parseUrl("https://pxl.nextafter.org/tracker.php?id=001&amt=0&type=recurring&name=Pat&city=Fort+Worth&state=TX");
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "NEXTAFTERPIXELLEGACY");
    t.is(fields.id.value, "001");
    t.is(fields.amt.value, "0");
    t.is(fields.type.value, "recurring");
    t.is(fields.city.value, "Fort Worth");
    t.is(fields.name.group, "donor");
    t.is(fields.omnibug_requestType.value, "Conversion");
});

test("NextAfter does not invent missing gift type or currency", t => {
    const result = new NextAfterPixelLegacyProvider().parseUrl("https://pxl.nextafter.org/tracker.php?id=001&amt=12.50");
    t.false(result.data.some(item => ["type", "currency", "name"].includes(item.key)));
});
