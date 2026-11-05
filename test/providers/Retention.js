import test from "ava";
import RetentionProvider from "../source/providers/Retention.js";
import { OmnibugProvider } from "../source/providers.js";

test.before(() => {
    // Browser API missing from the repository's original Node 12 test runtime.
    if (typeof global.atob === "undefined") {
        global.atob = value => Buffer.from(value, "base64").toString("binary");
    }
});

test("Retention detects account script loads without reporting them as collection", t => {
    const result = OmnibugProvider.parseUrl("https://s3-us-west-2.amazonaws.com/jsstore/a/EXAMPLE/ge.js?v=1");
    t.is(result.provider.key, "RETENTION");
    t.is(result.data.find(item => item.key === "omnibug_account").value, "EXAMPLE");
    t.is(result.data.find(item => item.key === "omnibug_requestType").value, "Library Load");
});

test("Retention decodes the Base64 JSON used by its order and suppression endpoints", t => {
    const payload = { label: "EXAMPLE", type: "order", order_amount: 0, order_id: "o1", order_email: "example@example.test" };
    const result = OmnibugProvider.parseUrl("https://vxdq9yx2sd.execute-api.us-west-2.amazonaws.com/so", Buffer.from(JSON.stringify(payload)).toString("base64"));
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "RETENTION");
    t.is(fields.omnibug_account.value, "EXAMPLE");
    t.is(fields.omnibug_requestType.value, "Order");
    t.is(fields.order_amount.value, "0");
    t.is(fields.order_email.group, "identity");
});

test("Retention supports plain JSON collection and suppression payloads", t => {
    const provider = new RetentionProvider();
    const result = provider.parseUrl("https://uqmscnlvii.execute-api.us-west-2.amazonaws.com/suppression", JSON.stringify({ label: "EXAMPLE", type: "suppression", event_data: { email: "example@example.test" } }));
    t.is(result.data.find(item => item.key === "omnibug_requestType").value, "Suppression");
    t.true(result.data.some(item => item.key === "event_data.email"));
    t.notThrows(() => provider.parseUrl("https://s3shglasfi.execute-api.us-west-2.amazonaws.com/ev", "%%%"));
    t.true(provider.parseUrl("https://s3shglasfi.execute-api.us-west-2.amazonaws.com/ev", "%%%").data.some(item => item.key === "omnibug_parseError"));
});

test("Retention never claims unrelated AWS APIs or scripts", t => {
    const provider = new RetentionProvider();
    ["https://unrelated.execute-api.us-west-2.amazonaws.com/so", "https://s3-us-west-2.amazonaws.com/another-bucket/a/EXAMPLE/ge.js", "https://vxdq9yx2sd.execute-api.us-west-2.amazonaws.com/other", "https://s3-us-west-2.amazonaws.com.evil.test/jsstore/a/EXAMPLE/ge.js"].forEach(url => t.false(provider.checkUrl(url)));
});
