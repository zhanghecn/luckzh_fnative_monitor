import { CallMonitor } from "../monitor/impl/call_monitor";
import { MonitorSelectors } from "../monitor/impl/monitor_selector";
import { SvcMonitor } from "../monitor/impl/svc_monitor";

export namespace main_monitor_test {
    export function callDemoRun() {
        const cst = new CallMonitor("user");
        cst.watchElfInit();
    }
    export function svcDemoRun() {
        const cst = new SvcMonitor("user");
        cst.watchElfInit();
    }
    export function selectDemoRun() {
        const monitorSelector = new MonitorSelectors();
        const callMonitorCreator = monitorSelector.monitorMap.get("svc");
        const callMonitor = callMonitorCreator("user");
        callMonitor.watchElfInit();
    }
}