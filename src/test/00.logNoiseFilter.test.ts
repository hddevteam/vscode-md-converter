const originalWarn = console.warn.bind(console);
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

function shouldSuppressWarning(message: string): boolean {
  return (
    /^Warning: TT: undefined function:/.test(message) ||
    message.includes('Required "glyf" table is not found -- trying to recover.') ||
    message.includes('Warning: Indexing all PDF objects')
  );
}

console.warn = (...args: unknown[]) => {
  const message = args.map(arg => String(arg)).join(' ');
  if (shouldSuppressWarning(message)) {
    return;
  }
  originalWarn(...args);
};

(process.stdout as any).write = (chunk: unknown, ...args: unknown[]) => {
  const message = typeof chunk === 'string' ? chunk : String(chunk ?? '');
  if (shouldSuppressWarning(message)) {
    return true;
  }
  return originalStdoutWrite(chunk as any, ...(args as any));
};

(process.stderr as any).write = (chunk: unknown, ...args: unknown[]) => {
  const message = typeof chunk === 'string' ? chunk : String(chunk ?? '');
  if (shouldSuppressWarning(message)) {
    return true;
  }
  return originalStderrWrite(chunk as any, ...(args as any));
};
