import test from "ava";
import fs from "fs";
import vm from "vm";
import { TextDecoder } from "util";

/** Capture registered browser listeners without sending any network requests. */
function capture(requestBody) {
    const listeners = {};
    const messages = [];
    const event = key => ({ addListener: callback => { listeners[key] = callback; } });
    const chrome = {
        runtime: { onInstalled: event("installed"), onConnect: event("connect") },
        storage: { onChanged: event("storage") },
        webRequest: { onBeforeRequest: event("request"), onHeadersReceived: event("headers"), onErrorOccurred: event("error") },
        webNavigation: { onCommitted: event("navigation") }
    };
    let captured;
    class Settings {
        load() { return Promise.resolve({ providers: {} }); }
    }
    const context = {
        chrome, TextDecoder, console: { log() {} }, setTimeout() { return 1; }, clearTimeout() {},
        OmnibugSettings: Settings,
        OmnibugProvider: {
            getPattern() { return /^https:\/\/collector\.example\//; },
            parseUrl(url, postData) {
                captured = postData;
                return { provider: { key: "EXAMPLE" }, data: [] };
            }
        }
    };
    vm.runInNewContext(fs.readFileSync("src/serviceWorker.js", "utf8"), context);
    listeners.connect({ name: "42", postMessage: message => messages.push(message), onDisconnect: event("disconnect"), onMessage: event("message") });
    listeners.request({ method: "POST", tabId: 42, url: "https://collector.example/event", requestId: "one", requestBody });
    return { captured, request: messages.find(message => message.event === "webRequest").request };
}

/** Create the ArrayBuffer upload parts supplied by Chrome. */
function part(bytes) {
    return { bytes: Uint8Array.from(bytes).buffer };
}

test("Request capture joins chunks and decodes UTF-8 split inside an accented character", t => {
    const payload = JSON.stringify({ name: "José", city: "München", amount: 0 });
    const bytes = Buffer.from(payload, "utf8");
    const split = bytes.indexOf(0xc3) + 1;
    const result = capture({ raw: [part(bytes.slice(0, split)), part(bytes.slice(split))] });
    t.is(result.captured, payload);
    t.false(result.request.postError);
    t.deepEqual(JSON.parse(result.captured), { name: "José", city: "München", amount: 0 });
});

test("Request capture preserves Chrome formData and marks inaccessible upload parts", t => {
    const formData = { mbox: ["hero"], "profile.member": ["yes"] };
    t.is(capture({ formData }).captured, formData);
    const upload = capture({ raw: [part(Buffer.from("partial")), { file: "unavailable" }] });
    t.true(upload.request.postError);
    t.is(upload.captured, "");
    t.true(capture({ error: "Unavailable" }).request.postError);
});
