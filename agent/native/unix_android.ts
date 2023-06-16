import chalk from "chalk";

export namespace unix {

    export enum fcntl {
        O_ACCMODE = 0o0000003,
        O_RDONLY = 0o0000000,
        O_WRONLY = 0o0000001,
        O_RDWR = 0o0000002,
        O_CREAT = 0o0000100,
        O_EXCL = 0o0000200,
    }
    export enum linux_fcntl {
        AT_FDCWD = -100,
        AT_SYMLINK_NOFOLLOW = 0x100,
        AT_EACCESS = 0x200,
        AT_REMOVEDIR = 0x200,
        AT_SYMLINK_FOLLOW = 0x400,
        AT_NO_AUTOMOUNT = 0x800,
        AT_EMPTY_PATH = 0x1000,
    }



}
export class UnixProc {
    cmdline_path: string = "/proc/self/cmdline";
    comm_path: string = "/proc/self/task/%s/comm";
    libc: UnixLibc;
    constructor() {
        this.libc = new UnixLibc();
    }
    getThreadComm(threadId: number) {
        let openPath = this.comm_path.replace("%s", threadId.toString());
        let fd = this.libc.open(openPath, unix.fcntl.O_RDONLY);
        const ret = this.libc.readStr(fd).replace("\n", "");
        this.libc.closeFun(fd);
        return ret;
    }
    get_cmdline() {
        let fd = this.libc.openat(
            unix.linux_fcntl.AT_FDCWD,
            this.cmdline_path,
            unix.fcntl.O_RDONLY,
            0
        );
        const ret = this.libc.readStr(fd);
        this.libc.closeFun(fd);
        return ret;
    }
    get_linker_fd_path(fd: number): string {
        if (fd > 0) {
            const realPath = this.libc.readlink(unix.linux_fcntl.AT_FDCWD, fd);
            return realPath;
        }
        return "";
    }
}
export class UnixLibc {
    //-----------可调用的方法指针
    openFun: NativeFunction<number, [NativePointerValue, number]>;
    systemFun: NativeFunction<any, any>;
    readFun: NativeFunction<number, any>;
    closeFun: NativeFunction<any, any>;
    openatFun: NativeFunction<any, any>;
    dlopenFun: NativeFunction<any, any>;
    sleepFun: NativeFunction<any, any>;
    readlinkat: NativeFunction<any, any>;

    //-----------只用于拦截的指针
    dlopen_ext_ptr: NativePointer;
    pthread_create_ptr: NativePointer;
    constructor() {
        const openPtr = Module.findExportByName("libc.so", "open")!;
        const openatPtr = Module.findExportByName("libc.so", "openat")!;
        const systemPtr = Module.findExportByName("libc.so", "system")!;
        const readPtr = Module.findExportByName("libc.so", "read")!;
        const closePtr = Module.findExportByName("libc.so", "close")!;
        const dlopenPtr = Module.findExportByName("libc.so", "dlopen")!;
        const sleepPtr = Module.findExportByName("libc.so", "sleep")!;
        const readlinkatPtr = Module.findExportByName("libc.so", "readlinkat")!;
        this.pthread_create_ptr = Module.findExportByName("libc.so", "pthread_create")!;
        // this.dlopen_ext_ptr = Module.findExportByName("libc.so", "dlopen_ext")!;
        this.dlopen_ext_ptr = Module.findExportByName(
            "libc.so",
            "android_dlopen_ext"
        )!;

        this.openFun = new NativeFunction(openPtr, "int", ["pointer", "int"]);
        this.openatFun = new NativeFunction(openatPtr, "int", [
            "int",
            "pointer",
            "int",
            "int",
        ]);
        this.systemFun = new NativeFunction(systemPtr, "int", ["pointer"]);
        this.readFun = new NativeFunction(readPtr, "int", [
            "int",
            "pointer",
            "int",
        ]);
        this.closeFun = new NativeFunction(closePtr, "int", ["int"]);
        this.dlopenFun = new NativeFunction(dlopenPtr, "void", ["pointer", "int"]);
        this.sleepFun = new NativeFunction(sleepPtr, "int", ["uint"]);
        this.readlinkat = new NativeFunction(readlinkatPtr, "int", ["int", "pointer", "pointer", "int"]);
    }

    open(path: string, flags: number): number {
        let fd = this.openFun(Memory.allocUtf8String(path), flags);

        return fd;
    }
    openat(_fd: number, path: string, flags: number, mode: number): number {
        let fd = this.openatFun(_fd, Memory.allocUtf8String(path), flags, mode);

        return fd;
    }
    sleep(seconds: number): number {
        return this.sleepFun(seconds);
    }
    readlink(_fd: number, fd: number, len = 512): string {
        const filepath_v8 = `/proc/self/fd/${fd}`;
        const filepath = Memory.allocUtf8String(filepath_v8);
        const buf = Memory.alloc(len);
        this.readlinkat(_fd, filepath, buf, len);

        return buf.readCString()!;
    }
    readStr(fd: number, len = 512): string {
        const buf = Memory.alloc(len);
        const ret = this.readFun(fd, buf, len);
        if (ret == -1) {
            return "";
        }
        return buf.readCString()!;
    }
}


export class AndroidLinker {
    do_dlopen_ptr: NativePointer;
    call_array_ptr: NativePointer
    call_constructors_ptr: NativePointer
    find_libraries: NativePointer
    constructor() {
        let linker64Module = Process.findModuleByName("linker64");
        if (linker64Module == null) {
            console.error(chalk.red("未找到 linker64,请确认应用是否是 64 位"))
            linker64Module = Process.findModuleByName("linker");
        }
        const symbols = linker64Module?.enumerateSymbols()!;
        this.do_dlopen_ptr = symbols.filter(exp => exp.name.indexOf("dlopen_ext") != -1)[0].address;
        this.call_array_ptr = symbols.filter(exp => exp.name.indexOf("call_array") != -1)[0].address;
        this.call_constructors_ptr = symbols.filter(exp => exp.name.indexOf("call_constructors") != -1)[0].address;
        this.find_libraries = symbols.filter(exp => exp.name.indexOf("find_libraries") != -1)[0].address;
    }
    hook_do_dlopen(callback: (path: string) => void) {
        Interceptor.attach(this.do_dlopen_ptr, {
            onEnter(args) {
                this.path = args[0].readCString();
            },
            onLeave(retvalue) {
                callback(this.path);
            },
        });
    }
    hook_find_libraries(callback: (path: string) => void) {
        Interceptor.attach(this.find_libraries, {
            onEnter(args: InvocationArguments) {
                const libsArray = args[2];
                const libsCount = args[3].toInt32();

                this.firstLibPath = ""

                if (libsCount > 0) {
                    this.firstLibPath = libsArray.readPointer().readCString();
                }
            },
            onLeave(retvalue) {
                callback(this.firstLibPath);
            },
        });
    }
}