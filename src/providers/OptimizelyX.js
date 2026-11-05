/**
 * Optimizely Web and Feature Experimentation
 * https://docs.optimizely.com/experimentation-strategy/data-api/log-endpoint
 *
 * @class
 * @extends BaseProvider
 */
class OptimizelyXProvider extends BaseProvider {
    /** Initialize legacy and batched event detection, retaining the existing settings key. */
    constructor() {
        super();
        this._key = "OPTIMIZELYX";
        this._pattern = /^https?:\/\/(?:[a-z0-9-]+\.)*optimizely\.com\/(?:log\/event|v1\/events|events)(?:[?#]|$)/i;
        this._name = "Optimizely";
        this._type = "testing";
        this._keywords = ["optimizely x", "experimentation", "full stack"];
    }

    /** @returns {{}} Summary column mappings. */
    get columnMapping() {
        return { "account": "omnibug_account", "requestType": "omnibug_requestType" };
    }

    /** @returns {Array} Detail groups. */
    get groups() {
        return [
            { "key": "general", "name": "General" },
            { "key": "decisions", "name": "Experiment Decisions" },
            { "key": "events", "name": "Events" },
            { "key": "visitor", "name": "Visitor Attributes" },
            { "key": "technical", "name": "Technical" }
        ];
    }

    /** @returns {{}} Shared and legacy event fields. */
    get keys() {
        return {
            "account_id": { "name": "Account ID", "group": "general" },
            "accountId": { "name": "Account ID", "group": "general" },
            "project_id": { "name": "Project ID", "group": "general" },
            "projectId": { "name": "Project ID", "group": "general" },
            "eventName": { "name": "Event Name", "group": "events" },
            "eventType": { "name": "Event Type", "group": "events" },
            "eventId": { "name": "Event ID", "group": "events" },
            "timestamp": { "name": "Event Timestamp", "group": "events" },
            "visitorId": { "name": "Visitor ID", "group": "visitor" },
            "sessionId": { "name": "Session ID", "group": "visitor" },
            "activationId": { "name": "Activation ID", "group": "events" },
            "revision": { "name": "Configuration Revision", "group": "technical" },
            "client_name": { "name": "Client Name", "group": "technical" },
            "client_version": { "name": "Client Version", "group": "technical" },
            "clientEngine": { "name": "Client Engine", "group": "technical" },
            "clientVersion": { "name": "Client Version", "group": "technical" },
            "anonymize_ip": { "name": "Anonymize IP", "group": "technical" },
            "anonymizeIP": { "name": "Anonymize IP", "group": "technical" },
            "enrich_decisions": { "name": "Enrich Decisions", "group": "technical" }
        };
    }

    /**
     * Keep batch indexes so events, decisions, and attributes remain associated.
     * @param {string} name
     * @param {*} value
     * @returns {{}}
     */
    handleQueryParam(name, value) {
        const result = super.handleQueryParam(name, value);
        if (/\.decisions\[|^layerStates\[/.test(name)) {
            result.group = "decisions";
        } else if (/\.events\[|^event(?:Features|Metrics)\[/.test(name)) {
            result.group = "events";
        } else if (/^visitors\[|^userFeatures\[/.test(name)) {
            result.group = "visitor";
        }
        const labels = {
            "campaign_id": "Campaign ID", "experiment_id": "Experiment ID", "variation_id": "Variation ID",
            "entity_id": "Entity ID", "key": "Key", "uuid": "Event UUID", "timestamp": "Event Timestamp",
            "revenue": "Revenue (cents)", "value": "Value", "visitor_id": "Visitor ID", "session_id": "Session ID"
        };
        const field = name.split(".").pop();
        if (name.includes(".") && labels[field]) {
            result.field = `${labels[field]} (${name.substring(0, name.lastIndexOf("."))})`;
        }
        return result;
    }

    /**
     * Summarize a batch without assigning conversions to absent experiment decisions.
     * @param {URL} url
     * @param {URLSearchParams} params
     * @returns {Array}
     */
    handleCustom(url, params) {
        const names = [];
        for (const [key, value] of params) {
            if ((key === "eventName" || /^visitors\[\d+\]\.snapshots\[\d+\]\.events\[\d+\]\.key$/.test(key)) && value) {
                names.push(value);
            }
        }
        const eventNames = Array.from(new Set(names));
        return [
            { "key": "omnibug_account", "value": params.get("account_id") || params.get("accountId") || params.get("project_id") || params.get("projectId") || "", "hidden": true },
            { "key": "omnibug_requestType", "value": eventNames.join(", ") || params.get("eventType") || "Event", "hidden": true }
        ];
    }
}
