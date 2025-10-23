interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}
export declare function upload(file: MulterFile): Promise<{
    success: boolean;
    ipfsHash: string;
    pinataUrl: string;
    fileSize: number;
    timestamp: string;
}>;
export declare function fetchFile(cid: string): Promise<{
    success: boolean;
    data: unknown;
}>;
export {};
//# sourceMappingURL=pinataService.d.ts.map