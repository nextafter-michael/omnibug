/**
 * Retention.com (formerly GetEmails)
 * https://support.retention.com/en/articles/8826332-custom-website-installation-guide
 * Tracking hosts verified from the public ge.js SDK; never match AWS hosts generally.
 *
 * @class
 * @extends BaseProvider
 */
class RetentionProvider extends BaseProvider {
    /** Initialize SDK loads and verified tracking endpoints. */
    constructor() {
        super();
        this._key = "RETENTION";
        this._pattern = /^https?:\/\/(?:s3-us-west-2\.amazonaws\.com\/(?:jsstore|storejs)\/a\/[^/?#]+\/ge\.js|(?:vxdq9yx2sd\.execute-api\.us-west-2\.amazonaws\.com\/so|ckjjzdn8vk\.execute-api\.us-west-2\.amazonaws\.com\/li|s3shglasfi\.execute-api\.us-west-2\.amazonaws\.com\/ev|uqmscnlvii\.execute-api\.us-west-2\.amazonaws\.com\/suppression)|da1bbbz2bvais\.cloudfront\.net\/a\/[^/?#]+\/ge\.js)(?:[?#]|$)/i;
        this._name = "Retention.com";
        this._type = "visitorid";
        this._keywords = ["getemails", "geq", "reclaim", "grow"];
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
            { "key": "page", "name": "Page" },
            { "key": "identity", "name": "Identity" }
        ];
    }

    /** @returns {{}} Fields observed in collection, suppression, order and event payloads. */
    get keys() {
        return {
            "label": { "name": "Account / Script ID", "group": "general" },
            "type": { "name": "Event Type", "group": "event" },
            "guid": { "name": "Request GUID", "group": "general" },
            "ver": { "name": "Snippet Version", "group": "general" },
            "script_number": { "name": "SDK Version", "group": "general" },
            "url": { "name": "Page URL", "group": "page" },
            "title": { "name": "Page Title", "group": "page" },
            "referrer": { "name": "Referrer", "group": "page" },
            "script": { "name": "Script URL", "group": "general" },
            "user_id": { "name": "User ID", "group": "identity" },
            "md5": { "name": "Identity Hash (MD5)", "group": "identity" },
            "order_email": { "name": "Order Email", "group": "identity" },
            "order_id": { "name": "Order ID", "group": "event" },
            "order_number": { "name": "Order Number", "group": "event" },
            "order_amount": { "name": "Order Amount", "group": "event" }
        };
    }

    /**
     * The SDK sends Base64-encoded JSON despite its application/json header.
     * Also accept plain JSON for versions that send an unencoded body.
     * @param {*} postData
     * @returns {Array}
     */
    parsePostData(postData = "") {
        if (typeof postData === "string" && postData) {
            try {
                JSON.parse(postData);
            } catch (e) {
                try {
                    const decoded = atob(postData.trim());
                    JSON.parse(decoded);
                    return super.parsePostData(decoded);
                } catch (decodeError) {
                    return [["omnibug_parseError", "Unable to decode Retention JSON payload"]];
                }
            }
        }
        return super.parsePostData(postData);
    }

    /**
     * Derive the account from the script path for loads, or the payload for events.
     * A library request is not evidence that collection or suppression succeeded.
     * @param {URL} url
     * @param {URLSearchParams} params
     * @returns {Array}
     */
    handleCustom(url, params) {
        const script = url.pathname.match(/\/a\/([^/]+)\/ge\.js$/i);
        const labels = { "collect": "Collection", "suppression": "Suppression", "order": "Order" };
        const event = params.get("type");
        const type = script ? "Library Load" : labels[event] || event || "Tracking Request";
        return [
            { "key": "omnibug_account", "field": "Account / Script ID", "value": params.get("label") || (script ? script[1] : ""), "group": "general" },
            { "key": "omnibug_requestType", "value": type, "hidden": true }
        ];
    }
}
