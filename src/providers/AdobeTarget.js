/**
 * Adobe Target
 * http://www.adobe.com/marketing-cloud/target.html
 *
 * @class
 * @extends BaseProvider
 */
class AdobeTargetProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBETARGET";
        this._pattern    = /^https?:\/\/[a-z0-9-]+\.tt\.omtrdc\.net\/(?:m2\/[^/?#]+\/mbox\/[^/?#]*|rest\/v[12]\/(?:delivery|mbox\/?|batchmbox\/?))(?:[?#]|$)/i;
        this._name       = "Adobe Target";
        this._type       = "testing";
        this._keywords   = ["test target", "test & target", "at", "tnt", "t&t", "omniture"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "omnibug_account",
            "requestType":  "omnibug_requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "profile",
                "name": "Profile Attributes"
            },
            { "key": "execute", "name": "Executed Locations" },
            { "key": "prefetch", "name": "Prefetched Locations" },
            { "key": "notifications", "name": "Notifications" },
            { "key": "context", "name": "Page and Browser Context" },
            { "key": "identity", "name": "Identity" },
            { "key": "integration", "name": "Experience Cloud Integration" }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "mbox": {
                "name": "Mbox Name",
                "group": "general"
            },
            "mboxType": {
                "name": "Mbox Type",
                "group": "general"
            },
            "mboxCount": {
                "name": "Mbox Count",
                "group": "general"
            },
            "mboxId": {
                "name": "Mbox ID",
                "group": "general"
            },
            "mboxSession": {
                "name": "Mbox Session",
                "group": "general"
            },
            "mboxPC": {
                "name": "Mbox PC ID",
                "group": "general"
            },
            "mboxPage": {
                "name": "Mbox Page ID",
                "group": "general"
            },
            "clientCode": {
                "name": "Client Code",
                "group": "general"
            },
            "mboxHost": {
                "name": "Page Host",
                "group": "general"
            },
            "mboxURL": {
                "name": "Page URL",
                "group": "general"
            },
            "mboxReferrer": {
                "name": "Page Referrer",
                "group": "general"
            },
            "screenHeight": {
                "name": "Screen Height",
                "group": "general"
            },
            "screenWidth": {
                "name": "Screen Width",
                "group": "general"
            },
            "browserWidth": {
                "name": "Browser Width",
                "group": "general"
            },
            "browserHeight": {
                "name": "Browser Height",
                "group": "general"
            },
            "browserTimeOffset": {
                "name": "Browser Timezone Offset",
                "group": "general"
            },
            "colorDepth": {
                "name": "Browser Color Depth",
                "group": "general"
            },
            "mboxXDomain": {
                "name": "CrossDomain Enabled",
                "group": "general"
            },
            "mboxTime": {
                "name": "Timestamp",
                "group": "general"
            },
            "mboxVersion": {
                "name": "Library Version",
                "group": "general"
            }
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if (/(?:^|\.)profileParameters\./.test(name)) {
            result = super.handleQueryParam(name, value);
            result.group = "profile";
        } else if (/^(?:execute|prefetch|notifications)(?:\.|\[)/.test(name)) {
            result = super.handleQueryParam(name, value);
            result.group = name.split(".")[0].split("[")[0];
        } else if (/^context\./.test(name)) {
            result = super.handleQueryParam(name, value);
            result.group = "context";
        } else if (/^id\./.test(name)) {
            result = super.handleQueryParam(name, value);
            result.group = "identity";
        } else if (/^experienceCloud\./.test(name)) {
            result = super.handleQueryParam(name, value);
            result.group = "integration";
        } else if(name.indexOf("profile.") === 0) {
            result = {
                "key":   name,
                "field": name.slice(8),
                "value": value,
                "group": "profile"
            };
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {void|Array}
     */
    handleCustom(url, params)
    {
        let matches =  url.pathname.match( /\/([^/]+)\/mbox\/([^/?]+)/ ),
            results = [];
        if(matches !== null && matches.length === 3) {
            results.push({
                "key":   "clientCode",
                "field": "Client Code",
                "value": matches[1],
                "group": "general"
            });
            results.push({
                "key":   "mboxType",
                "field": "Mbox Type",
                "value": matches[2],
                "group": "general"
            });
        }

        const operations = [];
        for (const [key, value] of params) {
            if (/^execute\.pageLoad(?:\.|$)/.test(key)) {
                operations.push("Page Load");
            } else if (/^execute\.mboxes\[/.test(key)) {
                operations.push("Mbox Execute");
            } else if (/^prefetch(?:\.|$)/.test(key)) {
                operations.push("Prefetch");
            } else if (/^notifications\[\d+\]\.type$/.test(key)) {
                operations.push(value === "display" ? "Display" : value === "click" ? "Click" : value);
            }
        }
        const types = Array.from(new Set(operations));
        const pathType = results.find(item => item.key === "mboxType");
        const pathClient = results.find(item => item.key === "clientCode");
        results.push({
            "key": "omnibug_account",
            "value": params.get("client") || params.get("clientCode") || (pathClient && pathClient.value) || url.hostname.split(".")[0],
            "hidden": true
        });
        results.push({
            "key": "omnibug_requestType",
            "value": types.join(", ") || params.get("mboxType") || (pathType && pathType.value) || "Delivery",
            "hidden": true
        });
        return results;
    }

    /**
     * Accept JSON Delivery API requests and legacy form-encoded mbox requests.
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
}