import { UnixProc } from '../native/unix_android';
import { ThreadObserver } from './interface_monitor';
import { module_help } from '../assist/module_assist';
import "../native/android_art"
import { ArtMethod, art } from '../native/android_art';
import { str_fuzzy } from '../assist/fuzzy_match_assist';
export const module_map = new ModuleMap();
export const unixproc = new UnixProc();

function ensureNewestModuleMap() {
    module_help.watchModule(path => {
        module_map.update();
    });
}
export abstract class StalkerMonitor implements ThreadObserver {
    // 监控的 module  路径
    mpath: ModulePathRangeType = "user";
    // 监控的 module 名称
    mname: string = "*"
    // 监控的 symbol
    symbol: string = "*"
    //  初始化线程
    initThreadIds: number[] = []
    //  主线程
    mainThreadId: number = -1;
    // 正在跟踪的线程
    traceThreads: Map<number, ThreadInfo> = new Map();
    // 跟踪的方法指针
    tracePtrs = new Set<NativePointer>();

    constructor(mpath: ModulePathRangeType = "user", mname: string = "*", symbol: string = "*") {
        this.mpath = mpath;
        this.mname = mname;
        this.symbol = symbol;

        this.initThreads();
        this.watchModule();
        ensureNewestModuleMap();
    }
    unwatch(): void {
        for (const tid of this.traceThreads.keys()) {
            this.unttrace(tid);
        }
    }

    unttrace(tid: number): void {
        if (!this.traceThreads.has(tid)) {
            return;
        }
        this.traceThreads.delete(tid);
        Stalker.unfollow(tid);
    }
    watchModule() {
        exclude_modules(module_help.nagationModules(module_map, this.get_library_path_prefix(), this.mname));

        //当 spawn 启动的时候 可能部分library 没有加载进去
        module_help.watchModule(path => {
            exclude_modules(module_help.nagationModules(module_map, this.get_library_path_prefix(), this.mname));
        });
    }
    watchMain(): void {
        console.log("watchMain....");
        this.javaNativeWatch(this.mainThreadId);
    }
    /**
     * 在 art 中 方法执行 通过 ArtMethod::Invoke
     * 对于 native 方法 会调用 两个方法
     * art_quick_invoke_stub
     * art_quick_invoke_static_stub
     * 
     * 其中会传递 当前 ArtMethod this 对象
     * 在 ArtMethod 结构中:
     * class ArtMethod final {
     * 
     * }
     */
    javaNativeWatch(tid: number) {
        const _this = this;
        function checkSoRange(methodId: NativePointer): boolean {
            const am = new ArtMethod(methodId);
            const jniCodePtr = am.jniCodePtr();
            const m = module_map.find(jniCodePtr);

            if (m != null) {
                const b1 = _this.get_library_path_prefix() ? str_fuzzy.match(m.path, _this.get_library_path_prefix()!) : true;
                const b2 = _this.mname ? str_fuzzy.match(m.name, _this.mname) : true;
                return b1 && b2;
            }
            return false;
        }
        art.hook_art_quick_invoke_stub((invocontext: InvocationContext, args: InvocationArguments) => {
            const methodId = args[0];
            const _tid = invocontext.threadId;
            if (checkSoRange(methodId) && _tid == tid) {
                _this.ttrace(tid);
            }
        }, (invocontext) => {
            _this.unttrace(tid);
        });

        art.hook_art_quick_invoke_static_stub((invocontext: InvocationContext, args: InvocationArguments) => {
            const methodId = args[0];
            const _tid = invocontext.threadId;
            if (checkSoRange(methodId) && _tid == tid) {
                _this.ttrace(tid);
            }
        }, (invocontext) => {
            _this.unttrace(tid);
        });

    }
    watchPthreadCreate(): void {

    }

    abstract stalkerOptions(tinfo: ThreadInfo): StalkerOptions;

    private get_library_path_prefix(): string | null {
        if (this.mpath == "user") {
            return "/data/app/**"
        }
        return null;
    }
    private ttrace(tid: number) {
        if (this.traceThreads.has(tid)) {
            return;
        }

        const tinfo: ThreadInfo = createThreadInfo(tid);
        this.traceThreads.set(tid, tinfo);

        Stalker.follow(tid, this.stalkerOptions(tinfo));
    }

    private initThreads() {
        const _tids = Process.enumerateThreads().map(tDetail => tDetail.id);

        const ctid = Process.getCurrentThreadId();
        const firstTid = _tids[0];
        const mainTid = Math.min(ctid, firstTid);

        let tids = _tids;
        if (mainTid != firstTid) {
            tids = [mainTid, ...tids];
        }

        this.initThreadIds = tids;
        this.mainThreadId = mainTid;
    }


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

function exclude_modules(ms: Module[]) {
    ms.forEach(m => {
        Stalker.exclude(m);
    })
}