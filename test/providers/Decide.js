import test from "ava";
import DecideProvider from "../source/providers/Decide.js";
import { OmnibugProvider } from "../source/providers.js";

test("Decide identifies landing and donation scripts from the supplied format", t => {
    ["lander", "donation"].forEach(kind => {
        const result = OmnibugProvider.parseUrl(`https://cdn1.decide.dev/tracking/client_with_underscores_${kind}.js?v=1`);
        t.is(result.provider.key, "DECIDE");
        t.is(result.data.find(item => item.key === "omnibug_tracker").value, "client_with_underscores");
        t.true(result.data.find(item => item.key === "omnibug_requestType").value.includes("Load"));
    });
});

test("Decide excludes unrelated scripts and lookalike hosts", t => {
    const provider = new DecideProvider();
    ["https://cdn1.decide.dev/tracking/client_other.js", "https://cdn1.decide.dev.evil.test/tracking/client_donation.js", "https://example.com/?url=https://cdn1.decide.dev/tracking/client_donation.js"].forEach(url => t.false(provider.checkUrl(url)));
});
