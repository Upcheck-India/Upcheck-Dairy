// Type declarations for WatermelonDB decorators
declare module '@nozbe/watermelondb/decorators' {
  export function field(columnName: string): any
  export function relation(table: string, key: string): any
  export function children(table: string): any
  export function lazy(_getter: () => any): any
}

// Global decorator type declarations
declare function field(columnName: string): PropertyDecorator
declare function relation(table: string, key: string): PropertyDecorator
declare function children(table: string): PropertyDecorator
declare function lazy(_getter: () => any): PropertyDecorator

export {}
