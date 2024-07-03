interface JStorageMeta {
  CRC32: { [key: string]: number };
  TTL: { [key: string]: number };
  PubSub?: any[];
}

class JStorageReact {
  version: string = "1.0.2";
  storage: Storage | null = this.isBrowser() ? window.localStorage : null;
  jStorage: { [key: string]: any } = this.getStoredJStorage();
  jStorageMeta: JStorageMeta = this.jStorage.__jstorage_meta || {
    CRC32: {},
    TTL: {},
  };
  crc32Table: number[] = [];
  batchChanges: boolean = false;
  batchQueue: {
    type: string;
    key: string;
    value?: any;
    options?: { TTL?: number };
  }[] = [];
  listeners: { [key: string]: Function[] } = {};
  subscriptions: { [key: string]: Function[] } = {};

  constructor() {
    this.init();
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  private getStoredJStorage(): { [key: string]: any } {
    try {
      const storedData = this.storage?.getItem("jStorage");
      return storedData
        ? JSON.parse(storedData)
        : { __jstorage_meta: { CRC32: {}, TTL: {} } };
    } catch (error) {
      console.error("Error parsing jStorage data:", error);
      return { __jstorage_meta: { CRC32: {}, TTL: {} } };
    }
  }

  private init() {
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

  private save(): void {
    if (!this.storage) {
      console.warn("Cannot save jStorage: localStorage is not available.");
      return;
    }
    try {
      this.storage.setItem("jStorage", JSON.stringify(this.jStorage));
    } catch (error) {
      console.error("Error saving jStorage data:", error);
    }
  }

  private processBatchQueue() {
    this.batchQueue.forEach((item) => {
      switch (item.type) {
        case "set":
          this.set(item.key, item.value, item.options);
          break;
        case "delete":
          this.deleteKey(item.key);
          break;
        case "setTTL":
          this.setTTL(item.key, item.options?.TTL || 0);
          break;
      }
    });
    this.batchQueue = [];
    this.save();
  }

  startBatch(): void {
    this.batchChanges = true;
  }

  endBatch(): void {
    this.batchChanges = false;
    this.processBatchQueue();
  }

  set(key: string, value: any, options: { TTL?: number } = {}): void {
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
      console.warn(
        "Cannot set jStorage value: function types are not supported."
      );
      return;
    }
    if (this.isXML(value)) {
      value = { _is_xml: true, xml: this.encodeXML(value) };
    } else if (typeof value === "object") {
      value = JSON.parse(JSON.stringify(value));
    }
    this.jStorage[key] = value;
    this.jStorageMeta.CRC32[key] = this.crc32(JSON.stringify(value));
    this.setTTL(key, options.TTL || 0);
    if (!this.batchChanges) {
      this.save();
    }
  }

  get(key: string, defaultValue: any = null): any {
    if (!this.storage) {
      console.warn("Cannot get jStorage value: localStorage is not available.");
      return defaultValue;
    }
    if (this.jStorage[key] && this.jStorage[key]._is_xml) {
      return this.decodeXML(this.jStorage[key].xml);
    }
    return this.jStorage[key] || defaultValue;
  }

  deleteKey(key: string): void {
    if (!this.storage) {
      console.warn(
        "Cannot delete jStorage key: localStorage is not available."
      );
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

  setTTL(key: string, ttl: number): void {
    if (!this.storage) {
      console.warn(
        "Cannot set TTL for jStorage key: localStorage is not available."
      );
      return;
    }
    if (this.batchChanges) {
      this.batchQueue.push({ type: "setTTL", key, options: { TTL: ttl } });
      return;
    }
    if (!ttl) {
      delete this.jStorageMeta.TTL[key];
    } else {
      this.jStorageMeta.TTL[key] = Date.now() + ttl;
    }
    this.cleanupTTL();
    if (!this.batchChanges) {
      this.save();
    }
  }

  getTTL(key: string): number {
    if (!this.storage) {
      console.warn(
        "Cannot get TTL for jStorage key: localStorage is not available."
      );
      return 0;
    }
    return this.jStorageMeta.TTL[key] - Date.now();
  }

  private cleanupTTL(): void {
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

  private isXML(value: any): boolean {
    return value && value.nodeType;
  }

  private encodeXML(xml: any): string {
    if (typeof XMLSerializer !== "undefined") {
      return new XMLSerializer().serializeToString(xml);
    }
    return xml.xml || "";
  }

  private decodeXML(xmlStr: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xmlStr, "text/xml");
  }

  private crc32(str: string): number {
    let crc = 0,
      i,
      j;
    const table =
      this.crc32Table || (this.crc32Table = this.generateCRC32Table());
    crc = crc ^ -1;
    for (i = 0; i < str.length; i++) {
      j = (crc ^ str.charCodeAt(i)) & 0xff;
      crc = (crc >>> 8) ^ table[j];
    }
    return (crc ^ -1) >>> 0;
  }

  private generateCRC32Table(): number[] {
    let c;
    const table = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        if (c & 1) {
          c = 0xedb88320 ^ (c >>> 1);
        } else {
          c = c >>> 1;
        }
      }
      table[n] = c;
    }
    return table;
  }

  storageSize(): number {
    if (!this.storage) {
      console.warn("Cannot get storage size: localStorage is not available.");
      return 0;
    }
    return new Blob([JSON.stringify(this.jStorage)]).size;
  }

  storageAvailable(): boolean {
    return !!this.storage;
  }

  flush(): void {
    if (!this.storage) {
      console.warn("Cannot flush jStorage: localStorage is not available.");
      return;
    }
    this.jStorage = { __jstorage_meta: { CRC32: {}, TTL: {} } };
    this.save();
  }

  storageObj(): { [key: string]: any } {
    return JSON.parse(JSON.stringify(this.jStorage));
  }

  index(): string[] {
    return Object.keys(this.jStorage).filter(
      (key) => key !== "__jstorage_meta"
    );
  }

  currentBackend(): string | null {
    return this.storage ? "localStorage" : null;
  }

  listenKeyChange(key: string, callback: Function): void {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
  }

  stopListening(key: string, callback: Function): void {
    if (this.listeners[key]) {
      this.listeners[key] = this.listeners[key].filter((cb) => cb !== callback);
    }
  }

  subscribe(channel: string, callback: Function): void {
    if (!this.subscriptions[channel]) {
      this.subscriptions[channel] = [];
    }
    this.subscriptions[channel].push(callback);
  }

  publish(channel: string, payload: any): void {
    if (!this.jStorageMeta.PubSub) {
      this.jStorageMeta.PubSub = [];
    }
    this.jStorageMeta.PubSub.push([Date.now(), channel, payload]);
    this.save();
    this.notifySubscribers(channel, payload);
  }

  reInit(): void {
    this.jStorage = this.getStoredJStorage();
    this.jStorageMeta = this.jStorage.__jstorage_meta || { CRC32: {}, TTL: {} };
  }

  private notifySubscribers(channel: string, payload: any): void {
    if (this.subscriptions[channel]) {
      this.subscriptions[channel].forEach((callback) =>
        callback(channel, payload)
      );
    }
  }
}

// Export as default only if in a browser environment
const jStorageReact = new JStorageReact();
export default jStorageReact;
