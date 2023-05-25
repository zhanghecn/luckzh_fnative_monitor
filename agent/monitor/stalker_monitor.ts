import { UnixProc } from '../native/unix_android';
export const module_map = new ModuleMap();
export const unixproc = new UnixProc();
export abstract class StalkerMonitor {
    // 监控的 module  路径
    mpath: ModulePathRangeType = "user";
    // 监控的 module 名称
    mname: string = "*"
    //  初始化线程
    initThreadIds = []
    //  主线程
    mainThreadId: number = -1;
    // 正在跟踪的线程
    traceThreads: Map<string, ThreadInfo> = new Map();
    // 跟踪的方法指针
    tracePtrs = new Set<NativePointer>();
}


export type ModulePathRangeType = "user" | "all";

export interface ThreadInfo {
    tname: string
    tid: number
}
function createThreadInfo(tid: number): ThreadInfo {
    const tname = unixproc.getThreadComm(tid);
    return { tname, tid };
}

