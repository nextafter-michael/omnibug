import test from "ava";
import TaboolaProvider from "../source/providers/Taboola.js";
import { OmnibugProvider } from "../source/providers.js";

test("Taboola matches browser events without matching widgets or lookalike hosts", t => {
    const provider = new TaboolaProvider();
    ["trc", "t"].forEach(host => t.true(provider.checkUrl(`https://${host}.taboola.com/123/log/3/unip?en=purchase`)));
    [
        "https://cdn.taboola.com/libtrc/unip/123/tfa.js",
        "https://trc.taboola.com/123/log/3/click",
        "https://trc.taboola.com.evil.test/123/log/3/unip",
        "https://example.com/?url=https://trc.taboola.com/123/log/3/unip"
    ].forEach(url => t.false(provider.checkUrl(url)));
});

test("Taboola decodes conversion fields and uses the path account", t => {
    const result = OmnibugProvider.parseUrl("https://trc.taboola.com/00123/log/3/unip?en=purchase&revenue=0&currency=USD&orderid=abc&item-url=https%3A%2F%2Fexample.com%2Fthanks&custom=value");
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "TABOOLA");
    t.is(fields.omnibug_account.value, "00123");
    t.is(fields.omnibug_requestType.value, "purchase");
    t.is(fields.revenue.value, "0");
    t.is(fields.currency.group, "event");
    t.is(fields["item-url"].value, "https://example.com/thanks");
    t.is(fields.custom.value, "value");
});

test("Taboola labels page views and preserves internal event names", t => {
    const provider = new TaboolaProvider();
    const label = name => provider.parseUrl(`https://trc.taboola.com/123/log/3/unip?en=${name}`).data.find(item => item.key === "omnibug_requestType").value;
    t.is(label("page_view"), "Page View");
    t.is(label("pre_d_eng_tb"), "pre_d_eng_tb");
});
