"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JStorageReact {
    constructor() {
        this.version = "1.0.2";
        this.storage = this.isBrowser() ? window.localStorage : null;
        this.jStorage = this.getStoredJStorage();
        this.jStorageMeta = this.jStorage.__jstorage_meta || {
            CRC32: {},
            TTL: {},
        };
        this.crc32Table = [];
        this.batchChanges = false;
        this.batchQueue = [];
        this.listeners = {};
        this.subscriptions = {};
        this.init();
    }
    isBrowser() {
        return typeof window !== "undefined";
    }
    getStoredJStorage() {
        var _a;
        try {
            const storedData = (_a = this.storage) === null || _a === void 0 ? void 0 : _a.getItem("jStorage");
            return storedData
                ? JSON.parse(storedData)
                : { __jstorage_meta: { CRC32: {}, TTL: {} } };
        }
        catch (error) {
            console.error("Error parsing jStorage data:", error);
            return { __jstorage_meta: { CRC32: {}, TTL: {} } };
        }
    }
    init() {
        if (this.storage) {
            if (!this.jStorage.__jstorage_meta) {
                this.jStorage.__jstorage_meta = { CRC32: {}, TTL: {} };
            }
            this.jStorage.__jstorage_meta.CRC32 = this.jStorageMeta.CRC32;
            this.jStorage.__jstorage_meta.TTL = this.jStorageMeta.TTL;
            this.save();
            this.cleanupTTL();
        }
    }
    save() {
        if (!this.storage) {
            console.warn("Cannot save jStorage: localStorage is not available.");
            return;
        }
        try {
            this.storage.setItem("jStorage", JSON.stringify(this.jStorage));
        }
        catch (error) {
            console.error("Error saving jStorage data:", error);
        }
    }
    processBatchQueue() {
        this.batchQueue.forEach((item) => {
            var _a;
            switch (item.type) {
                case "set":
                    this.set(item.key, item.value, item.options);
                    break;
                case "delete":
                    this.deleteKey(item.key);
                    break;
                case "setTTL":
                    this.setTTL(item.key, ((_a = item.options) === null || _a === void 0 ? void 0 : _a.TTL) || 0);
                    break;
            }
        });
        this.batchQueue = [];
        this.save();
    }
    startBatch() {
        this.batchChanges = true;
    }
    endBatch() {
        this.batchChanges = false;
        this.processBatchQueue();
    }
    set(key, value, options = {}) {
        if (!this.storage) {
            console.warn("Cannot set jStorage value: localStorage is not available.");
            return;
        }
        if (this.batchChanges) {
            this.batchQueue.push({ type: "set", key, value, options });
            return;
        }
        if (typeof value === "undefined") {
            this.deleteKey(key);
            return;
        }
        if (typeof value === "function") {
            console.warn("Cannot set jStorage value: function types are not supported.");
            return;
        }
        if (this.isXML(value)) {
            value = { _is_xml: true, xml: this.encodeXML(value) };
        }
        else if (typeof value === "object") {
            value = JSON.parse(JSON.stringify(value));
        }
        this.jStorage[key] = value;
        this.jStorageMeta.CRC32[key] = this.crc32(JSON.stringify(value));
        this.setTTL(key, options.TTL || 0);
        if (!this.batchChanges) {
            this.save();
        }
    }
    get(key, defaultValue = null) {
        if (!this.storage) {
            console.warn("Cannot get jStorage value: localStorage is not available.");
            return defaultValue;
        }
        if (this.jStorage[key] && this.jStorage[key]._is_xml) {
            return this.decodeXML(this.jStorage[key].xml);
        }
        return this.jStorage[key] || defaultValue;
    }
    deleteKey(key) {
        if (!this.storage) {
            console.warn("Cannot delete jStorage key: localStorage is not available.");
            return;
        }
        if (this.batchChanges) {
            this.batchQueue.push({ type: "delete", key });
            return;
        }
        delete this.jStorage[key];
        delete this.jStorageMeta.TTL[key];
        delete this.jStorageMeta.CRC32[key];
        if (!this.batchChanges) {
            this.save();
        }
    }
    setTTL(key, ttl) {
        if (!this.storage) {
            console.warn("Cannot set TTL for jStorage key: localStorage is not available.");
            return;
        }
        if (this.batchChanges) {
            this.batchQueue.push({ type: "setTTL", key, options: { TTL: ttl } });
            return;
        }
        if (!ttl) {
            delete this.jStorageMeta.TTL[key];
        }
        else {
            this.jStorageMeta.TTL[key] = Date.now() + ttl;
        }
        this.cleanupTTL();
        if (!this.batchChanges) {
            this.save();
        }
    }
    getTTL(key) {
        if (!this.storage) {
            console.warn("Cannot get TTL for jStorage key: localStorage is not available.");
            return 0;
        }
        return this.jStorageMeta.TTL[key] - Date.now();
    }
    cleanupTTL() {
        if (!this.storage) {
            return;
        }
        const now = Date.now();
        for (const key in this.jStorageMeta.TTL) {
            if (this.jStorageMeta.TTL[key] <= now) {
                this.deleteKey(key);
            }
        }
    }
    isXML(value) {
        return value && value.nodeType;
    }
    encodeXML(xml) {
        if (typeof XMLSerializer !== "undefined") {
            return new XMLSerializer().serializeToString(xml);
        }
        return xml.xml || "";
    }
    decodeXML(xmlStr) {
        const parser = new DOMParser();
        return parser.parseFromString(xmlStr, "text/xml");
    }
    crc32(str) {
        let crc = 0, i, j;
        const table = this.crc32Table || (this.crc32Table = this.generateCRC32Table());
        crc = crc ^ -1;
        for (i = 0; i < str.length; i++) {
            j = (crc ^ str.charCodeAt(i)) & 0xff;
            crc = (crc >>> 8) ^ table[j];
        }
        return (crc ^ -1) >>> 0;
    }
    generateCRC32Table() {
        let c;
        const table = [];
        for (let n = 0; n < 256; n++) {
            c = n;
            for (let k = 0; k < 8; k++) {
                if (c & 1) {
                    c = 0xedb88320 ^ (c >>> 1);
                }
                else {
                    c = c >>> 1;
                }
            }
            table[n] = c;
        }
        return table;
    }
    storageSize() {
        if (!this.storage) {
            console.warn("Cannot get storage size: localStorage is not available.");
            return 0;
        }
        return new Blob([JSON.stringify(this.jStorage)]).size;
    }
    storageAvailable() {
        return !!this.storage;
    }
    flush() {
        if (!this.storage) {
            console.warn("Cannot flush jStorage: localStorage is not available.");
            return;
        }
        this.jStorage = { __jstorage_meta: { CRC32: {}, TTL: {} } };
        this.save();
    }
    storageObj() {
        return JSON.parse(JSON.stringify(this.jStorage));
    }
    index() {
        return Object.keys(this.jStorage).filter((key) => key !== "__jstorage_meta");
    }
    currentBackend() {
        return this.storage ? "localStorage" : null;
    }
    listenKeyChange(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }
    stopListening(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter((cb) => cb !== callback);
        }
    }
    subscribe(channel, callback) {
        if (!this.subscriptions[channel]) {
            this.subscriptions[channel] = [];
        }
        this.subscriptions[channel].push(callback);
    }
    publish(channel, payload) {
        if (!this.jStorageMeta.PubSub) {
            this.jStorageMeta.PubSub = [];
        }
        this.jStorageMeta.PubSub.push([Date.now(), channel, payload]);
        this.save();
        this.notifySubscribers(channel, payload);
    }
    reInit() {
        this.jStorage = this.getStoredJStorage();
        this.jStorageMeta = this.jStorage.__jstorage_meta || { CRC32: {}, TTL: {} };
    }
    notifySubscribers(channel, payload) {
        if (this.subscriptions[channel]) {
            this.subscriptions[channel].forEach((callback) => callback(channel, payload));
        }
    }
}
// Export as default only if in a browser environment
const jStorageReact = new JStorageReact();
exports.default = jStorageReact;
