/**
 * Decide landing-page and donation tracking scripts.
 * Matches the installation URLs supplied for this custom build.
 *
 * @class
 * @extends BaseProvider
 */
class DecideProvider extends BaseProvider {
    /** Initialize the verified tracking-script URL pattern. */
    constructor() {
        super();
        this._key = "DECIDE";
        this._pattern = /^https?:\/\/cdn1\.decide\.dev\/tracking\/[^/?#]+_(?:lander|donation)\.js(?:[?#]|$)/i;
        this._name = "Decide";
        this._type = "marketing";
    }

    /** @returns {{}} Summary column mappings. */
    get columnMapping() {
        return { "account": "omnibug_tracker", "requestType": "omnibug_requestType" };
    }

    /** @returns {Array} Detail groups. */
    get groups() {
        return [{ "key": "general", "name": "General" }];
    }

    /**
     * Identify the requested tracker; this does not confirm downstream delivery.
     * @param {URL} url
     * @returns {Array}
     */
    handleCustom(url) {
        const match = url.pathname.match(/\/([^/]+)_(lander|donation)\.js$/i);
        if (!match) { return []; }
        return [
            { "key": "omnibug_tracker", "field": "Tracker Name", "value": decodeURIComponent(match[1]), "group": "general" },
            { "key": "omnibug_purpose", "field": "Tracker Purpose", "value": match[2].toLowerCase() === "lander" ? "Landing Page View" : "Donation Conversion", "group": "general" },
            { "key": "omnibug_requestType", "value": match[2].toLowerCase() === "lander" ? "Landing Page Tracker Load" : "Donation Tracker Load", "hidden": true }
        ];
    }
}
