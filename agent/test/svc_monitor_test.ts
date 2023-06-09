import { StalkerMonitor, ThreadInfo, module_map } from "../monitor/stalker_monitor";
import { SignalNameMap } from "../monitor/svc/signal_name_map";
import { SvcTranslation, SvcCallInfoChain } from '../monitor/svc/svc_log_translation';

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
                        iterator.putCallout(onSvcMonite);
                        // iterator.putCallout(onSvcMonite);
                    }
                    iterator.keep();
                    if (instruction.mnemonic === "svc") {
                        iterator.putCallout(onSvcMonite);
                        // iterator.putCallout(onSvcMonite);
                    }
                }

            }
        }
    }


}
const signalNameMap = new SignalNameMap();
function onSvcMonite(context: CpuContext): void {
    const arm64context = context as Arm64CpuContext;
    const lr = arm64context.lr;
    const pc = arm64context.pc;
    const x0 = arm64context.x0;
    const x1 = arm64context.x1;
    const x2 = arm64context.x2;
    const x3 = arm64context.x3;
    const x4 = arm64context.x4;
    const x5 = arm64context.x5;
    const x6 = arm64context.x6;
    const x7 = arm64context.x7;
    const x8 = arm64context.x8;

    console.log("--------svc");
    const lrSymbol = DebugSymbol.fromAddress(lr);
    const pcSymbol = DebugSymbol.fromAddress(pc);
    const logSymbol = `lrSymbol:${lrSymbol}\n\tpcSymbol:${pcSymbol}`
    console.log(logSymbol);
    const signalName = signalNameMap.getSignalName(x8.toInt32())
    const reglog = `\nsignalName:${signalName}\nx0:${x0}\nx1:${x1}\nx2:${x2}\nx3:${x3}\nx4:${x4}\nx5:${x5}\nx6:${x6}\nx7:${x7}\nx8:${x8}\nx8i:${x8.toInt32()}`
    console.log(reglog);
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