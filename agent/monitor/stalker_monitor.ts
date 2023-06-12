import { UnixProc, UnixLibc } from '../native/unix_android';
import { ThreadObserver } from './interface_monitor';
import { module_help, alinker } from '../assist/module_assist';
import { ArtMethod, art } from '../native/android_art';
import { SoInfo } from '../native/soinfo';
export const module_map = new ModuleMap();
export const unixproc = new UnixProc();
export const unixlibc = new UnixLibc();
function ensureNewestModuleMap() {
    alinker.hook_find_libraries((path) => {
        module_map.update();
    })
}
ensureNewestModuleMap();
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
    //排除跟踪的模块
    excludeModules = new Set<string>();
    /**
     * 是否只观察一次
     * 方法重复调用过多 容易崩溃
     * 建议默认开启
     */
    once = true
    constructor(mpath: ModulePathRangeType = "user", mname: string = "*", symbol: string = "*") {
        this.mpath = mpath;
        this.mname = mname;
        this.symbol = symbol;

        this.initThreads();
        this.watchModule();
    }

    watchJniInvoke(): void {
        this.javaNativeWatch(null);
    }

    watchElfInit(): void {
        const _this = this;
        Interceptor.attach(alinker.call_constructors_ptr, {
            onEnter(args) {
                const soinfo_ptr = args[0];
                const sinfo = new SoInfo(soinfo_ptr);
                const array_ptrs = sinfo.init_array_ptrs();
                const iptr = sinfo.init_ptr();
                let initm = null
                if (array_ptrs.length > 0) {
                    initm = module_map.find(array_ptrs[0]);
                }
                if (iptr.compare(0)) {
                    initm = module_map.find(iptr);
                }
                if (initm && !_this.isExcludeModule(initm)) {
                    // if (initm.name.indexOf("svc") != -1) {
                    this.initm = initm;
                    // console.log("trace module:"+initm.name)
                    _this.ttrace(this.threadId)
                    // }
                }
            },
            onLeave(retval) {
                if (this.initm) {
                    _this.unttrace(this.threadId);
                }
            },
        }
        );
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
        Stalker.flush();
        Stalker.unfollow(tid);
        // Stalker.garbageCollect();
    }
    isExcludeModule(module: Module | null | undefined | string) {
        if (!module) return false;

        const mname = module instanceof Module ? module.name : module;
        return this.excludeModules.has(mname)
    }
    private updateExclude() {
        const excludes = module_help.nagationModules(module_map, this.get_library_path_prefix(), this.mname);

        module_help.toModuleNames(excludes).forEach(name => {
            this.excludeModules.add(name);
        })

        exclude_modules(excludes);
    }
    watchModule() {
        this.updateExclude()

        //当 spawn 启动的时候 可能部分library 没有加载进去
        module_help.watchModule(path => {
            this.updateExclude();
        });
    }
    watchMain(): void {
        this.javaNativeWatch(this.mainThreadId);
    }
    /**
     * 在 art 中 方法执行 通过 ArtMethod::Invoke
     * 对于 native 方法 会调用 两个方法
     * art_quick_invoke_stub
     * art_quick_invoke_static_stub
     */
    javaNativeWatch(tid: number | null) {
        const _this = this;
        function checkSoRange(methodId: NativePointer): boolean {
            const am = new ArtMethod(methodId);
            const jniCodePtr = am.jniCodePtr();
            const m = module_map.find(jniCodePtr);

            return !_this.isExcludeModule(m);
        }
        art.hook_art_quick_invoke_stub((invocontext: InvocationContext, args: InvocationArguments) => {
            const methodId = args[0];
            const _tid = invocontext.threadId;
            if (checkSoRange(methodId) && (!tid || _tid == tid)) {
                _this.ttrace(_tid);
            }
        }, (invocontext) => {
            _this.unttrace(invocontext.threadId);
        });

        art.hook_art_quick_invoke_static_stub((invocontext: InvocationContext, args: InvocationArguments) => {
            const methodId = args[0];
            const _tid = invocontext.threadId;
            if (checkSoRange(methodId) && (!tid || _tid == tid)) {
                _this.ttrace(_tid);
            }
        }, (invocontext) => {
            _this.unttrace(invocontext.threadId);
        });

    }
    watchPthreadCreate(): void {
        const _this = this;
        Interceptor.attach(unixlibc.pthread_create_ptr, {
            onEnter(args) {
                const fun_ptr = args[2];
                const isArt = _this.isExcludeModule(module_map.find(fun_ptr));
                if (isArt) {
                    console.log("skip art or system thread...")
                } else {
                    if (!_this.tracePtrs.has(fun_ptr)) {
                        _this.tracePtrs.add(fun_ptr);
                        Interceptor.attach(fun_ptr, {
                            onEnter(args) {
                                _this.ttrace(this.threadId);
                            },
                            onLeave(retval) {
                                _this.unttrace(this.threadId);
                            },
                        })
                    }
                }
            }
        });
    }

    abstract stalkerOptions(tinfo: ThreadInfo): StalkerOptions;

    private get_library_path_prefix(): string | null {
        if (this.mpath == "user") {
            return "/data/app/**"
        }
        return null;
    }
    ttrace(tid: number) {
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