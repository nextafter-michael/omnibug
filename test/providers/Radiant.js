import test from "ava";
import RadiantProvider from "../source/providers/Radiant.js";
import { OmnibugProvider } from "../source/providers.js";

test("Radiant decodes the supplied Patheos lead relay payload", t => {
    const payload = { eventName: "Lead", eventId: "event-one", externalId: "event-one", eventSourceUrl: "https://example.com/form", userFirstName: "Example", userLastName: "Person", emailAddress: "example@example.test" };
    const result = OmnibugProvider.parseUrl("https://cr.beliefnet.com/public/api/facebookconversions/Patheos/event", JSON.stringify(payload));
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "RADIANT");
    t.is(fields.omnibug_brand.value, "Patheos");
    t.is(fields.omnibug_requestType.value, "Lead");
    t.is(fields.eventId.value, fields.externalId.value);
    t.is(fields.emailAddress.group, "user");
});

test("Radiant identifies Pathfinder initialization without inventing completion", t => {
    const result = new RadiantProvider().parseUrl("https://cr.beliefnet.com/js/pathfinder-embed-integration.js?v=1");
    t.is(result.data.find(item => item.key === "omnibug_requestType").value, "Pathfinder Library Load");
    t.false(result.data.some(item => item.value === "Complete"));
});

test("Radiant rejects unrelated APIs, Facebook pixels and lookalike hosts", t => {
    const provider = new RadiantProvider();
    ["https://cr.beliefnet.com/public/api/other", "https://www.facebook.com/tr?ev=Lead", "https://cr.beliefnet.com.evil.test/public/api/facebookconversions/Patheos/event", "https://example.com/?url=https://cr.beliefnet.com/js/pathfinder-embed-integration.js"].forEach(url => t.false(provider.checkUrl(url)));
});


test("Radiant parses standalone completion and distinguishes pending impressions", t => {
    const provider = new RadiantProvider();
    const payload = { lead: { email: "example@example.test", firstName: "Example" }, data: JSON.stringify({ email: "example@example.test", campaign: "spring" }), parameters: [{ key: "utm_source", value: "email" }], rsid: "R123", pendingImpressionId: 7 };
    const result = OmnibugProvider.parseUrl("https://cr.beliefnet.com/public/api/v2.0/offers/123/impressions", JSON.stringify(payload));
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "RADIANT");
    t.is(fields.omnibug_requestType.value, "Conversion Impression");
    t.is(fields.omnibug_offerId.value, "123");
    t.is(fields["lead.email"].group, "user");
    t.is(fields["data.campaign"].value, "spring");
    t.is(fields["parameters[0].value"].group, "parameters");
    const pending = provider.parseUrl("https://cr.beliefnet.com/public/api/v2.0/offers/123/pending-impressions", JSON.stringify({ offerId: 123, leadId: 0 }));
    t.is(pending.data.find(item => item.key === "omnibug_requestType").value, "Pending Impression");
});

test("Radiant retains frame-mode accepted flags and modern relay event IDs", t => {
    const provider = new RadiantProvider();
    const result = provider.parseUrl("https://cr.beliefnet.com/public/api/v2.0/leads/42/pages/7/impressions", JSON.stringify([{ offerId: 5, accepted: true, data: "{}" }, { offerId: 6, accepted: false, data: "opaque" }]));
    t.is(result.data.find(item => item.key === "omnibug_leadId").value, "42");
    t.is(result.data.find(item => item.key === "[1].accepted").value, "false");
    t.is(result.data.find(item => item.key === "[1].data").value, "opaque");
    const relay = OmnibugProvider.parseUrl("https://cr.beliefnet.com/public/api/v2.0/facebookconversions/Patheos/event", JSON.stringify({ eventID: "dedup", eventName: "Lead", userEmail: "example@example.test", formData: { member: "yes" }, clickID: "fbc" }));
    t.is(relay.provider.key, "RADIANT");
    t.is(relay.data.find(item => item.key === "eventID").field, "Event ID");
    t.is(relay.data.find(item => item.key === "formData.member").group, "user");
});
