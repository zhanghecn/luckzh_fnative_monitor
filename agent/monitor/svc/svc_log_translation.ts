import { UnixLibc, UnixProc } from '../../native/unix_android';
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

abstract class AbstractSvcTranslation implements SvcTranslation {
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
class DefaultSvcTranslation extends AbstractSvcTranslation {

}
const unixproc = new UnixProc();
class __NR_openatSvcTranslation extends AbstractSvcTranslation {
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
    translate_after(context: Arm64CpuContext): string {
        const fd = context.x0.toInt32();
        const fd_path = unixproc.get_linker_fd_path(fd);
        return fd_path;
    }
}

class __NR_openat2SvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR_openat2"
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
    translate_after(context: Arm64CpuContext): string {
        const fd = context.x0.toInt32();
        const fd_path = unixproc.get_linker_fd_path(fd);
        return fd_path;
    }
}
class __NR_faccessatSvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR_faccessat"
    }
    translate_before(context: Arm64CpuContext): string {
        const fd = context.x0;
        const pathname = context.x1.readCString();
        const model = context.x2;
        const flags = context.x3;
        const svcContent = {
            fd, pathname, flags, model
        }
        return JSON.stringify(svcContent);
    }
}
class __NR_faccessat2SvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR_faccessat2"
    }
    translate_before(context: Arm64CpuContext): string {
        const fd = context.x0;
        const pathname = context.x1.readCString();
        const model = context.x2;
        const flags = context.x3;
        const svcContent = {
            fd, pathname, flags, model
        }
        return JSON.stringify(svcContent);
    }
}

class __NR3264_fstatatSvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR3264_fstatat"
    }
    translate_before(context: Arm64CpuContext): string {
        const fd = context.x0;
        const pathname = context.x1.readCString();
        // const model = context.x2;
        const flags = context.x3;
        const svcContent = {
            fd, pathname, flags
        }
        return JSON.stringify(svcContent);
    }
}

class __NR_readSvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR_read"
    }
    translate_before(context: Arm64CpuContext): string {
        const fd = context.x0.toInt32();
        const fd_path = unixproc.get_linker_fd_path(fd);
        const svcContent = {
            fd_path
        }
        return JSON.stringify(svcContent);
    }
}
class __NR3264_mmapSvcTranslation extends AbstractSvcTranslation {
    support(): string {
        return "__NR3264_mmap"
    }
    translate_before(context: Arm64CpuContext): string {
        const addr = context.x0;
        const length = context.x1;
        const prot = context.x2;
        const flags = context.x3;
        const fd = context.x4;
        const offset = context.x5;
        const fd_path = unixproc.get_linker_fd_path(fd.toInt32());
        const svcContent = {
            addr, length, prot, flags, fd, offset, fd_path
        }
        return JSON.stringify(svcContent);
    }

}

export default class SvcTranslationMap {
    translations = new Map<string, SvcTranslation>();

    constructor() {
        this.add(new DefaultSvcTranslation());
        this.add(new __NR_openatSvcTranslation());
        this.add(new __NR_openat2SvcTranslation());
        this.add(new __NR_faccessatSvcTranslation());
        this.add(new __NR_faccessat2SvcTranslation());
        this.add(new __NR_readSvcTranslation());
        this.add(new __NR3264_fstatatSvcTranslation())
        this.add(new __NR3264_mmapSvcTranslation())
    }
    add(translate: SvcTranslation) {
        const supportSignal = translate.support();
        this.translations.set(supportSignal, translate);
    }

    get(signal: string) {
        const translate = this.translations.get(signal);
        if (translate) {
            return translate;
        }
        return this.translations.get("");
    }
}