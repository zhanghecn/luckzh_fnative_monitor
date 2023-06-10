import { StalkerMonitor, ThreadInfo } from "../stalker_monitor";

class SvcMonitor extends StalkerMonitor {
    stalkerOptions(tinfo: ThreadInfo): StalkerOptions {
        throw new Error("Method not implemented.");
    }

}