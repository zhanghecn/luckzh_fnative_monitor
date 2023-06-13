import { CallMonitor } from "../monitor/impl/call_monitor";
import { MonitorSelectors } from "../monitor/impl/monitor_selector";
import { SvcMonitor } from "../monitor/impl/svc_monitor";
import { StalkerMonitor } from "../monitor/stalker_monitor";

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

    export function selectJniDemoRun() {
        const monitorSelector = new MonitorSelectors();
        const callMonitorCreator = monitorSelector.monitorMap.get("call");
        const callMonitor: StalkerMonitor = callMonitorCreator("user");
        callMonitor.watchJniInvoke();
    }

    export function selectJniSvcDemoRun() {
        const monitorSelector = new MonitorSelectors();
        const callMonitorCreator = monitorSelector.monitorMap.get("svc");
        const callMonitor: StalkerMonitor = callMonitorCreator("user");
        callMonitor.watchJniInvoke();
    }
}