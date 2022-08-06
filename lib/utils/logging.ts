import path from 'path';
import {wrapCallSite} from 'source-map-support';

export function debug(...messages: any[]) {
  log('DEBUG', ...messages);
}

export function info(...messages: any[]) {
  log('INFO', ...messages);
}

export function warn(...messages: any[]) {
  log('WARN', ...messages);
}

export function error(...messages: any[]) {
  log('ERROR', ...messages);
}

function log(level: string, ...messages: any[]) {
  // source-map-support 의 매핑을 활용합니다.
  Error.prepareStackTrace = (_, stack) => stack.map((s) => wrapCallSite(s));
  const error = new Error();
  const stack = (error.stack as unknown) as StackFrame[];
  Error.prepareStackTrace = undefined;

  const caller = stack[2]; /* 진짜 caller는 2에 있음! */

  const fileName = path.basename(caller.getFileName());
  const lineNumber = caller.getLineNumber();

  const prefix = `${new Date().toLocaleString()} ${level.padEnd(5, ' ')} | ${fileName}:${lineNumber} | `;

  console.log(prefix, ...messages);
}

export interface StackFrame {
  getTypeName(): string;

  getFunctionName(): string;

  getMethodName(): string;

  getFileName(): string;

  getLineNumber(): number;

  getColumnNumber(): number;

  isNative(): boolean;
}
