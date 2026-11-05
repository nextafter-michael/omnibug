/**
 * NextAfter Pixel (Legacy)
 * Internal conversion tracker: https://pxl.nextafter.org/tracker.php
 *
 * @class
 * @extends BaseProvider
 */
class NextAfterPixelLegacyProvider extends BaseProvider {
    /** Initialize the legacy conversion tracker. */
    constructor() {
        super();
        this._key = "NEXTAFTERPIXELLEGACY";
        this._pattern = /^https?:\/\/pxl\.nextafter\.org\/tracker\.php(?:[?#]|$)/i;
        this._name = "NextAfter Pixel (Legacy)";
        this._type = "marketing";
        this._keywords = ["donation", "conversion", "nextafter"];
    }

    /** @returns {{}} Summary column mappings. */
    get columnMapping() {
        return { "account": "id", "requestType": "omnibug_requestType" };
    }

    /** @returns {Array} Detail groups. */
    get groups() {
        return [
            { "key": "general", "name": "General" },
            { "key": "donation", "name": "Donation" },
            { "key": "donor", "name": "Donor" }
        ];
    }

    /** @returns {{}} Documented conversion parameters. */
    get keys() {
        return {
            "id": { "name": "Pixel ID", "group": "general" },
            "amt": { "name": "Donation Amount", "group": "donation" },
            "type": { "name": "Gift Type", "group": "donation" },
            "name": { "name": "Donor First Name", "group": "donor" },
            "city": { "name": "Donor City", "group": "donor" },
            "state": { "name": "Donor State", "group": "donor" }
        };
    }

    /** @returns {Array} Label this endpoint as a conversion, without inferring gift type or currency. */
    handleCustom() {
        return [{ "key": "omnibug_requestType", "field": "Event Type", "value": "Conversion", "group": "general" }];
    }
}
