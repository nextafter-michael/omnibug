import test from 'ava';

import { default as OptimizelyXProvider } from "./../source/providers/OptimizelyX.js";
import { OmnibugProvider } from "./../source/providers.js";

test("OptimizelyXProvider returns provider information", (t) => {
    let provider = new OptimizelyXProvider();
    t.is(provider.key, "OPTIMIZELYX", "Key should always be OPTIMIZELYX");
    t.is(provider.type, "UX Testing", "Type should always be testing");
    t.true(typeof provider.name === "string" && provider.name !== "", "Name should exist");
    t.true(typeof provider.pattern === 'object' && provider.pattern instanceof RegExp, "Pattern should be a RegExp value");
});

test("OptimizelyXProvider pattern should match Optimizely calls", t => {
    let provider = new OptimizelyXProvider(),
        urls = [
            "https://logx.optimizely.com/log/event",
        ];

    urls.forEach((url) => {
        t.true(provider.checkUrl(url));
    });

    t.false(provider.checkUrl("https://omnibug.io/testing"), "Provider should not match on non-provider based URLs");
});

test("OmnibugProvider returns Optimizely X", t => {
    let url = "https://logx.optimizely.com/log/event",
        postData = "{\"eventId\":\"c41d9242-0ab5-42a4-b253-2fde5eXXXXXX\",\"anonymizeIP\":true,\"timestamp\":1516335167958,\"revision\":\"2\",\"clientEngine\":\"js\",\"clientVersion\":\"0.83.0\",\"projectId\":\"1016287XXXX\",\"accountId\":\"1016287XXXX\",\"activationId\":\"151633516XXXX\",\"sessionId\":\"AUTO\",\"visitorId\":\"oeu1516266145255r0.82940618067XXXXX\",\"eventFeatures\":[],\"eventMetrics\":[],\"layerStates\":[],\"userFeatures\":[{\"id\":null,\"type\":\"first_session\",\"name\":\"\",\"shouldIndex\":true,\"value\":true},{\"id\":null,\"type\":\"browserId\",\"name\":\"\",\"shouldIndex\":true,\"value\":\"gc\"},{\"id\":null,\"type\":\"device\",\"name\":\"\",\"shouldIndex\":true,\"value\":\"desktop\"},{\"id\":null,\"type\":\"source_type\",\"name\":\"\",\"shouldIndex\":true,\"value\":\"direct\"},{\"id\":null,\"type\":\"currentTimestamp\",\"name\":\"\",\"shouldIndex\":true,\"value\":1516335167957},{\"id\":null,\"type\":\"offset\",\"name\":\"\",\"shouldIndex\":true,\"value\":420}],\"activeViews\":[],\"isGlobalHoldback\":false,\"eventType\":\"client_activation\",\"eventName\":\"client_activation\"}";

    let results = OmnibugProvider.parseUrl(url, postData);
    t.true(typeof results === "object" && results !== null, "Results is a non-null object");
    t.is(results.provider.key, "OPTIMIZELYX", "Results provider is Optimizely X");
});

test.todo("OptimizelyXProvider returns static data");
test.todo("OptimizelyXProvider returns custom data");

test("Optimizely parses batched decisions and conversions without losing their indexes", t => {
    const payload = {
        account_id: "123", project_id: "456",
        visitors: [{ visitor_id: "visitor", attributes: [{ key: "member", value: false }], snapshots: [
            { decisions: [{ campaign_id: "c1", experiment_id: "e1", variation_id: "v1" }], events: [{ key: "campaign_activated", uuid: "one" }] },
            { events: [{ key: "purchase", revenue: 0, tags: { currency: "USD" } }, { key: "lead", value: 2 }] }
        ] }]
    };
    const result = OmnibugProvider.parseUrl("https://logx.optimizely.com/v1/events", JSON.stringify(payload));
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "OPTIMIZELYX");
    t.is(fields.omnibug_account.value, "123");
    t.is(fields.omnibug_requestType.value, "campaign_activated, purchase, lead");
    t.is(fields["visitors[0].snapshots[0].decisions[0].variation_id"].group, "decisions");
    t.is(fields["visitors[0].snapshots[1].events[0].revenue"].value, "0");
    t.is(fields["visitors[0].snapshots[1].events[0].tags.currency"].value, "USD");
    t.is(fields["visitors[0].attributes[0].value"].value, "false");
    t.false(result.data.some(item => item.key.startsWith("visitors[0].snapshots[1].decisions")));
});

test("Optimizely rejects unrelated endpoints and lookalike hosts", t => {
    const provider = new OptimizelyXProvider();
    ["https://logx.optimizely.com/v1/events/extra", "https://logx.optimizely.com.evil.test/v1/events", "https://cdn.optimizely.com/js/123.js", "https://example.com/?url=https://logx.optimizely.com/v1/events"].forEach(url => t.false(provider.checkUrl(url)));
    t.true(provider.checkUrl("https://logx.optimizely.com/events?test=1"));
});

test("Optimizely retains legacy event names and account IDs", t => {
    const result = new OptimizelyXProvider().parseUrl("https://logx.optimizely.com/log/event", JSON.stringify({ accountId: "old", eventName: "client_activation", eventType: "client_activation" }));
    t.is(result.data.find(item => item.key === "omnibug_account").value, "old");
    t.is(result.data.find(item => item.key === "omnibug_requestType").value, "client_activation");
});
