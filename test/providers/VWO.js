import test from "ava";
import VWOProvider from "../source/providers/VWO.js";
import { OmnibugProvider } from "../source/providers.js";

test("VWO matches regional event and legacy endpoints, excluding unrelated traffic", t => {
    const provider = new VWOProvider();
    ["events/t", "eu01/events/t/u", "as01/collect/events/t/u", "l.gif", "eu01/c.gif", "j.php", "server-side/track-goal"].forEach(path => t.true(provider.checkUrl(`https://dev.visualwebsiteoptimizer.com/${path}?a=123`)));
    ["https://dev.visualwebsiteoptimizer.com.evil.test/events/t", "https://example.com/?url=https://dev.visualwebsiteoptimizer.com/events/t", "https://dev.visualwebsiteoptimizer.com/events/trash", "https://dev.visualwebsiteoptimizer.com/ee.gif", "https://dev.visualwebsiteoptimizer.com/h.gif"].forEach(url => t.false(provider.checkUrl(url)));
});

test("VWO parses JSON event properties, context and identifiers", t => {
    const payload = { d: { visId: "visitor", sessionId: 42, msgId: "message", event: {
        name: "donation", time: 12345, props: { amount: 0, recurring: false, page: { url: "https://example.com/thanks", title: "Thank You" }, vwoMeta: { source: "client" } }
    } } };
    const result = OmnibugProvider.parseUrl("https://dev.visualwebsiteoptimizer.com/eu01/events/t?a=001&en=donation", JSON.stringify(payload));
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "VWO");
    t.is(fields.omnibug_account.value, "001");
    t.is(fields.omnibug_requestType.value, "donation");
    t.is(fields["d.event.props.amount"].value, "0");
    t.is(fields["d.event.props.recurring"].value, "false");
    t.is(fields["d.event.props.page.url"].group, "page");
    t.is(fields["d.visId"].group, "visitor");
});

test("VWO labels legacy goals and supports encoded form bodies", t => {
    const result = new VWOProvider().parseUrl("https://dev.visualwebsiteoptimizer.com/c.gif", "account_id=123&experiment_id=7&combination=2&goal_id=4&revenue=12.50");
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(fields.omnibug_requestType.value, "Conversion");
    t.is(fields.omnibug_account.value, "123");
    t.is(fields.goal_id.value, "4");
    t.is(fields.combination.group, "experiment");
    t.is(fields.revenue.value, "12.50");
});

test("VWO preserves indexed events in a batch", t => {
    const result = new VWOProvider().parseUrl("https://dev.visualwebsiteoptimizer.com/events/t?a=123", JSON.stringify({ d: [{ event: { name: "one" } }, { event: { name: "two" } }] }));
    t.is(result.data.find(item => item.key === "omnibug_requestType").value, "one, two");
    t.true(result.data.some(item => item.key === "d[1].event.name"));
});
