import { call_monitor } from './test/call_monitor_test';
import './test/call_monitor_test';
import { svc_monitor } from './test/svc_monitor_test';
function main() {
    // call_monitor.demoRun();
    svc_monitor.demoRun();
    // call_monitor.eventLoggerTest();
}

setImmediate(main);

