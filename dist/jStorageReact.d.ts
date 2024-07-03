interface JStorageMeta {
    CRC32: {
        [key: string]: number;
    };
    TTL: {
        [key: string]: number;
    };
    PubSub?: any[];
}
declare class JStorageReact {
    version: string;
    storage: Storage | null;
    jStorage: {
        [key: string]: any;
    };
    jStorageMeta: JStorageMeta;
    crc32Table: number[];
    batchChanges: boolean;
    batchQueue: {
        type: string;
        key: string;
        value?: any;
        options?: {
            TTL?: number;
        };
    }[];
    listeners: {
        [key: string]: Function[];
    };
    subscriptions: {
        [key: string]: Function[];
    };
    constructor();
    private isBrowser;
    private getStoredJStorage;
    private init;
    private save;
    private processBatchQueue;
    startBatch(): void;
    endBatch(): void;
    set(key: string, value: any, options?: {
        TTL?: number;
    }): void;
    get(key: string, defaultValue?: any): any;
    deleteKey(key: string): void;
    setTTL(key: string, ttl: number): void;
    getTTL(key: string): number;
    private cleanupTTL;
    private isXML;
    private encodeXML;
    private decodeXML;
    private crc32;
    private generateCRC32Table;
    storageSize(): number;
    storageAvailable(): boolean;
    flush(): void;
    storageObj(): {
        [key: string]: any;
    };
    index(): string[];
    currentBackend(): string | null;
    listenKeyChange(key: string, callback: Function): void;
    stopListening(key: string, callback: Function): void;
    subscribe(channel: string, callback: Function): void;
    publish(channel: string, payload: any): void;
    reInit(): void;
    private notifySubscribers;
}
declare const jStorageReact: JStorageReact;
export default jStorageReact;
