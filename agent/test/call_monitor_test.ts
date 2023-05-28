import { dbg } from "../assist/debug_assist";
import { alinker, module_help } from "../assist/module_assist";
import { StalkerMonitor, ThreadInfo, module_map, unixlibc } from "../monitor/stalker_monitor";
const cm = new CModule(`
#include <stddef.h>
#include <stdint.h>

typedef size_t gsize;
typedef void * gpointer;
typedef uint32_t guint32;
typedef char gchar;

typedef struct _GumSoinfo GumSoinfo;

struct _GumSoinfo
{


  gpointer phdr;
  gsize phnum;

  gpointer base;
  gsize size;



  gpointer dynamic;



  gpointer next;

  uint32_t flags;

  const gchar * strtab;
  gpointer symtab;

  gsize nbucket;
  gsize nchain;
  guint32 * bucket;
  guint32 * chain;



  gpointer plt_relx;
  gsize plt_relx_count;

  gpointer relx;
  gsize relx_count;

  gpointer * preinit_array;
  gsize preinit_array_count;

  gpointer * init_array;
  gsize init_array_count;
  gpointer * fini_array;
  gsize fini_array_count;

  gpointer init_func;
  gpointer fini_func;
};

size_t get_init_array_offset(){
    return offsetof(GumSoinfo,init_array);
} 
size_t get_init_offset(){
    return offsetof(GumSoinfo,init_func);
} 
void* get_init_array(GumSoinfo* gsi){
    return gsi->init_array;
}
int get_init_array_count(GumSoinfo* gsi){
    return gsi->init_array_count;
}
void* get_init_func(GumSoinfo* gsi){
    return gsi->init_func;
}
`);
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

        // const get_init_offset = new NativeFunction(cm.get_init_offset, 'int', [])
        // const get_init_array_offset = new NativeFunction(cm.get_init_array_offset, 'int', [])
        // Interceptor.attach(alinker.call_array_ptr, {
        //     onEnter(args) {
        //         const arrayPtr = args[1];
        //         const ap1 = get_init_offset();
        //         const ap2 = get_init_array_offset();
        //         console.log("-------------call_array---------------");
        //         console.log(arrayPtr);
        //         console.log(ap1)
        //         console.log(ap2)
        //         console.log("dbg_symbol:" + DebugSymbol.fromAddress(arrayPtr));
        //         // console.log("dbg_symbol up:" + DebugSymbol.fromAddress(ap));
        //     },
        //     onLeave(retvalue) {
        //         console.log("-------------call_array  end ---------------");
        //     },
        // });

        const get_init_func = new NativeFunction(cm.get_init_func, 'pointer', ["pointer"])
        const get_init_array = new NativeFunction(cm.get_init_array, 'pointer', ["pointer"])
        Interceptor.attach(alinker.call_constructors_ptr!, {
            onEnter(args) {
                const soinfo = args[0];
                const init_func = get_init_func(soinfo);
                const init_array = get_init_array(soinfo);
                if (init_func.compare(0) || init_array.compare(0)) {
                    console.log("-------------call_constructors---------------");
                    console.log(soinfo)
                    console.log(init_func)
                    console.log(init_array)
                    console.log("dbg_symbol up:" + DebugSymbol.fromAddress(init_func));
                    console.log("dbg_symbol up:" + DebugSymbol.fromAddress(init_array));
                }
            },
            onLeave(retvalue) {
                console.log("-------------call_constructors  end ---------------");
            },
        });

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
        const cst = new CallStalkerTest("all");
        // cst.watchMain();
        // cst.hook_check_loop();
        cst.hook_init();
    }
}