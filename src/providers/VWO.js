/**
 * VWO browser events and legacy experiment beacons.
 * https://developers.wingify.com/docs/http-requests
 * https://gist.github.com/vwo-kb/7868280b25961e21db6ecf7ea1ded9c3
 *
 * @class
 * @extends BaseProvider
 */
class VWOProvider extends BaseProvider {
    /** Initialize VWO tracking and initialization endpoints. */
    constructor() {
        super();
        this._key = "VWO";
        this._pattern = /^https?:\/\/dev\.visualwebsiteoptimizer\.com\/(?:[a-z]{2}\d{2}\/)?(?:(?:collect\/)?(?:events\/t(?:\/u)?|[lc]\.gif)|j\.php|server-side\/(?:track-user|track-goal|push|batch-events))(?:[?#]|$)/i;
        this._name = "VWO";
        this._type = "testing";
        this._keywords = ["visual website optimizer", "wingify"];
    }

    /** @returns {{}} Summary column mappings. */
    get columnMapping() {
        return { "account": "omnibug_account", "requestType": "omnibug_requestType" };
    }

    /** @returns {Array} Detail groups. */
    get groups() {
        return [
            { "key": "general", "name": "General" },
            { "key": "experiment", "name": "Experiment" },
            { "key": "event", "name": "Event Data" },
            { "key": "page", "name": "Page" },
            { "key": "visitor", "name": "Visitor" }
        ];
    }

    /** @returns {{}} Documented event and legacy SDK query fields. */
    get keys() {
        return {
            "a": { "name": "Account ID", "group": "general" },
            "account_id": { "name": "Account ID", "group": "general" },
            "en": { "name": "Event Name", "group": "event" },
            "experiment_id": { "name": "Experiment ID", "group": "experiment" },
            "combination": { "name": "Variation ID", "group": "experiment" },
            "goal_id": { "name": "Goal ID", "group": "event" },
            "revenue": { "name": "Revenue", "group": "event" },
            "sId": { "name": "Session ID / Timestamp", "group": "visitor" },
            "u": { "name": "Visitor ID / Page URL (endpoint dependent)", "group": "general" },
            "_cu": { "name": "Page URL", "group": "page" },
            "env": { "name": "Environment Key", "group": "general" },
            "sdk": { "name": "SDK Name", "group": "general" },
            "sdk-v": { "name": "SDK Version", "group": "general" },
            "d.event.name": { "name": "Event Name", "group": "event" },
            "d.event.time": { "name": "Event Timestamp", "group": "event" },
            "d.visId": { "name": "Visitor ID", "group": "visitor" },
            "d.sessionId": { "name": "Session ID", "group": "visitor" },
            "d.msgId": { "name": "Message ID", "group": "general" }
        };
    }

    /**
     * Accept JSON beacons and URL-encoded tracking bodies.
     * @param {*} postData
     * @returns {Array}
     */
    parsePostData(postData = "") {
        if (typeof postData === "string" && postData) {
            try {
                JSON.parse(postData);
            } catch (e) {
                return Array.from(new URLSearchParams(postData));
            }
        }
        return super.parsePostData(postData);
    }

    /**
     * Group custom properties while preserving their original names and indexes.
     * @param {string} name
     * @param {*} value
     * @returns {{}}
     */
    handleQueryParam(name, value) {
        const result = super.handleQueryParam(name, value);
        if (/\.event\.props\.page\./.test(name)) {
            result.group = "page";
        } else if (/\.event\./.test(name)) {
            result.group = "event";
        } else if (/\.(?:visId|sessionId)$/.test(name)) {
            result.group = "visitor";
        }
        return result;
    }

    /**
     * Summarize events or identify the legacy request by its endpoint.
     * @param {URL} url
     * @param {URLSearchParams} params
     * @returns {Array}
     */
    handleCustom(url, params) {
        const names = [];
        for (const [key, value] of params) {
            if ((key === "en" || /(?:^|\.)event\.name$/.test(key)) && value) {
                names.push(value);
            }
        }
        const path = url.pathname;
        let type = Array.from(new Set(names)).join(", ");
        if (!type) {
            if (/\/(?:l\.gif|track-user)$/.test(path)) {
                type = "Variation Shown";
            } else if (/\/(?:c\.gif|track-goal)$/.test(path)) {
                type = "Conversion";
            } else if (/\/j\.php$/.test(path)) {
                type = "Library Load";
            } else if (/\/push$/.test(path)) {
                type = "Visitor Attributes";
            } else {
                type = "Event";
            }
        }
        return [
            { "key": "omnibug_account", "value": params.get("a") || params.get("account_id") || "", "hidden": true },
            { "key": "omnibug_requestType", "value": type, "hidden": true }
        ];
    }
}
