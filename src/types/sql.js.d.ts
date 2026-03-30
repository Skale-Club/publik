declare module "sql.js" {
  export interface SqlJsStatic {
    Database: typeof Database
  }

  export class Database {
    constructor(data?: ArrayLike<number>)
    run(sql: string, params?: any[]): void
    exec(sql: string): QueryExecResult[]
    each(sql: string, params: any[], callback: (row: any) => void, done: () => void): void
    prepare(sql: string): Statement
    export(): Uint8Array
    close(): void
  }

  export interface QueryExecResult {
    columns: string[]
    values: any[][]
  }

  export class Statement {
    bind(params?: any[]): boolean
    step(): boolean
    getAsObject(params?: any): any
    get(params?: any): any[]
    run(params?: any[]): void
    reset(): void
    freemem(): void
    free(): boolean
  }

  export default function initSqlJs(config?: any): Promise<SqlJsStatic>
}
