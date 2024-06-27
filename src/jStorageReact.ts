// jStorageReact.ts

interface JStorageMeta {
  CRC32: { [key: string]: number };
  TTL: { [key: string]: number };
}

class JStorageReact {
  version: string;
  storage: Storage | null;
  jStorage: { [key: string]: any };
  jStorageMeta: JStorageMeta;
  crc32Table: number[];

  constructor() {
    this.version = "0.3.1";
    this.storage = this.isBrowser() ? window.localStorage : null;
    this.jStorage = this.storage ? this.getStoredJStorage() : {};
    this.jStorageMeta = this.jStorage.__jstorage_meta || { CRC32: {}, TTL: {} };
    this.crc32Table = [];
    this.init();
  }

  private isBrowser() {
    return typeof window !== "undefined";
  }

  private getStoredJStorage() {
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
      this.jStorage.__jstorage_meta = this.jStorageMeta;
      this.save();
      this.cleanupTTL();
    }
  }

  private save() {
    if (this.storage) {
      try {
        this.storage.setItem("jStorage", JSON.stringify(this.jStorage));
      } catch (error) {
        console.error("Error saving jStorage data:", error);
      }
    }
  }

  set(key: string, value: any, options: { TTL?: number } = {}): void {
    if (!this.storage) {
      console.warn("Cannot set jStorage value: localStorage is not available.");
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
    this.save();
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

    delete this.jStorage[key];
    delete this.jStorageMeta.TTL[key];
    delete this.jStorageMeta.CRC32[key];
    this.save();
  }

  setTTL(key: string, ttl: number): void {
    if (!this.storage) {
      console.warn(
        "Cannot set TTL for jStorage key: localStorage is not available."
      );
      return;
    }

    if (!ttl) {
      delete this.jStorageMeta.TTL[key];
    } else {
      this.jStorageMeta.TTL[key] = Date.now() + ttl;
    }
    this.cleanupTTL();
    this.save();
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
}

// Export as default only if in a browser environment
const jStorageReact = new JStorageReact();
export default jStorageReact;
