import { CallLevenLogger } from "../call_event_log";
import { StalkerMonitor, ThreadInfo, module_map } from "../stalker_monitor";
import { ChalkSelector } from "../../assist/chalk_selector";

export class CallMonitor extends StalkerMonitor {
    chalkSelector = new ChalkSelector();
    stalkerOptions(tinfo: ThreadInfo): StalkerOptions {
        const _this = this;
        function array_is_not_empty(_array: any[]) {
            return _array && _array.length > 0;
        }
        const tag = `${tinfo.tid} - ${tinfo.tname} >  `
        return {
            events: {
                ret: true
            },
            onReceive(rawEvents) {
                const chalk = _this.chalkSelector.getChalk();
                let stalkerEventFulls = (Stalker.parse(rawEvents, { annotate: true, stringify: true }) as any);
                // ret 或者 bx 指令
                const retEvents: StalkerRetEventFull[] = stalkerEventFulls.filter((even: StalkerEventFull) => even[0] == "ret");
                if (array_is_not_empty(retEvents)) {
                    console.log(chalk("\n" + tag + "-----------retEvents:" + retEvents.length))
                    const _retEvents = retEvents.filter(event => {
                        const [type, location, target, depth] = event as [string, string, string, number];
                        const location_m = module_map.find(ptr(location));
                        const target_m = module_map.find(ptr(target));
                        if ((!location_m && !target_m) || _this.isExcludeModule(location_m) && _this.isExcludeModule(target_m)) {
                            return false;
                        }
                        return true;
                    })
                    const logger = new CallLevenLogger(_retEvents, Backtracer.FUZZY);
                    logger.printLog(chalk);
                }

            }

        }
    }

}