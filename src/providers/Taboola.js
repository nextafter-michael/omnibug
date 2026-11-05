/**
 * Taboola Pixel
 * https://developers.taboola.com/pixel/docs/pixel-overview
 *
 * @class
 * @extends BaseProvider
 */
class TaboolaProvider extends BaseProvider {
    /** Initialize Taboola browser event detection. */
    constructor() {
        super();
        this._key = "TABOOLA";
        this._pattern = /^https?:\/\/(?:trc|t)\.taboola\.com\/[^/?#]+\/log\/\d+\/unip(?:[?#]|$)/i;
        this._name = "Taboola";
        this._type = "marketing";
        this._keywords = ["native ads", "conversion", "realize"];
    }

    /** @returns {{}} Summary column mappings. */
    get columnMapping() {
        return { "account": "omnibug_account", "requestType": "omnibug_requestType" };
    }

    /** @returns {Array} Detail groups. */
    get groups() {
        return [
            { "key": "general", "name": "General" },
            { "key": "event", "name": "Event Data" },
            { "key": "page", "name": "Page" }
        ];
    }

    /** @returns {{}} Parameters sent by the Taboola browser pixel. */
    get keys() {
        return {
            "en": { "name": "Event Name", "group": "event" },
            "item-url": { "name": "Page URL", "group": "page" },
            "ref": { "name": "Referrer", "group": "page" },
            "tim": { "name": "Event Timestamp", "group": "event" },
            "revenue": { "name": "Revenue", "group": "event" },
            "value": { "name": "Value", "group": "event" },
            "currency": { "name": "Currency", "group": "event" },
            "orderid": { "name": "Order ID", "group": "event" },
            "quantity": { "name": "Quantity", "group": "event" },
            "tblci": { "name": "Taboola Click ID", "group": "general" }
        };
    }

    /**
     * Extract the account from the endpoint and retain the actual event name.
     * @param {URL} url
     * @param {URLSearchParams} params
     * @returns {Array}
     */
    handleCustom(url, params) {
        const name = params.get("en") || "Event";
        return [
            { "key": "omnibug_account", "field": "Account ID", "value": decodeURIComponent(url.pathname.split("/")[1]), "group": "general" },
            { "key": "omnibug_requestType", "value": name === "page_view" ? "Page View" : name, "hidden": true }
        ];
    }
}
