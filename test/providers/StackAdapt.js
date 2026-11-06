import test from "ava";
import StackAdaptProvider from "../source/providers/StackAdapt.js";
import { OmnibugProvider } from "../source/providers.js";

test("StackAdapt parses saq ts universal pixels and their prefixed revenue", t => {
    const result = OmnibugProvider.parseUrl("https://tags.srv.stackadapt.com/saq_pxl?uid=pixel&landing_url=https%3A%2F%2Fexample.com&sa_conv_data_revenue=0&sa_conv_data_currency=USD");
    const fields = Object.fromEntries(result.data.map(item => [item.key, item]));
    t.is(result.provider.key, "STACKADAPT");
    t.is(fields.omnibug_pixel.value, "pixel");
    t.is(fields.omnibug_requestType.value, "Universal Pixel");
    t.is(fields.sa_conv_data_revenue.value, "0");
    t.is(fields.sa_conv_data_revenue.field, "revenue");
    t.is(fields.sa_conv_data_currency.group, "event");
});

test("StackAdapt distinguishes conversions and audience hits", t => {
    const provider = new StackAdaptProvider();
    const label = path => provider.parseUrl(`https://tags.srv.stackadapt.com/${path}`).data.find(item => item.key === "omnibug_requestType").value;
    t.is(label("conv?cid=conversion"), "Conversion");
    t.is(label("rt?sid=segment"), "Retargeting");
    t.is(label("lal?sid=segment"), "Lookalike Audience");
});

test("StackAdapt excludes SDK files, diagnostics and lookalike hosts", t => {
    const provider = new StackAdaptProvider();
    ["https://tags.srv.stackadapt.com/events.js", "https://tags.srv.stackadapt.com/print_cookie", "https://tags.srv.stackadapt.com.evil.test/conv", "https://example.com/?url=https://tags.srv.stackadapt.com/conv"].forEach(url => t.false(provider.checkUrl(url)));
});
