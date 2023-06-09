import { SignalNameMap } from './signal_name_map';

/**
 * svc 是 arm64 的 。
 * 所以下面全部是 aarch64 的 系统调用信息
 */
export interface SvcTranslation {
    support(): string;

    translate_before(context: CpuContext): string

    translate_after(context: CpuContext): string
}

export abstract class AbstractSvcTranslation implements SvcTranslation {
    support(): string {
        return ""
    }
    translate_before(context: Arm64CpuContext): string {

        const x0 = context.x0;
        const x1 = context.x1;
        const x2 = context.x2;
        const x3 = context.x3;
        const x4 = context.x4;
        const x5 = context.x5;
        const x6 = context.x6;
        const x7 = context.x7;
        const x8 = context.x8;

        const svcContent = {
            x0,
            x1,
            x2,
            x3,
            x4,
            x5,
            x6,
            x7,
            x8
        }

        return JSON.stringify(svcContent);
    }
    translate_after(context: Arm64CpuContext): string {
        return context.x0.toString();
    }
}

export class __NR_openatSvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR_openat"
    }
    translate_before(context: Arm64CpuContext): string {
        const fd = context.x0;
        const pathname = context.x1.readCString();
        const flags = context.x2;
        const model = context.x3;
        const svcContent = {
            fd, pathname, flags, model
        }
        return JSON.stringify(svcContent);
    }
}

export class __NR_readSvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR_openat"
    }
    translate_before(context: Arm64CpuContext): string {
        const fd = context.x0;
        const pathname = context.x1.readCString();
        const flags = context.x2;
        const model = context.x3;
        const svcContent = {
            fd, pathname, flags, model
        }
        return JSON.stringify(svcContent);
    }
}


