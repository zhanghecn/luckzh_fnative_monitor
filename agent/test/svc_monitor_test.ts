import { StalkerMonitor, ThreadInfo, module_map } from "../monitor/stalker_monitor";
import { SignalNameMap } from "../monitor/svc/signal_name_map";
import SvcTranslationMap from '../monitor/svc/svc_log_translation';

export class SvcStalkerTest extends StalkerMonitor {

    stalkerOptions(tinfo: ThreadInfo): StalkerOptions {
        const _this = this;
        const tag = `${tinfo.tid} - ${tinfo.tname} >  `
        return {
            transform: function (iterator: StalkerArm64Iterator) {
                let instruction: Arm64Instruction;
                while ((instruction = iterator.next()!) != null) {
                    const address = instruction?.address!;
                    // const module = module_map.find(address);
                    // if (_this.isExcludeModule(module)) {
                    //     // console.log("exclude:" + module)
                    // } else {

                    // }

                    if (instruction.mnemonic === "svc") {
                        iterator.putCallout(onSvcMoniteBefore);
                        // iterator.putCallout(onSvcMonite);
                    }
                    iterator.keep();
                    if (instruction.mnemonic === "svc") {
                        iterator.putCallout(onSvcMoniteAfter);
                        // iterator.putCallout(onSvcMonite);
                    }
                }

            }
        }
    }


}
const signalNameMap = new SignalNameMap();
const svcTranslationMap = new SvcTranslationMap();
function onSvcMoniteBefore(context: CpuContext): void {
    const arm64context = context as Arm64CpuContext;
    const lr = arm64context.lr;
    const pc = arm64context.pc;
    const x8 = arm64context.x8;
    console.log("--------svc before");
    const lrSymbol = DebugSymbol.fromAddress(lr);
    const pcSymbol = DebugSymbol.fromAddress(pc);
    const logSymbol = `lrSymbol:${lrSymbol}\n\tpcSymbol:${pcSymbol}`
    console.log(logSymbol);
    const signalName = signalNameMap.getSignalName(x8.toInt32())
    const svcTranslation = svcTranslationMap.get(signalName);
    console.log("inentry", svcTranslation?.translate_before(arm64context));
    // const backtraceInfo = Thread.backtrace(context).map(ptr => DebugSymbol.fromAddress(ptr)).join("\n\t");
    // console.log(backtraceInfo)
}
function onSvcMoniteAfter(context: CpuContext): void {
    const arm64context = context as Arm64CpuContext;
    const lr = arm64context.lr;
    const pc = arm64context.pc;
    const x8 = arm64context.x8;
    console.log("--------svc after");
    const lrSymbol = DebugSymbol.fromAddress(lr);
    const pcSymbol = DebugSymbol.fromAddress(pc);
    const logSymbol = `lrSymbol:${lrSymbol}\n\tpcSymbol:${pcSymbol}`
    console.log(logSymbol);
    const signalName = signalNameMap.getSignalName(x8.toInt32())
    const svcTranslation = svcTranslationMap.get(signalName);
    console.log("svc result:", svcTranslation?.translate_after(arm64context));
    // const backtraceInfo = Thread.backtrace(context).map(ptr => DebugSymbol.fromAddress(ptr)).join("\n\t");
    // console.log(backtraceInfo)
}

export namespace svc_monitor {
    export function demoRun() {
        //com.example.svcdemo1
        const cst = new SvcStalkerTest("user");
        // cst.watchMain();
        // cst.hook_check_loop();
        // cst.hook_init();
        // cst.watchJniInvoke();
        cst.watchElfInit();
        // cst.watchPthreadCreate();

    }
}