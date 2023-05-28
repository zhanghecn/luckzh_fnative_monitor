import chalk from "chalk";
import { alinker, module_help } from "../assist/module_assist";
import { StalkerMonitor, ThreadInfo, module_map, unixlibc } from "../monitor/stalker_monitor";

export class CallStalkerTest extends StalkerMonitor {

    stalkerOptions(tinfo: ThreadInfo): StalkerOptions {
        function array_is_not_empty(_array: any[]) {
            return _array && _array.length > 0;
        }
        const tag = `${tinfo.tid} - ${tinfo.tname} >  `
        return {
            events: {
                //   compile: true,
                // call: true,
                // block: true,
                ret: true
            },
            onReceive(rawEvents) {
                let stalkerEventFulls = (Stalker.parse(rawEvents, { annotate: true, stringify: false }) as any);
                console.log(tag + "onReceive...:" + stalkerEventFulls.length)

                // call/blr instructions
                const callEvents: StalkerCallEventFull[] = stalkerEventFulls.filter((even: StalkerEventFull) => even[0] == "call");
                // ret 或者 bx 指令
                const retEvents: StalkerRetEventFull[] = stalkerEventFulls.filter((even: StalkerEventFull) => even[0] == "ret");
                // all instructions. 所有指令
                const execEvents: StalkerExecEventFull[] = stalkerEventFulls.filter((even: StalkerEventFull) => even[0] == "exec");
                // basic block is executed. 基础块执行  
                const blockEvents: StalkerBlockEventFull[] = stalkerEventFulls.filter((even: StalkerEventFull) => even[0] == "block");
                // basic block is compiled. 基础块编译 与 block 不同 他会在每次重新编译后生成统一的事件
                const compileEvents: StalkerCompileEventFull[] = stalkerEventFulls.filter((even: StalkerEventFull) => even[0] == "compile");
                const set = new Set();
                if (array_is_not_empty(retEvents)) {
                    console.log(tag + "-----------stalker retEvents:" + retEvents.length)
                    retEvents.forEach(event => {
                        const [type, location, target, depth] = event as [string, NativePointer, NativePointer, number];
                        const localSym = DebugSymbol.fromAddress(location);
                        const content = `${depth} ${localSym.moduleName} ${localSym.name}`;
                        if (!set.has(content)) {
                            set.add(content);
                            const targetSym = DebugSymbol.fromAddress(target);
                            const m = module_map.find(target);
                            console.log(`${m?.name} ${targetSym.name} -> ${content}`)
                        }
                        // if(localSym.name === "libsvcdemo1.so"){
                        //     console.log(`${depth} ${localSym}`)
                        // }
                    })
                }

                // if (array_is_not_empty(callEvents)) {
                //     console.log(tag + "-----------stalker callEvents:" + callEvents.length)
                //     callEvents.forEach(event => {
                //         const [type, location, target, depth] = event as [string, NativePointer, NativePointer, number];
                //         const localSym = DebugSymbol.fromAddress(location);
                //         const content = `${depth} ${localSym.moduleName} ${localSym.name}`;
                //         if (!set.has(content)) {
                //             set.add(content);
                //             const targetSym = DebugSymbol.fromAddress(target);
                //             console.log(`${targetSym} -> ${content}`)
                //         }
                //         // if(localSym.name === "libsvcdemo1.so"){
                //         //     console.log(`${depth} ${localSym}`)
                //         // }
                //     })
                // }
                // _this.include_modules(["libsvcdemo1.so"]);
            }

        }
    }
    hook_init() {


    }
    hook_check_loop() {
        const _this = this;
        Interceptor.attach(alinker.do_dlopen_ptr, {
            onEnter(args) {
                const path = args[0].readCString();
                const tid = this.threadId;
                this.path = path;
                console.log("-------------------before----------------------")
                console.log("path:" + this.path);
                if (this.path.indexOf("libsvcdemo1.so") != -1) {
                    console.log("attch:" + tid);
                    console.log("mainId:" + _this.mainThreadId);
                    _this.ttrace(tid);
                }
            },
            onLeave(retvalue) {
                _this.unttrace(this.threadId);
                console.log("-------------------after----------------------")
            },
        });
        // Interceptor.attach(unixlibc.pthread_create_ptr, {
        //     onEnter(args) {
        //         const fun_ptr = args[2];
        //         const isArt = module_map.find(fun_ptr)?.name == "libart.so";
        //         if (isArt) {
        //             console.log("isArt:")
        //         } else {
        //             console.log("-----------------------------------------")
        //             console.log(dbg.getBacktraceSymbolsStr(this.context));
        //         }
        //     }
        // });
    }



}
export namespace call_monitor {
    export function demoRun() {
        //com.example.svcdemo1
        console.log(chalk.blue("demoRun...."))
        const cst = new CallStalkerTest("user");
        // cst.watchMain();
        // cst.hook_check_loop();
        // cst.hook_init();
        // cst.watchJniInvoke();
        cst.watchElfInit();
        // cst.watchPthreadCreate();
        
    }
}