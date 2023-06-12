import { ModulePathRangeType, StalkerMonitor } from "../stalker_monitor";
import { CallMonitor } from "./call_monitor";
import { SvcMonitor } from "./svc_monitor";

export class MonitorSelectors {
    monitorMap = new Map<string, any>();

    addMonitor(key: string, monitorCreator: any) {
        this.monitorMap.set(key, monitorCreator);
    }

    constructor() {
        this.addMonitor("call", (function (...args: any[]) {
            return new CallMonitor(...args);
        }).bind(null))
        this.addMonitor("svc", (function (...args: any[]) {
            return new SvcMonitor(...args);
        }).bind(null))
    }
}