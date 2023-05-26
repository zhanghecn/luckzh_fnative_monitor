import { StalkerMonitor, ThreadInfo } from "../monitor/stalker_monitor";

export class CallStalkerTest extends StalkerMonitor {
    stalkerOptions(tinfo: ThreadInfo): StalkerOptions {
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
                
               
                // _this.include_modules(["libsvcdemo1.so"]);
            }

        }
    }

}
export namespace call_monitor {
    export function demoRun() {
        const cst = new CallStalkerTest();
        cst.watchMain();
    }
}