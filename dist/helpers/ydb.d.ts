/**
 * YDB wrapper.
 */
import { Driver, Session } from 'ydb-sdk';
type Connection = {
    stubId: string;
    connectionId: string;
    createdAt: string;
};
export declare class Ydb {
    protected token: string;
    constructor(token: string);
    getConnection(stubId: string): Promise<Connection | undefined>;
    saveConnection(stubId: string, connectionId: string): Promise<void>;
    protected withSession<T>(callback: (session: Session) => Promise<T>): Promise<T>;
    protected getDriver(): Promise<Driver>;
}
export {};
//# sourceMappingURL=ydb.d.ts.map