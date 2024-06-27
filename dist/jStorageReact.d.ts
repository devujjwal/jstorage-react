interface JStorageMeta {
    CRC32: {
        [key: string]: number;
    };
    TTL: {
        [key: string]: number;
    };
}
declare class JStorageReact {
    version: string;
    storage: Storage | null;
    jStorage: {
        [key: string]: any;
    };
    jStorageMeta: JStorageMeta;
    crc32Table: number[];
    constructor();
    private isBrowser;
    private getStoredJStorage;
    private init;
    private save;
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
}
declare const jStorageReact: JStorageReact;
export default jStorageReact;
