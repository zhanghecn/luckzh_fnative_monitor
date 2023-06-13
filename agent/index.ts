import { MonitorSelectors } from "./monitor/impl/monitor_selector";
import { StalkerMonitor } from "./monitor/stalker_monitor";
import chalk, { Chalk } from "chalk";
import { main_monitor_test } from "./test/main_test";


function main() {


    main_monitor_test.selectJniSvcDemoRun();
}

setImmediate(main);

