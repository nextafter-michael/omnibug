/**
 * Radiant / BeliefNet browser conversion relay and Pathfinder library.
 * Endpoint and payload documented by the supplied Patheos integration snippet.
 *
 * @class
 * @extends BaseProvider
 */
class RadiantProvider extends BaseProvider {
    /** Initialize verified lead relay and Pathfinder library endpoints. */
    constructor() {
        super();
        this._key = "RADIANT";
        this._pattern = /^https?:\/\/cr\.beliefnet\.com\/(?:public\/api\/(?:v2\.0\/)?facebookconversions\/[^/?#]+\/event|public\/api\/v2\.0\/(?:offers\/\d+\/(?:pending-impressions|impressions|embed-config|extrafields)|leads(?:\/\d+\/pages\/\d+\/impressions)?|params)|js\/pathfinder-embed-integration\.js)(?:[?#]|$)/i;
        this._name = "Radiant / BeliefNet";
        this._type = "marketing";
        this._keywords = ["patheos", "pathfinder", "beliefnet"];
    }

    /** @returns {{}} Summary column mappings. */
    get columnMapping() {
        return { "account": "omnibug_brand", "requestType": "omnibug_requestType" };
    }

    /** @returns {Array} Detail groups. */
    get groups() {
        return [
            { "key": "general", "name": "General" },
            { "key": "event", "name": "Event Data" },
            { "key": "user", "name": "Submitted Contact" },
            { "key": "impression", "name": "Impression" },
            { "key": "parameters", "name": "Parameters and Metadata" }
        ];
    }

    /** @returns {{}} Fields in the supplied browser POST. */
    get keys() {
        return {
            "eventName": { "name": "Event Name", "group": "event" },
            "eventId": { "name": "Event ID", "group": "event" },
            "eventID": { "name": "Event ID", "group": "event" },
            "userEmail": { "name": "Email Address", "group": "user" },
            "userPhone": { "name": "Phone", "group": "user" },
            "userZip": { "name": "Postal Code", "group": "user" },
            "clickID": { "name": "Facebook Click ID", "group": "event" },
            "browserID": { "name": "Facebook Browser ID", "group": "event" },
            "offerId": { "name": "Offer ID", "group": "impression" },
            "pendingImpressionId": { "name": "Pending Impression ID", "group": "impression" },
            "rsid": { "name": "Radiant Session ID", "group": "impression" },
            "eventSourceUrl": { "name": "Event Source URL", "group": "event" },
            "externalId": { "name": "External ID", "group": "event" },
            "userFirstName": { "name": "First Name", "group": "user" },
            "userLastName": { "name": "Last Name", "group": "user" },
            "emailAddress": { "name": "Email Address", "group": "user" }
        };
    }

    /**
     * Expand the JSON string in impression data, retaining the original value too.
     * @param {*} postData
     * @returns {Array}
     */
    parsePostData(postData = "") {
        const pairs = super.parsePostData(postData);
        const extra = [];
        pairs.forEach(([key, value]) => {
            if (/^(?:\[\d+\]\.)?data$/.test(key) && typeof value === "string") {
                try {
                    const decoded = JSON.parse(value);
                    if (decoded && typeof decoded === "object") {
                        super.parsePostData(value).forEach(([field, fieldValue]) => {
                            extra.push([`${key}.${field}`, fieldValue]);
                        });
                    }
                } catch (e) {
                    // Non-JSON data remains visible in its original field.
                }
            }
        });
        return pairs.concat(extra);
    }

    /**
     * Preserve array indexes in frame-mode batches and group submitted fields.
     * @param {string} name
     * @param {*} value
     * @returns {{}}
     */
    handleQueryParam(name, value) {
        const result = super.handleQueryParam(name, value);
        if (/^(?:\[\d+\]\.)?(?:lead|formData|data)\./.test(name)) {
            result.group = "user";
        } else if (/^(?:\[\d+\]\.)?(?:parameters|metadata|metaData)\[/.test(name)) {
            result.group = "parameters";
        } else if (/^\[\d+\]\./.test(name)) {
            result.group = "impression";
        }
        return result;
    }

    /**
     * Distinguish initialization, pending impressions, conversion submissions and relays.
     * Completion in frame/manual mode may only send postMessage and has no pixel hit.
     * @param {URL} url
     * @param {URLSearchParams} params
     * @returns {Array}
     */
    handleCustom(url, params) {
        const brand = url.pathname.match(/\/facebookconversions\/([^/]+)\/event$/i);
        const offer = url.pathname.match(/\/offers\/(\d+)\//);
        const frame = url.pathname.match(/\/leads\/(\d+)\/pages\/(\d+)\/impressions$/);
        let type = "Configuration";
        if (brand) {
            type = params.get("eventName") || "Conversion Relay";
        } else if (/\/pathfinder-embed-integration\.js$/i.test(url.pathname)) {
            type = "Pathfinder Library Load";
        } else if (/\/pending-impressions$/.test(url.pathname)) {
            type = "Pending Impression";
        } else if (/\/impressions$/.test(url.pathname)) {
            type = frame ? "Impression" : "Conversion Impression";
        } else if (/\/leads$/.test(url.pathname)) {
            type = "Lead";
        }
        const result = [
            { "key": "omnibug_brand", "field": "Brand / Integration", "value": brand ? decodeURIComponent(brand[1]) : "Pathfinder", "group": "general" },
            { "key": "omnibug_requestType", "value": type, "hidden": true }
        ];
        if (offer) {
            result.push({ "key": "omnibug_offerId", "field": "Endpoint Offer ID", "value": offer[1], "group": "impression" });
        }
        if (frame) {
            result.push({ "key": "omnibug_leadId", "field": "Endpoint Lead ID", "value": frame[1], "group": "impression" });
            result.push({ "key": "omnibug_pageId", "field": "Endpoint Page ID", "value": frame[2], "group": "impression" });
        }
        return result;
    }
}
