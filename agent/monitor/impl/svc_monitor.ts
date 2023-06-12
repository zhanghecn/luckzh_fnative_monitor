import { StalkerMonitor, ThreadInfo } from "../stalker_monitor";
import { ChalkSelector } from '../../assist/chalk_selector';
import { Chalk } from 'chalk';
import { SignalNameMap } from "../svc/signal_name_map";
import SvcTranslationMap from "../svc/svc_log_translation";

const signalNameMap = new SignalNameMap();
const svcTranslationMap = new SvcTranslationMap();
export class SvcMonitor extends StalkerMonitor {
    chalkSelector = new ChalkSelector();
    stalkerOptions(tinfo: ThreadInfo): StalkerOptions {
        const _this = this;
        const tag = `${tinfo.tid} - ${tinfo.tname} >  `
        return {
            transform: function (iterator: StalkerArm64Iterator) {
                let chalk = _this.chalkSelector.getChalk();
                let instruction: Arm64Instruction;
                while ((instruction = iterator.next()!) != null) {
                    if (instruction.mnemonic === "svc") {
                        iterator.putCallout(function (context: CpuContext) {
                            const arm64context = context as Arm64CpuContext;
                            const x8 = arm64context.x8;
                            const signalName = signalNameMap.getSignalName(x8.toInt32());
                            svcMoniteBefore(signalName, arm64context, chalk);
                        });
                    }
                    iterator.keep();
                    if (instruction.mnemonic === "svc") {
                        iterator.putCallout(function (context: CpuContext) {
                            const arm64context = context as Arm64CpuContext;
                            const x8 = arm64context.x8;
                            const signalName = signalNameMap.getSignalName(x8.toInt32());
                            svcMoniteAfter(signalName, arm64context, chalk);
                        });
                    }
                }

            }
        }
    }

}

function svcMoniteBefore(signalName: string, arm64context: Arm64CpuContext, chalk: Chalk) {
    const lr = arm64context.lr;
    const pc = arm64context.pc;
    const lrSymbol = DebugSymbol.fromAddress(lr);
    const pcSymbol = DebugSymbol.fromAddress(pc);
    const svcTranslation = svcTranslationMap.get(signalName);
    console.log(chalk(`\n-------------------svc ${signalName}--------------`))
    const logSymbol = `\nlrSymbol:${lrSymbol}\n\tpcSymbol:${pcSymbol}`
    console.log(chalk(logSymbol))
    console.log(chalk(`\n${svcTranslation?.translate_before(arm64context)}`))
}

function svcMoniteAfter(signalName: string, arm64context: Arm64CpuContext, chalk: Chalk) {
    const svcTranslation = svcTranslationMap.get(signalName);
    console.log(chalk(`\n${signalName} result:${svcTranslation?.translate_after(arm64context)}`))
}