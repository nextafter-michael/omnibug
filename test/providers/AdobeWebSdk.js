import test from "ava";
import AdobeWebSdkProvider from "../source/providers/AdobeWebSdk.js";
import { OmnibugProvider } from "../source/providers.js";

test("Adobe Web SDK groups Target data and personalization without relabeling all Edge traffic as Target", t => {
    const payload = {
        query: { personalization: { decisionScopes: ["__view__"] } },
        events: [{ xdm: { eventType: "decisioning.propositionDisplay", _experience: { decisioning: { propositions: [{ id: "prop", scope: "hero", scopeDetails: { decisionProvider: "TGT" } }], propositionEventType: { display: 1 } } } }, data: { __adobe: { target: { "profile.member": "yes" } } } }]
    };
    const result = OmnibugProvider.parseUrl("https://edge.adobedc.net/ee/v1/interact?configId=12345678-1234-1234-1234-123456789012", JSON.stringify(payload));
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "ADOBEWEBSDK");
    t.is(fields["query.personalization.decisionScopes[0]"].group, "personalization");
    t.is(fields["events[0].xdm._experience.decisioning.propositions[0].scope"].group, "personalization");
    t.is(fields["events[0].data.__adobe.target.profile.member"].group, "target");
    t.is(fields.eventName.value, "decisioning.propositionDisplay");
});

test("Adobe Web SDK keeps normal analytics data in the existing event group", t => {
    const result = new AdobeWebSdkProvider().parseUrl("https://edge.adobedc.net/ee/v1/interact?configId=12345678-1234-1234-1234-123456789012", JSON.stringify({ events: [{ xdm: { eventType: "web.webpagedetails.pageViews" } }] }));
    t.is(result.data.find(item => item.key === "events[0].xdm.eventType").group, "events");
});
