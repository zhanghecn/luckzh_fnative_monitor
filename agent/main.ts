import chalk from "chalk";
import { MonitorSelectors } from "./monitor/impl/monitor_selector";

let monitorCreate: Function | null = null;
const monitorSelector = new MonitorSelectors();

function main() {
    console.log(chalk.bgBlackBright("luck android native watch..."))

    let range: WatchType | null = null;
    const _op = recv("config", (message: any): void => {
        console.log(chalk.yellow(JSON.stringify(message)))
        const payload = message.payload;
        range = payload.range;
        monitorCreate = monitorSelector.monitorMap.get(payload.type);
    });

    _op.wait();

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

}


type WatchType = "jni" | "init_array" | "pthread_create"
