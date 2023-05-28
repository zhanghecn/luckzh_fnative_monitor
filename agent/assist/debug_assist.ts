export namespace dbg {
    export function getBacktraceSymbolsStr(context?: CpuContext) {
        const debugText = Thread.backtrace(context, Backtracer.FUZZY).map(nptr=>DebugSymbol.fromAddress(nptr))
            .join("\n");
        return debugText;
    }
}