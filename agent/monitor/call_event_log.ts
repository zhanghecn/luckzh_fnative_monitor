import { Chalk } from "chalk";
import { EventLogger } from "./interface_eventlog";

type CallEvent = (StalkerCallEventFull | StalkerRetEventFull);
type CallEventFull = [string, string, string, number]

export class CallLevenLogger implements EventLogger {
    events: StalkerEventFull[];
    backtracer: Backtracer

    constructor(events: CallEvent[], backtracer = Backtracer.ACCURATE) {
        this.events = this.distinct(events);
        this.backtracer = backtracer
    }

    private distinct(events: CallEvent[]) {
        const reduceEventMap = events.reduce((previous, currentValue, currentIndex, array) => {
            const [type, location, target, depth] = (currentValue as CallEventFull)
            const key = `${target} - ${location}`
            previous.set(key, currentValue);
            return previous;
        }, new Map<string, CallEvent>());

        const distinctEvents = []
        for (const e of reduceEventMap.values()) {
            distinctEvents.push(e);
        }
        return distinctEvents;
    }

    /**
     * detph first search log
     * @param root 
     * @returns 
     */
    trapzoidLogStr(root: CallEventNode) {

        let str = ""

        const stack = [new DepthNode(root, 0)]
        const visited = new Set();
        while (stack.length > 0) {
            let dn: DepthNode = stack.pop()!;
            const dbg = DebugSymbol.fromAddress(ptr(dn.node.target));
            // const dbg_info = dbg ? dbg.toString() : dn.node.target.toString()
            let split = `${multipartStr("   ", dn.depth)}|${dbg}`;
            str = `${str}${split}\n`

            if (!visited.has(dn.node)) {
                visited.add(dn.node)

                for (const child of dn.node.children) {
                    stack.push(new DepthNode(child, dn.depth + 1));
                }
            }
        }
        return str;
    }
    printLog(chalk: Chalk): void {
        let nodeTagConvert: EventNodeTagConvert;
        if (this.backtracer == Backtracer.ACCURATE) {
            nodeTagConvert = ptrstr => ptrstr;
        } else {
            nodeTagConvert = ptrstr => {

                const dsymbol = DebugSymbol.fromAddress(ptr(ptrstr));
                if (dsymbol.name && dsymbol.name.indexOf("+") != -1) {
                    const dsymbolFunNames = dsymbol.name.split("+")
                    return dsymbolFunNames[0];
                }
                return ptrstr;
            }
        }
        const eventNodes = generate_event_nodes(this.events as CallEvent[], nodeTagConvert);
        for (const root of eventNodes) {
            const log = this.trapzoidLogStr(root);
            console.log(chalk(log))
        }
    }

}

function multipartStr(str: string, time: number) {
    let _str = "";
    for (let index = 0; index < time; index++) {
        _str += str;
    }
    return _str;
}
class CallEventNode {
    target: string
    children: CallEventNode[] = []
    children_view = new Set<CallEventNode>();

    constructor(target: string) {
        this.target = target;
    }

    add_child(cnode: CallEventNode) {
        if (!this.children_view.has(cnode)) {
            this.children_view.add(cnode);
            this.children.push(cnode);
        }
    }
}

type EventNodeTagConvert = (ptrStr: string) => string;

function generate_event_nodes(events: CallEvent[], nodeTagConvert: EventNodeTagConvert) {
    const eventMap = new Map<string, CallEventNode>();
    for (const event of events) {
        const [type, location, target, depth] = (event as CallEventFull)

        const targetTag = nodeTagConvert(target);
        const locationTag = nodeTagConvert(location);

        let parent_node = eventMap.get(targetTag);
        if (!parent_node) {
            parent_node = new CallEventNode(target);
            eventMap.set(targetTag, parent_node);
        }

        let child_node = eventMap.get(locationTag);
        if (!child_node) {
            child_node = new CallEventNode(location);
            eventMap.set(locationTag, child_node);
        }

        parent_node.add_child(child_node)
    }

    const roots = []
    // 没有 children 的根节点
    for (const node of eventMap.values()) {
        let include = false;
        for (const n of eventMap.values()) {
            if (n.children_view.has(node)) {
                include = true;
                break;
            }
        }
        if (!include) roots.push(node);
    }

    return roots;
}

class DepthNode {
    node: CallEventNode
    depth: number

    constructor(node: CallEventNode, depth: number) {
        this.node = node
        this.depth = depth
    }
}
