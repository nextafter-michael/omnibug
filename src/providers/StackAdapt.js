/**
 * StackAdapt browser tracking.
 * Endpoint and query fields verified in https://tags.srv.stackadapt.com/events.js
 *
 * @class
 * @extends BaseProvider
 */
class StackAdaptProvider extends BaseProvider {
    /** Initialize universal pixel, conversion and audience tracking endpoints. */
    constructor() {
        super();
        this._key = "STACKADAPT";
        this._pattern = /^https?:\/\/(?:tags|east|eu|uw|ap)\.srv\.stackadapt\.com\/(?:saq_pxl|conv|rt|lal|js_tracking)(?:[?#]|$)/i;
        this._name = "StackAdapt";
        this._type = "marketing";
        this._keywords = ["saq", "programmatic"];
    }

    /** @returns {{}} Summary column mappings. */
    get columnMapping() {
        return { "account": "omnibug_pixel", "requestType": "omnibug_requestType" };
    }

    /** @returns {Array} Detail groups. */
    get groups() {
        return [
            { "key": "general", "name": "General" },
            { "key": "event", "name": "Event Data" },
            { "key": "page", "name": "Page" }
        ];
    }

    /** @returns {{}} Pixel and attribution fields. */
    get keys() {
        return {
            "uid": { "name": "Universal Pixel ID", "group": "general" },
            "cid": { "name": "Conversion ID", "group": "general" },
            "sid": { "name": "Audience Segment ID", "group": "general" },
            "aid": { "name": "Ad ID", "group": "general" },
            "imp": { "name": "Impression ID", "group": "general" },
            "url": { "name": "Page URL", "group": "page" },
            "landing_url": { "name": "Landing URL", "group": "page" },
            "host": { "name": "Page Origin", "group": "page" },
            "t": { "name": "Page Title", "group": "page" },
            "args": { "name": "Dynamic Retargeting Data", "group": "event" }
        };
    }

    /**
     * The SDK prefixes custom fields, including revenue, with sa_conv_data_.
     * @param {string} name
     * @param {*} value
     * @returns {{}}
     */
    handleQueryParam(name, value) {
        if (name.startsWith("sa_conv_data_")) {
            return { "key": name, "field": name.slice(13), "value": value, "group": "event" };
        }
        return super.handleQueryParam(name, value);
    }

    /**
     * Describe the actual endpoint; a universal pixel is not always a conversion.
     * @param {URL} url
     * @param {URLSearchParams} params
     * @returns {Array}
     */
    handleCustom(url, params) {
        const types = { "/saq_pxl": "Universal Pixel", "/conv": "Conversion", "/rt": "Retargeting", "/lal": "Lookalike Audience", "/js_tracking": "Page Tracking" };
        return [
            { "key": "omnibug_pixel", "value": params.get("uid") || params.get("cid") || params.get("sid") || "", "hidden": true },
            { "key": "omnibug_requestType", "value": types[url.pathname] || "Tracking", "hidden": true }
        ];
    }
}
