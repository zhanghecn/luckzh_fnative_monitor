import { Chalk } from "chalk";

export interface EventLogger {

    events: StalkerEventFull[]

    printLog(chalk: Chalk): void
}