/**
 * Debug utility for conditional logging
 */
export class DebugLogger {
  constructor(private enabled: boolean) {}

  log(...args: unknown[]): void {
    if (this.enabled) {
      console.log(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.enabled) {
      console.error(...args);
    }
  }

  debug(...args: unknown[]): void {
    if (this.enabled) {
      console.debug(...args);
    }
  }
}
