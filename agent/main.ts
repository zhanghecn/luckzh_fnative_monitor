import chalk from "chalk";
import { MonitorSelectors } from "./monitor/impl/monitor_selector";
import { IExport } from "./rpc_service";
import { ModulePathRangeType, StalkerMonitor } from "./monitor/stalker_monitor";

let monitorCreate: Function | null = null;
const monitorSelector = new MonitorSelectors();

const rpcFunctions: IExport = {
    rpcExports: {
        "jniWatch": function (type: ModulePathRangeType) {
            const monitor: StalkerMonitor = monitorSelector.monitorMap.get(type)();
            monitor.watchJniInvoke();
        },
        "pthreadCreateWatch": function (type: ModulePathRangeType) {
            const monitor: StalkerMonitor = monitorSelector.monitorMap.get(type)();
            monitor.watchPthreadCreate();
        },
        "monitor": function (type: ModulePathRangeType, range: WatchRange) {
            setImmediate(() => {
                console.log(chalk.bgBlackBright("luck android native watch..."))
                monitorCreate = monitorSelector.monitorMap.get(type);
                if (monitorCreate != null) {
                    const monitor = monitorCreate("user");
                    if (range == "init_array") {
                        console.log(chalk.green("watch init_array"))
                        monitor.watchElfInit();
                    } else if (range == "jni") {
                        console.log(chalk.green("watch jni"))
                        monitor.watchJniInvoke();
                    } else {
                        console.log(chalk.green("watch pthread_create"))
                        monitor.watchPthreadCreate();
                    }
                }
            })
        }
    }
}

type WatchRange = "jni" | "init_array" | "pthread_create"

declare global {
    var jniWatch: (...any: []) => void
    var pthreadCreateWatch: (...any: []) => void
}

Reflect.ownKeys(rpcFunctions.rpcExports).forEach(k => {
    const v = Reflect.get(rpcFunctions.rpcExports, k);
    Reflect.set(globalThis, k, v);
})

rpc.exports = rpcFunctions.rpcExports