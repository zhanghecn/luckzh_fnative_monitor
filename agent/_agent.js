(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.str_fuzzy = void 0;
var str_fuzzy;
(function (str_fuzzy) {
    function match(mainstr, needstr) {
        const pateern = `^${needstr.replaceAll("*", ".*")}$`;
        const fuzzy_reg = new RegExp(pateern, "i");
        return fuzzy_reg.test(mainstr);
    }
    str_fuzzy.match = match;
})(str_fuzzy = exports.str_fuzzy || (exports.str_fuzzy = {}));
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.module_help = void 0;
const unix_android_1 = require("../native/unix_android");
const fuzzy_match_assist_1 = require("./fuzzy_match_assist");
const al = new unix_android_1.AndroidLinker();
var module_help;
(function (module_help) {
    function watchModule(callback) {
        al.hook_do_dlopen(callback);
    }
    module_help.watchModule = watchModule;
    function nagationModules(mm, path, name) {
        mm.update();
        const ms = mm.values()
            .filter(m => {
            if (path == null)
                return true;
            return !fuzzy_match_assist_1.str_fuzzy.match(m.path, path);
        }).filter(m => {
            if (name == null)
                return true;
            return !fuzzy_match_assist_1.str_fuzzy.match(m.name, name);
        });
        const check_m_names = mm.values()
            .filter(m => {
            if (path == null)
                return true;
            return fuzzy_match_assist_1.str_fuzzy.match(m.path, path);
        }).filter(m => {
            if (name == null)
                return true;
            return fuzzy_match_assist_1.str_fuzzy.match(m.name, name);
        })
            .map(m => m.name);
        console.log("check_m_names:", check_m_names);
        return ms;
    }
    module_help.nagationModules = nagationModules;
})(module_help = exports.module_help || (exports.module_help = {}));
},{"../native/unix_android":6,"./fuzzy_match_assist":1}],3:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const call_monitor_test_1 = require("./test/call_monitor_test");
function main() {
    call_monitor_test_1.call_monitor.demoRun();
}
setImmediate(main);
}).call(this)}).call(this,require("timers").setImmediate)

},{"./test/call_monitor_test":17,"timers":16}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StalkerMonitor = exports.unixproc = exports.module_map = void 0;
const unix_android_1 = require("../native/unix_android");
const module_assist_1 = require("../assist/module_assist");
require("../native/android_art");
const android_art_1 = require("../native/android_art");
const fuzzy_match_assist_1 = require("../assist/fuzzy_match_assist");
exports.module_map = new ModuleMap();
exports.unixproc = new unix_android_1.UnixProc();
function ensureNewestModuleMap() {
    module_assist_1.module_help.watchModule(path => {
        exports.module_map.update();
    });
}
class StalkerMonitor {
    // 监控的 module  路径
    mpath = "user";
    // 监控的 module 名称
    mname = "*";
    // 监控的 symbol
    symbol = "*";
    //  初始化线程
    initThreadIds = [];
    //  主线程
    mainThreadId = -1;
    // 正在跟踪的线程
    traceThreads = new Map();
    // 跟踪的方法指针
    tracePtrs = new Set();
    constructor(mpath = "user", mname = "*", symbol = "*") {
        this.mpath = mpath;
        this.mname = mname;
        this.symbol = symbol;
        this.initThreads();
        this.watchModule();
        ensureNewestModuleMap();
    }
    unwatch() {
        for (const tid of this.traceThreads.keys()) {
            this.unttrace(tid);
        }
    }
    unttrace(tid) {
        if (!this.traceThreads.has(tid)) {
            return;
        }
        this.traceThreads.delete(tid);
        Stalker.unfollow(tid);
    }
    watchModule() {
        exclude_modules(module_assist_1.module_help.nagationModules(exports.module_map, this.get_library_path_prefix(), this.mname));
        //当 spawn 启动的时候 可能部分library 没有加载进去
        module_assist_1.module_help.watchModule(path => {
            exclude_modules(module_assist_1.module_help.nagationModules(exports.module_map, this.get_library_path_prefix(), this.mname));
        });
    }
    watchMain() {
        console.log("watchMain....");
        this.javaNativeWatch(this.mainThreadId);
    }
    /**
     * 在 art 中 方法执行 通过 ArtMethod::Invoke
     * 对于 native 方法 会调用 两个方法
     * art_quick_invoke_stub
     * art_quick_invoke_static_stub
     *
     * 其中会传递 当前 ArtMethod this 对象
     * 在 ArtMethod 结构中:
     * class ArtMethod final {
     *
     * }
     */
    javaNativeWatch(tid) {
        const _this = this;
        function checkSoRange(methodId) {
            const am = new android_art_1.ArtMethod(methodId);
            const jniCodePtr = am.jniCodePtr();
            const m = exports.module_map.find(jniCodePtr);
            if (m != null) {
                const b1 = _this.get_library_path_prefix() ? fuzzy_match_assist_1.str_fuzzy.match(m.path, _this.get_library_path_prefix()) : true;
                const b2 = _this.mname ? fuzzy_match_assist_1.str_fuzzy.match(m.name, _this.mname) : true;
                return b1 && b2;
            }
            return false;
        }
        android_art_1.art.hook_art_quick_invoke_stub((invocontext, args) => {
            const methodId = args[0];
            const _tid = invocontext.threadId;
            if (checkSoRange(methodId) && _tid == tid) {
                _this.ttrace(tid);
            }
        }, (invocontext) => {
            _this.unttrace(tid);
        });
        android_art_1.art.hook_art_quick_invoke_static_stub((invocontext, args) => {
            const methodId = args[0];
            const _tid = invocontext.threadId;
            if (checkSoRange(methodId) && _tid == tid) {
                _this.ttrace(tid);
            }
        }, (invocontext) => {
            _this.unttrace(tid);
        });
    }
    watchPthreadCreate() {
    }
    get_library_path_prefix() {
        if (this.mpath == "user") {
            return "/data/app/**";
        }
        return null;
    }
    ttrace(tid) {
        if (this.traceThreads.has(tid)) {
            return;
        }
        const tinfo = createThreadInfo(tid);
        this.traceThreads.set(tid, tinfo);
        Stalker.follow(tid, this.stalkerOptions(tinfo));
    }
    initThreads() {
        const _tids = Process.enumerateThreads().map(tDetail => tDetail.id);
        const ctid = Process.getCurrentThreadId();
        const firstTid = _tids[0];
        const mainTid = Math.min(ctid, firstTid);
        let tids = _tids;
        if (mainTid != firstTid) {
            tids = [mainTid, ...tids];
        }
        this.initThreadIds = tids;
        this.mainThreadId = mainTid;
    }
}
exports.StalkerMonitor = StalkerMonitor;
function createThreadInfo(tid) {
    const tname = exports.unixproc.getThreadComm(tid);
    return { tname, tid };
}
function exclude_modules(ms) {
    ms.forEach(m => {
        Stalker.exclude(m);
    });
}
},{"../assist/fuzzy_match_assist":1,"../assist/module_assist":2,"../native/android_art":5,"../native/unix_android":6}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtMethod = exports.art = void 0;
const android = require("frida-java-bridge/lib/android");
var art;
(function (art) {
    art.kAccNative = 0x0100;
    art.artso = Process.findModuleByName("libart.so");
    function _hook_art_quick_invoke_stub(quickInvokeType, enter_callback, leave_callback) {
        const art_quick_invoke_stub_ptr = art.artso.enumerateSymbols().filter(symbol => {
            return symbol.name === quickInvokeType;
        })[0].address;
        Interceptor.attach(art_quick_invoke_stub_ptr, {
            onEnter(args) {
                enter_callback(this, args);
            },
            onLeave(retval) {
                leave_callback(this);
            }
        });
    }
    function hook_art_quick_invoke_stub(enter_callback, leave_callback) {
        _hook_art_quick_invoke_stub("art_quick_invoke_stub", enter_callback, leave_callback);
    }
    art.hook_art_quick_invoke_stub = hook_art_quick_invoke_stub;
    function hook_art_quick_invoke_static_stub(enter_callback, leave_callback) {
        _hook_art_quick_invoke_stub("art_quick_invoke_static_stub", enter_callback, leave_callback);
    }
    art.hook_art_quick_invoke_static_stub = hook_art_quick_invoke_static_stub;
    /**
     * 获取 ArtMethod 常用 属性 偏移
     * 原理 通过 找一个合适的 methodId(ArtMethod)
     * 遍历内存 0~0x60 之间 。 找到的合适的数据判断数据范围 对应上偏移
     * @returns ArtMethodSpec
     */
    function getArtMethodSpec() {
        return android.getArtMethodSpec(Java.vm);
    }
    art.getArtMethodSpec = getArtMethodSpec;
})(art = exports.art || (exports.art = {}));
class ArtMethod {
    handle;
    constructor(handle) {
        this.handle = handle;
    }
    prettyMethod(withSignature = true) {
        const result = new StdString();
        // frida gum js 会自动 读取 ObjectWrapper,handle  
        // 'art::ArtMethod::PrettyMethod' 实际是个包装方法 将返回值会写入到 result.handle 内
        // 具体参考 Memory.patchCode 使用 x0 放入 x8 的逻辑 
        android.getApi()['art::ArtMethod::PrettyMethod'](result, this.handle, withSignature ? 1 : 0);
        return result.disposeToString();
    }
    accessFlags() {
        const artMSpec = art.getArtMethodSpec();
        return this.handle.add(artMSpec.offset.accessFlags).readU32();
    }
    isNative() {
        const accessFlags = this.accessFlags();
        return (accessFlags & art.kAccNative) != 0;
    }
    jniCodePtr() {
        const artMSpec = art.getArtMethodSpec();
        return this.handle.add(artMSpec.offset.jniCode).readPointer();
    }
}
exports.ArtMethod = ArtMethod;
const pointerSize = Process.pointerSize;
const STD_STRING_SIZE = 3 * pointerSize;
class StdString {
    handle;
    constructor() {
        this.handle = Memory.alloc(STD_STRING_SIZE);
    }
    dispose() {
        const [data, isTiny] = this._getData();
        if (!isTiny) {
            android.getApi().$delete(data);
        }
    }
    disposeToString() {
        const result = this.toString();
        this.dispose();
        return result;
    }
    toString() {
        const [data] = this._getData();
        return data.readUtf8String();
    }
    _getData() {
        const str = this.handle;
        const isTiny = (str.readU8() & 1) === 0;
        const data = isTiny ? str.add(1) : str.add(2 * pointerSize).readPointer();
        return [data, isTiny];
    }
}
},{"frida-java-bridge/lib/android":8}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidLinker = exports.UnixLibc = exports.UnixProc = exports.unix = void 0;
var unix;
(function (unix) {
    let fcntl;
    (function (fcntl) {
        fcntl[fcntl["O_ACCMODE"] = 3] = "O_ACCMODE";
        fcntl[fcntl["O_RDONLY"] = 0] = "O_RDONLY";
        fcntl[fcntl["O_WRONLY"] = 1] = "O_WRONLY";
        fcntl[fcntl["O_RDWR"] = 2] = "O_RDWR";
        fcntl[fcntl["O_CREAT"] = 64] = "O_CREAT";
        fcntl[fcntl["O_EXCL"] = 128] = "O_EXCL";
    })(fcntl = unix.fcntl || (unix.fcntl = {}));
    let linux_fcntl;
    (function (linux_fcntl) {
        linux_fcntl[linux_fcntl["AT_FDCWD"] = -100] = "AT_FDCWD";
        linux_fcntl[linux_fcntl["AT_SYMLINK_NOFOLLOW"] = 256] = "AT_SYMLINK_NOFOLLOW";
        linux_fcntl[linux_fcntl["AT_EACCESS"] = 512] = "AT_EACCESS";
        linux_fcntl[linux_fcntl["AT_REMOVEDIR"] = 512] = "AT_REMOVEDIR";
        linux_fcntl[linux_fcntl["AT_SYMLINK_FOLLOW"] = 1024] = "AT_SYMLINK_FOLLOW";
        linux_fcntl[linux_fcntl["AT_NO_AUTOMOUNT"] = 2048] = "AT_NO_AUTOMOUNT";
        linux_fcntl[linux_fcntl["AT_EMPTY_PATH"] = 4096] = "AT_EMPTY_PATH";
    })(linux_fcntl = unix.linux_fcntl || (unix.linux_fcntl = {}));
})(unix = exports.unix || (exports.unix = {}));
class UnixProc {
    cmdline_path = "/proc/self/cmdline";
    comm_path = "/proc/self/task/%s/comm";
    libc;
    constructor() {
        this.libc = new UnixLibc();
    }
    getThreadComm(threadId) {
        let openPath = this.comm_path.replace("%s", threadId.toString());
        let fd = this.libc.open(openPath, unix.fcntl.O_RDONLY);
        const ret = this.libc.readStr(fd).replace("\n", "");
        this.libc.closeFun(fd);
        return ret;
    }
    get_cmdline() {
        let fd = this.libc.openat(unix.linux_fcntl.AT_FDCWD, this.cmdline_path, unix.fcntl.O_RDONLY, 0);
        const ret = this.libc.readStr(fd);
        this.libc.closeFun(fd);
        return ret;
    }
}
exports.UnixProc = UnixProc;
class UnixLibc {
    //-----------可调用的方法指针
    openFun;
    systemFun;
    readFun;
    closeFun;
    openatFun;
    dlopenFun;
    sleepFun;
    //-----------只用于拦截的指针
    dlopen_ext_ptr;
    pthread_create_ptr;
    constructor() {
        const openPtr = Module.findExportByName("libc.so", "open");
        const openatPtr = Module.findExportByName("libc.so", "openat");
        const systemPtr = Module.findExportByName("libc.so", "system");
        const readPtr = Module.findExportByName("libc.so", "read");
        const closePtr = Module.findExportByName("libc.so", "close");
        const dlopenPtr = Module.findExportByName("libc.so", "dlopen");
        const sleepPtr = Module.findExportByName("libc.so", "sleep");
        this.pthread_create_ptr = Module.findExportByName("libc.so", "pthread_create");
        // this.dlopen_ext_ptr = Module.findExportByName("libc.so", "dlopen_ext")!;
        this.dlopen_ext_ptr = Module.findExportByName("libc.so", "android_dlopen_ext");
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
    }
    open(path, flags) {
        let fd = this.openFun(Memory.allocUtf8String(path), flags);
        return fd;
    }
    openat(_fd, path, flags, mode) {
        let fd = this.openatFun(_fd, Memory.allocUtf8String(path), flags, mode);
        return fd;
    }
    sleep(seconds) {
        return this.sleepFun(seconds);
    }
    readStr(fd, len = 512) {
        const buf = Memory.alloc(len);
        const ret = this.readFun(fd, buf, len);
        if (ret == -1) {
            return "";
        }
        return buf.readCString();
    }
}
exports.UnixLibc = UnixLibc;
class AndroidLinker {
    do_dlopen_ptr;
    constructor() {
        const linker64Module = Process.findModuleByName("linker64");
        const exports = linker64Module?.enumerateExports();
        this.do_dlopen_ptr = exports.filter(exp => exp.name.indexOf("dlopen_ext") != -1)[0].address;
    }
    hook_do_dlopen(callback) {
        Interceptor.attach(this.do_dlopen_ptr, {
            onEnter(args) {
                this.path = args[0].readCString();
            },
            onLeave(retvalue) {
                callback(this.path);
            },
        });
    }
}
exports.AndroidLinker = AndroidLinker;
},{}],7:[function(require,module,exports){
const {
  pageSize,
  pointerSize
} = Process;

class CodeAllocator {
  constructor (sliceSize) {
    this.sliceSize = sliceSize;
    this.slicesPerPage = pageSize / sliceSize;

    this.pages = [];
    this.free = [];
  }

  allocateSlice (spec, alignment) {
    const anyLocation = spec.near === undefined;
    const anyAlignment = alignment === 1;
    if (anyLocation && anyAlignment) {
      const slice = this.free.pop();
      if (slice !== undefined) {
        return slice;
      }
    } else if (alignment < pageSize) {
      const { free } = this;
      const n = free.length;
      const alignMask = anyAlignment ? null : ptr(alignment - 1);
      for (let i = 0; i !== n; i++) {
        const slice = free[i];

        const satisfiesLocation = anyLocation || this._isSliceNear(slice, spec);
        const satisfiesAlignment = anyAlignment || slice.and(alignMask).isNull();

        if (satisfiesLocation && satisfiesAlignment) {
          return free.splice(i, 1)[0];
        }
      }
    }

    return this._allocatePage(spec);
  }

  _allocatePage (spec) {
    const page = Memory.alloc(pageSize, spec);

    const { sliceSize, slicesPerPage } = this;

    for (let i = 1; i !== slicesPerPage; i++) {
      const slice = page.add(i * sliceSize);
      this.free.push(slice);
    }

    this.pages.push(page);

    return page;
  }

  _isSliceNear (slice, spec) {
    const sliceEnd = slice.add(this.sliceSize);

    const { near, maxDistance } = spec;

    const startDistance = abs(near.sub(slice));
    const endDistance = abs(near.sub(sliceEnd));

    return startDistance.compare(maxDistance) <= 0 &&
        endDistance.compare(maxDistance) <= 0;
  }

  freeSlice (slice) {
    this.free.push(slice);
  }
}

function abs (nptr) {
  const shmt = (pointerSize === 4) ? 31 : 63;
  const mask = ptr(1).shl(shmt).not();
  return nptr.and(mask);
}

function makeAllocator (sliceSize) {
  return new CodeAllocator(sliceSize);
}

module.exports = makeAllocator;

},{}],8:[function(require,module,exports){
(function (global){(function (){
const makeCodeAllocator = require('./alloc');
const {
  jvmtiVersion,
  jvmtiCapabilities,
  EnvJvmti
} = require('./jvmti');
const { parseInstructionsAt } = require('./machine-code');
const memoize = require('./memoize');
const { checkJniResult, JNI_OK } = require('./result');
const VM = require('./vm');

const jsizeSize = 4;
const pointerSize = Process.pointerSize;

const {
  readU32,
  readPointer,
  writeU32,
  writePointer
} = NativePointer.prototype;

const kAccPublic = 0x0001;
const kAccStatic = 0x0008;
const kAccFinal = 0x0010;
const kAccNative = 0x0100;
const kAccFastNative = 0x00080000;
const kAccCriticalNative = 0x00200000;
const kAccFastInterpreterToInterpreterInvoke = 0x40000000;
const kAccSkipAccessChecks = 0x00080000;
const kAccSingleImplementation = 0x08000000;
const kAccNterpEntryPointFastPathFlag = 0x00100000;
const kAccNterpInvokeFastPathFlag = 0x00200000;
const kAccPublicApi = 0x10000000;
const kAccXposedHookedMethod = 0x10000000;

const kPointer = 0x0;

const kFullDeoptimization = 3;
const kSelectiveDeoptimization = 5;

const THUMB_BIT_REMOVAL_MASK = ptr(1).not();

const X86_JMP_MAX_DISTANCE = 0x7fffbfff;
const ARM64_ADRP_MAX_DISTANCE = 0xfffff000;

const ENV_VTABLE_OFFSET_EXCEPTION_CLEAR = 17 * pointerSize;
const ENV_VTABLE_OFFSET_FATAL_ERROR = 18 * pointerSize;

const DVM_JNI_ENV_OFFSET_SELF = 12;

const DVM_CLASS_OBJECT_OFFSET_VTABLE_COUNT = 112;
const DVM_CLASS_OBJECT_OFFSET_VTABLE = 116;

const DVM_OBJECT_OFFSET_CLAZZ = 0;

const DVM_METHOD_SIZE = 56;
const DVM_METHOD_OFFSET_ACCESS_FLAGS = 4;
const DVM_METHOD_OFFSET_METHOD_INDEX = 8;
const DVM_METHOD_OFFSET_REGISTERS_SIZE = 10;
const DVM_METHOD_OFFSET_OUTS_SIZE = 12;
const DVM_METHOD_OFFSET_INS_SIZE = 14;
const DVM_METHOD_OFFSET_SHORTY = 28;
const DVM_METHOD_OFFSET_JNI_ARG_INFO = 36;

const DALVIK_JNI_RETURN_VOID = 0;
const DALVIK_JNI_RETURN_FLOAT = 1;
const DALVIK_JNI_RETURN_DOUBLE = 2;
const DALVIK_JNI_RETURN_S8 = 3;
const DALVIK_JNI_RETURN_S4 = 4;
const DALVIK_JNI_RETURN_S2 = 5;
const DALVIK_JNI_RETURN_U2 = 6;
const DALVIK_JNI_RETURN_S1 = 7;
const DALVIK_JNI_NO_ARG_INFO = 0x80000000;
const DALVIK_JNI_RETURN_SHIFT = 28;

const STD_STRING_SIZE = 3 * pointerSize;
const STD_VECTOR_SIZE = 3 * pointerSize;

const AF_UNIX = 1;
const SOCK_STREAM = 1;

const getArtRuntimeSpec = memoize(_getArtRuntimeSpec);
const getArtInstrumentationSpec = memoize(_getArtInstrumentationSpec);
const getArtMethodSpec = memoize(_getArtMethodSpec);
const getArtThreadSpec = memoize(_getArtThreadSpec);
const getArtManagedStackSpec = memoize(_getArtManagedStackSpec);
const getArtThreadStateTransitionImpl = memoize(_getArtThreadStateTransitionImpl);
const getAndroidVersion = memoize(_getAndroidVersion);
const getAndroidCodename = memoize(_getAndroidCodename);
const getAndroidApiLevel = memoize(_getAndroidApiLevel);
const getArtQuickFrameInfoGetterThunk = memoize(_getArtQuickFrameInfoGetterThunk);

const makeCxxMethodWrapperReturningPointerByValue =
    (Process.arch === 'ia32')
      ? makeCxxMethodWrapperReturningPointerByValueInFirstArg
      : makeCxxMethodWrapperReturningPointerByValueGeneric;

const nativeFunctionOptions = {
  exceptions: 'propagate'
};

const artThreadStateTransitions = {};

let cachedApi = null;
let cachedArtClassLinkerSpec = null;
let MethodMangler = null;
let artController = null;
const inlineHooks = [];
const patchedClasses = new Map();
const artQuickInterceptors = [];
let thunkPage = null;
let thunkOffset = 0;
let taughtArtAboutReplacementMethods = false;
let taughtArtAboutMethodInstrumentation = false;
let backtraceModule = null;
const jdwpSessions = [];
let socketpair = null;

let trampolineAllocator = null;

function getApi () {
  if (cachedApi === null) {
    cachedApi = _getApi();
  }
  return cachedApi;
}

function _getApi () {
  const vmModules = Process.enumerateModules()
    .filter(m => /^lib(art|dvm).so$/.test(m.name))
    .filter(m => !/\/system\/fake-libs/.test(m.path));
  if (vmModules.length === 0) {
    return null;
  }
  const vmModule = vmModules[0];

  const flavor = (vmModule.name.indexOf('art') !== -1) ? 'art' : 'dalvik';
  const isArt = flavor === 'art';

  const temporaryApi = {
    module: vmModule,
    flavor,
    addLocalReference: null
  };

  const pending = isArt
    ? [{
        module: vmModule.path,
        functions: {
          JNI_GetCreatedJavaVMs: ['JNI_GetCreatedJavaVMs', 'int', ['pointer', 'int', 'pointer']],

          // Android < 7
          artInterpreterToCompiledCodeBridge: function (address) {
            this.artInterpreterToCompiledCodeBridge = address;
          },

          // Android >= 8
          _ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadENS_6ObjPtrINS_6mirror6ObjectEEE: ['art::JavaVMExt::AddGlobalRef', 'pointer', ['pointer', 'pointer', 'pointer']],
          // Android >= 6
          _ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadEPNS_6mirror6ObjectE: ['art::JavaVMExt::AddGlobalRef', 'pointer', ['pointer', 'pointer', 'pointer']],
          // Android < 6: makeAddGlobalRefFallbackForAndroid5() needs these:
          _ZN3art17ReaderWriterMutex13ExclusiveLockEPNS_6ThreadE: ['art::ReaderWriterMutex::ExclusiveLock', 'void', ['pointer', 'pointer']],
          _ZN3art17ReaderWriterMutex15ExclusiveUnlockEPNS_6ThreadE: ['art::ReaderWriterMutex::ExclusiveUnlock', 'void', ['pointer', 'pointer']],

          // Android <= 7
          _ZN3art22IndirectReferenceTable3AddEjPNS_6mirror6ObjectE: function (address) {
            this['art::IndirectReferenceTable::Add'] = new NativeFunction(address, 'pointer', ['pointer', 'uint', 'pointer'], nativeFunctionOptions);
          },
          // Android > 7
          _ZN3art22IndirectReferenceTable3AddENS_15IRTSegmentStateENS_6ObjPtrINS_6mirror6ObjectEEE: function (address) {
            this['art::IndirectReferenceTable::Add'] = new NativeFunction(address, 'pointer', ['pointer', 'uint', 'pointer'], nativeFunctionOptions);
          },

          // Android >= 7
          _ZN3art9JavaVMExt12DecodeGlobalEPv: function (address) {
            let decodeGlobal;
            if (getAndroidApiLevel() >= 26) {
              // Returns ObjPtr<mirror::Object>
              decodeGlobal = makeCxxMethodWrapperReturningPointerByValue(address, ['pointer', 'pointer']);
            } else {
              // Returns mirror::Object *
              decodeGlobal = new NativeFunction(address, 'pointer', ['pointer', 'pointer'], nativeFunctionOptions);
            }
            this['art::JavaVMExt::DecodeGlobal'] = function (vm, thread, ref) {
              return decodeGlobal(vm, ref);
            };
          },
          // Android >= 6
          _ZN3art9JavaVMExt12DecodeGlobalEPNS_6ThreadEPv: ['art::JavaVMExt::DecodeGlobal', 'pointer', ['pointer', 'pointer', 'pointer']],
          // Android < 6: makeDecodeGlobalFallbackForAndroid5() fallback uses:
          _ZNK3art6Thread13DecodeJObjectEP8_jobject: ['art::Thread::DecodeJObject', 'pointer', ['pointer', 'pointer']],

          // Android >= 6
          _ZN3art10ThreadList10SuspendAllEPKcb: ['art::ThreadList::SuspendAll', 'void', ['pointer', 'pointer', 'bool']],
          // or fallback:
          _ZN3art10ThreadList10SuspendAllEv: function (address) {
            const suspendAll = new NativeFunction(address, 'void', ['pointer'], nativeFunctionOptions);
            this['art::ThreadList::SuspendAll'] = function (threadList, cause, longSuspend) {
              return suspendAll(threadList);
            };
          },

          _ZN3art10ThreadList9ResumeAllEv: ['art::ThreadList::ResumeAll', 'void', ['pointer']],

          // Android >= 7
          _ZN3art11ClassLinker12VisitClassesEPNS_12ClassVisitorE: ['art::ClassLinker::VisitClasses', 'void', ['pointer', 'pointer']],
          // Android < 7
          _ZN3art11ClassLinker12VisitClassesEPFbPNS_6mirror5ClassEPvES4_: function (address) {
            const visitClasses = new NativeFunction(address, 'void', ['pointer', 'pointer', 'pointer'], nativeFunctionOptions);
            this['art::ClassLinker::VisitClasses'] = function (classLinker, visitor) {
              visitClasses(classLinker, visitor, NULL);
            };
          },

          _ZNK3art11ClassLinker17VisitClassLoadersEPNS_18ClassLoaderVisitorE: ['art::ClassLinker::VisitClassLoaders', 'void', ['pointer', 'pointer']],

          _ZN3art2gc4Heap12VisitObjectsEPFvPNS_6mirror6ObjectEPvES5_: ['art::gc::Heap::VisitObjects', 'void', ['pointer', 'pointer', 'pointer']],
          _ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE: ['art::gc::Heap::GetInstances', 'void', ['pointer', 'pointer', 'pointer', 'int', 'pointer']],

          // Android >= 9
          _ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEbiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE: function (address) {
            const getInstances = new NativeFunction(address, 'void', ['pointer', 'pointer', 'pointer', 'bool', 'int', 'pointer'], nativeFunctionOptions);
            this['art::gc::Heap::GetInstances'] = function (instance, scope, hClass, maxCount, instances) {
              const useIsAssignableFrom = 0;
              getInstances(instance, scope, hClass, useIsAssignableFrom, maxCount, instances);
            };
          },

          _ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEjb: ['art::StackVisitor::StackVisitor', 'void', ['pointer', 'pointer', 'pointer', 'uint', 'uint', 'bool']],
          _ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEmb: ['art::StackVisitor::StackVisitor', 'void', ['pointer', 'pointer', 'pointer', 'uint', 'size_t', 'bool']],
          _ZN3art12StackVisitor9WalkStackILNS0_16CountTransitionsE0EEEvb: ['art::StackVisitor::WalkStack', 'void', ['pointer', 'bool']],
          _ZNK3art12StackVisitor9GetMethodEv: ['art::StackVisitor::GetMethod', 'pointer', ['pointer']],
          _ZNK3art12StackVisitor16DescribeLocationEv: function (address) {
            this['art::StackVisitor::DescribeLocation'] = makeCxxMethodWrapperReturningStdStringByValue(address, ['pointer']);
          },
          _ZNK3art12StackVisitor24GetCurrentQuickFrameInfoEv: function (address) {
            this['art::StackVisitor::GetCurrentQuickFrameInfo'] = makeArtQuickFrameInfoGetter(address);
          },

          _ZN3art6Thread18GetLongJumpContextEv: ['art::Thread::GetLongJumpContext', 'pointer', ['pointer']],

          _ZN3art6mirror5Class13GetDescriptorEPNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEE: function (address) {
            this['art::mirror::Class::GetDescriptor'] = address;
          },
          _ZN3art6mirror5Class11GetLocationEv: function (address) {
            this['art::mirror::Class::GetLocation'] = makeCxxMethodWrapperReturningStdStringByValue(address, ['pointer']);
          },

          _ZN3art9ArtMethod12PrettyMethodEb: function (address) {
            this['art::ArtMethod::PrettyMethod'] = makeCxxMethodWrapperReturningStdStringByValue(address, ['pointer', 'bool']);
          },
          _ZN3art12PrettyMethodEPNS_9ArtMethodEb: function (address) {
            this['art::ArtMethod::PrettyMethodNullSafe'] = makeCxxMethodWrapperReturningStdStringByValue(address, ['pointer', 'bool']);
          },

          // Android < 6 for cloneArtMethod()
          _ZN3art6Thread14CurrentFromGdbEv: ['art::Thread::CurrentFromGdb', 'pointer', []],
          _ZN3art6mirror6Object5CloneEPNS_6ThreadE: function (address) {
            this['art::mirror::Object::Clone'] = new NativeFunction(address, 'pointer', ['pointer', 'pointer'], nativeFunctionOptions);
          },
          _ZN3art6mirror6Object5CloneEPNS_6ThreadEm: function (address) {
            const clone = new NativeFunction(address, 'pointer', ['pointer', 'pointer', 'pointer'], nativeFunctionOptions);
            this['art::mirror::Object::Clone'] = function (thisPtr, threadPtr) {
              const numTargetBytes = NULL;
              return clone(thisPtr, threadPtr, numTargetBytes);
            };
          },
          _ZN3art6mirror6Object5CloneEPNS_6ThreadEj: function (address) {
            const clone = new NativeFunction(address, 'pointer', ['pointer', 'pointer', 'uint'], nativeFunctionOptions);
            this['art::mirror::Object::Clone'] = function (thisPtr, threadPtr) {
              const numTargetBytes = 0;
              return clone(thisPtr, threadPtr, numTargetBytes);
            };
          },

          _ZN3art3Dbg14SetJdwpAllowedEb: ['art::Dbg::SetJdwpAllowed', 'void', ['bool']],
          _ZN3art3Dbg13ConfigureJdwpERKNS_4JDWP11JdwpOptionsE: ['art::Dbg::ConfigureJdwp', 'void', ['pointer']],
          _ZN3art31InternalDebuggerControlCallback13StartDebuggerEv: ['art::InternalDebuggerControlCallback::StartDebugger', 'void', ['pointer']],
          _ZN3art3Dbg9StartJdwpEv: ['art::Dbg::StartJdwp', 'void', []],
          _ZN3art3Dbg8GoActiveEv: ['art::Dbg::GoActive', 'void', []],
          _ZN3art3Dbg21RequestDeoptimizationERKNS_21DeoptimizationRequestE: ['art::Dbg::RequestDeoptimization', 'void', ['pointer']],
          _ZN3art3Dbg20ManageDeoptimizationEv: ['art::Dbg::ManageDeoptimization', 'void', []],

          _ZN3art15instrumentation15Instrumentation20EnableDeoptimizationEv: ['art::Instrumentation::EnableDeoptimization', 'void', ['pointer']],
          // Android >= 6
          _ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEPKc: ['art::Instrumentation::DeoptimizeEverything', 'void', ['pointer', 'pointer']],
          // Android < 6
          _ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEv: function (address) {
            const deoptimize = new NativeFunction(address, 'void', ['pointer'], nativeFunctionOptions);
            this['art::Instrumentation::DeoptimizeEverything'] = function (instrumentation, key) {
              deoptimize(instrumentation);
            };
          },
          _ZN3art7Runtime19DeoptimizeBootImageEv: ['art::Runtime::DeoptimizeBootImage', 'void', ['pointer']],
          _ZN3art15instrumentation15Instrumentation10DeoptimizeEPNS_9ArtMethodE: ['art::Instrumentation::Deoptimize', 'void', ['pointer', 'pointer']],

          // Android >= 11
          _ZN3art3jni12JniIdManager14DecodeMethodIdEP10_jmethodID: ['art::jni::JniIdManager::DecodeMethodId', 'pointer', ['pointer', 'pointer']],
          _ZN3art11interpreter18GetNterpEntryPointEv: ['art::interpreter::GetNterpEntryPoint', 'pointer', []],

          _ZN3art7Monitor17TranslateLocationEPNS_9ArtMethodEjPPKcPi: ['art::Monitor::TranslateLocation', 'void', ['pointer', 'uint32', 'pointer', 'pointer']]
        },
        variables: {
          _ZN3art3Dbg9gRegistryE: function (address) {
            this.isJdwpStarted = () => !address.readPointer().isNull();
          },
          _ZN3art3Dbg15gDebuggerActiveE: function (address) {
            this.isDebuggerActive = () => !!address.readU8();
          }
        },
        optionals: [
          'artInterpreterToCompiledCodeBridge',
          '_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadENS_6ObjPtrINS_6mirror6ObjectEEE',
          '_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadEPNS_6mirror6ObjectE',
          '_ZN3art9JavaVMExt12DecodeGlobalEPv',
          '_ZN3art9JavaVMExt12DecodeGlobalEPNS_6ThreadEPv',
          '_ZN3art10ThreadList10SuspendAllEPKcb',
          '_ZN3art10ThreadList10SuspendAllEv',
          '_ZN3art11ClassLinker12VisitClassesEPNS_12ClassVisitorE',
          '_ZN3art11ClassLinker12VisitClassesEPFbPNS_6mirror5ClassEPvES4_',
          '_ZNK3art11ClassLinker17VisitClassLoadersEPNS_18ClassLoaderVisitorE',
          '_ZN3art6mirror6Object5CloneEPNS_6ThreadE',
          '_ZN3art6mirror6Object5CloneEPNS_6ThreadEm',
          '_ZN3art6mirror6Object5CloneEPNS_6ThreadEj',
          '_ZN3art22IndirectReferenceTable3AddEjPNS_6mirror6ObjectE',
          '_ZN3art22IndirectReferenceTable3AddENS_15IRTSegmentStateENS_6ObjPtrINS_6mirror6ObjectEEE',
          '_ZN3art2gc4Heap12VisitObjectsEPFvPNS_6mirror6ObjectEPvES5_',
          '_ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE',
          '_ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEbiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE',
          '_ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEjb',
          '_ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEmb',
          '_ZN3art12StackVisitor9WalkStackILNS0_16CountTransitionsE0EEEvb',
          '_ZNK3art12StackVisitor9GetMethodEv',
          '_ZNK3art12StackVisitor16DescribeLocationEv',
          '_ZNK3art12StackVisitor24GetCurrentQuickFrameInfoEv',
          '_ZN3art6Thread18GetLongJumpContextEv',
          '_ZN3art6mirror5Class13GetDescriptorEPNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEE',
          '_ZN3art6mirror5Class11GetLocationEv',
          '_ZN3art9ArtMethod12PrettyMethodEb',
          '_ZN3art12PrettyMethodEPNS_9ArtMethodEb',
          '_ZN3art3Dbg13ConfigureJdwpERKNS_4JDWP11JdwpOptionsE',
          '_ZN3art31InternalDebuggerControlCallback13StartDebuggerEv',
          '_ZN3art3Dbg15gDebuggerActiveE',
          '_ZN3art15instrumentation15Instrumentation20EnableDeoptimizationEv',
          '_ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEPKc',
          '_ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEv',
          '_ZN3art7Runtime19DeoptimizeBootImageEv',
          '_ZN3art15instrumentation15Instrumentation10DeoptimizeEPNS_9ArtMethodE',
          '_ZN3art3Dbg9StartJdwpEv',
          '_ZN3art3Dbg8GoActiveEv',
          '_ZN3art3Dbg21RequestDeoptimizationERKNS_21DeoptimizationRequestE',
          '_ZN3art3Dbg20ManageDeoptimizationEv',
          '_ZN3art3Dbg9gRegistryE',
          '_ZN3art3jni12JniIdManager14DecodeMethodIdEP10_jmethodID',
          '_ZN3art11interpreter18GetNterpEntryPointEv',
          '_ZN3art7Monitor17TranslateLocationEPNS_9ArtMethodEjPPKcPi'
        ]
      }]
    : [{
        module: vmModule.path,
        functions: {
          _Z20dvmDecodeIndirectRefP6ThreadP8_jobject: ['dvmDecodeIndirectRef', 'pointer', ['pointer', 'pointer']],
          _Z15dvmUseJNIBridgeP6MethodPv: ['dvmUseJNIBridge', 'void', ['pointer', 'pointer']],
          _Z20dvmHeapSourceGetBasev: ['dvmHeapSourceGetBase', 'pointer', []],
          _Z21dvmHeapSourceGetLimitv: ['dvmHeapSourceGetLimit', 'pointer', []],
          _Z16dvmIsValidObjectPK6Object: ['dvmIsValidObject', 'uint8', ['pointer']],
          JNI_GetCreatedJavaVMs: ['JNI_GetCreatedJavaVMs', 'int', ['pointer', 'int', 'pointer']]
        },
        variables: {
          gDvmJni: function (address) {
            this.gDvmJni = address;
          },
          gDvm: function (address) {
            this.gDvm = address;
          }
        }
      }];

  const missing = [];

  pending.forEach(function (api) {
    const functions = api.functions || {};
    const variables = api.variables || {};
    const optionals = new Set(api.optionals || []);

    const exportByName = Module
      .enumerateExports(api.module)
      .reduce(function (result, exp) {
        result[exp.name] = exp;
        return result;
      }, {});

    Object.keys(functions)
      .forEach(function (name) {
        const exp = exportByName[name];
        if (exp !== undefined && exp.type === 'function') {
          const signature = functions[name];
          if (typeof signature === 'function') {
            signature.call(temporaryApi, exp.address);
          } else {
            temporaryApi[signature[0]] = new NativeFunction(exp.address, signature[1], signature[2], nativeFunctionOptions);
          }
        } else {
          if (!optionals.has(name)) {
            missing.push(name);
          }
        }
      });

    Object.keys(variables)
      .forEach(function (name) {
        const exp = exportByName[name];
        if (exp !== undefined && exp.type === 'variable') {
          const handler = variables[name];
          handler.call(temporaryApi, exp.address);
        } else {
          if (!optionals.has(name)) {
            missing.push(name);
          }
        }
      });
  });

  if (missing.length > 0) {
    throw new Error('Java API only partially available; please file a bug. Missing: ' + missing.join(', '));
  }

  const vms = Memory.alloc(pointerSize);
  const vmCount = Memory.alloc(jsizeSize);
  checkJniResult('JNI_GetCreatedJavaVMs', temporaryApi.JNI_GetCreatedJavaVMs(vms, 1, vmCount));
  if (vmCount.readInt() === 0) {
    return null;
  }
  temporaryApi.vm = vms.readPointer();

  if (isArt) {
    const apiLevel = getAndroidApiLevel();

    let kAccCompileDontBother;
    if (apiLevel >= 27) {
      kAccCompileDontBother = 0x02000000;
    } else if (apiLevel >= 24) {
      kAccCompileDontBother = 0x01000000;
    } else {
      kAccCompileDontBother = 0;
    }
    temporaryApi.kAccCompileDontBother = kAccCompileDontBother;

    const artRuntime = temporaryApi.vm.add(pointerSize).readPointer();
    temporaryApi.artRuntime = artRuntime;
    const runtimeSpec = getArtRuntimeSpec(temporaryApi);
    const runtimeOffset = runtimeSpec.offset;
    const instrumentationOffset = runtimeOffset.instrumentation;
    temporaryApi.artInstrumentation = (instrumentationOffset !== null) ? artRuntime.add(instrumentationOffset) : null;

    temporaryApi.artHeap = artRuntime.add(runtimeOffset.heap).readPointer();
    temporaryApi.artThreadList = artRuntime.add(runtimeOffset.threadList).readPointer();

    /*
     * We must use the *correct* copy (or address) of art_quick_generic_jni_trampoline
     * in order for the stack trace to recognize the JNI stub quick frame.
     *
     * For ARTs for Android 6.x we can just use the JNI trampoline built into ART.
     */
    const classLinker = artRuntime.add(runtimeOffset.classLinker).readPointer();

    const classLinkerOffsets = getArtClassLinkerSpec(artRuntime, runtimeSpec).offset;
    const quickResolutionTrampoline = classLinker.add(classLinkerOffsets.quickResolutionTrampoline).readPointer();
    const quickImtConflictTrampoline = classLinker.add(classLinkerOffsets.quickImtConflictTrampoline).readPointer();
    const quickGenericJniTrampoline = classLinker.add(classLinkerOffsets.quickGenericJniTrampoline).readPointer();
    const quickToInterpreterBridgeTrampoline = classLinker.add(classLinkerOffsets.quickToInterpreterBridgeTrampoline).readPointer();

    temporaryApi.artClassLinker = {
      address: classLinker,
      quickResolutionTrampoline,
      quickImtConflictTrampoline,
      quickGenericJniTrampoline,
      quickToInterpreterBridgeTrampoline
    };

    const vm = new VM(temporaryApi);

    temporaryApi.artQuickGenericJniTrampoline = getArtQuickEntrypointFromTrampoline(quickGenericJniTrampoline, vm);
    temporaryApi.artQuickToInterpreterBridge = getArtQuickEntrypointFromTrampoline(quickToInterpreterBridgeTrampoline, vm);

    if (temporaryApi['art::JavaVMExt::AddGlobalRef'] === undefined) {
      temporaryApi['art::JavaVMExt::AddGlobalRef'] = makeAddGlobalRefFallbackForAndroid5(temporaryApi);
    }
    if (temporaryApi['art::JavaVMExt::DecodeGlobal'] === undefined) {
      temporaryApi['art::JavaVMExt::DecodeGlobal'] = makeDecodeGlobalFallbackForAndroid5(temporaryApi);
    }
    if (temporaryApi['art::ArtMethod::PrettyMethod'] === undefined) {
      temporaryApi['art::ArtMethod::PrettyMethod'] = temporaryApi['art::ArtMethod::PrettyMethodNullSafe'];
    }
    if (temporaryApi['art::interpreter::GetNterpEntryPoint'] !== undefined) {
      temporaryApi.artNterpEntryPoint = temporaryApi['art::interpreter::GetNterpEntryPoint']();
    }

    artController = makeArtController(vm);

    fixupArtQuickDeliverExceptionBug(temporaryApi);

    let cachedJvmti = null;
    Object.defineProperty(temporaryApi, 'jvmti', {
      get () {
        if (cachedJvmti === null) {
          cachedJvmti = [tryGetEnvJvmti(vm, this.artRuntime)];
        }
        return cachedJvmti[0];
      }
    });
  }

  const cxxImports = Module.enumerateImports(vmModule.path)
    .filter(imp => imp.name.indexOf('_Z') === 0)
    .reduce((result, imp) => {
      result[imp.name] = imp.address;
      return result;
    }, {});
  temporaryApi.$new = new NativeFunction(cxxImports._Znwm || cxxImports._Znwj, 'pointer', ['ulong'], nativeFunctionOptions);
  temporaryApi.$delete = new NativeFunction(cxxImports._ZdlPv, 'void', ['pointer'], nativeFunctionOptions);

  MethodMangler = isArt ? ArtMethodMangler : DalvikMethodMangler;

  return temporaryApi;
}

function tryGetEnvJvmti (vm, runtime) {
  let env = null;

  vm.perform(() => {
    const ensurePluginLoaded = new NativeFunction(
      Module.getExportByName('libart.so', '_ZN3art7Runtime18EnsurePluginLoadedEPKcPNSt3__112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEE'),
      'bool',
      ['pointer', 'pointer', 'pointer']);
    const errorPtr = Memory.alloc(pointerSize);
    const success = ensurePluginLoaded(runtime, Memory.allocUtf8String('libopenjdkjvmti.so'), errorPtr);
    if (!success) {
      // FIXME: Avoid leaking error
      return;
    }

    const kArtTiVersion = jvmtiVersion.v1_2 | 0x40000000;
    const handle = vm.tryGetEnvHandle(kArtTiVersion);
    if (handle === null) {
      return;
    }
    env = new EnvJvmti(handle, vm);

    const capaBuf = Memory.alloc(8);
    capaBuf.writeU64(jvmtiCapabilities.canTagObjects);
    const result = env.addCapabilities(capaBuf);
    if (result !== JNI_OK) {
      env = null;
    }
  });

  return env;
}

function ensureClassInitialized (env, classRef) {
  const api = getApi();
  if (api.flavor !== 'art') {
    return;
  }

  env.getFieldId(classRef, 'x', 'Z');
  env.exceptionClear();
}

function getArtVMSpec (api) {
  return {
    offset: (pointerSize === 4)
      ? {
          globalsLock: 32,
          globals: 72
        }
      : {
          globalsLock: 64,
          globals: 112
        }
  };
}

function _getArtRuntimeSpec (api) {
  /*
   * class Runtime {
   * ...
   * gc::Heap* heap_;                <-- we need to find this
   * std::unique_ptr<ArenaPool> jit_arena_pool_;     <----- API level >= 24
   * std::unique_ptr<ArenaPool> arena_pool_;             __
   * std::unique_ptr<ArenaPool> low_4gb_arena_pool_; <--|__ API level >= 23
   * std::unique_ptr<LinearAlloc> linear_alloc_;         \_
   * size_t max_spins_before_thin_lock_inflation_;
   * MonitorList* monitor_list_;
   * MonitorPool* monitor_pool_;
   * ThreadList* thread_list_;        <--- and these
   * InternTable* intern_table_;      <--/
   * ClassLinker* class_linker_;      <-/
   * SignalCatcher* signal_catcher_;
   * SmallIrtAllocator* small_irt_allocator_; <------------ API level >= 33 or Android Tiramisu Developer Preview
   * std::unique_ptr<jni::JniIdManager> jni_id_manager_; <- API level >= 30 or Android R Developer Preview
   * bool use_tombstoned_traces_;     <-------------------- API level 27/28
   * std::string stack_trace_file_;   <-------------------- API level <= 28
   * JavaVMExt* java_vm_;             <-- so we find this then calculate our way backwards
   * ...
   * }
   */

  const vm = api.vm;
  const runtime = api.artRuntime;

  const startOffset = (pointerSize === 4) ? 200 : 384;
  const endOffset = startOffset + (100 * pointerSize);

  const apiLevel = getAndroidApiLevel();
  const codename = getAndroidCodename();

  let spec = null;

  for (let offset = startOffset; offset !== endOffset; offset += pointerSize) {
    const value = runtime.add(offset).readPointer();
    if (value.equals(vm)) {
      let classLinkerOffsets;
      let jniIdManagerOffset = null;
      if (apiLevel >= 33 || codename === 'Tiramisu') {
        classLinkerOffsets = [offset - (4 * pointerSize)];
        jniIdManagerOffset = offset - pointerSize;
      } else if (apiLevel >= 30 || codename === 'R') {
        classLinkerOffsets = [offset - (3 * pointerSize), offset - (4 * pointerSize)];
        jniIdManagerOffset = offset - pointerSize;
      } else if (apiLevel >= 29) {
        classLinkerOffsets = [offset - (2 * pointerSize)];
      } else if (apiLevel >= 27) {
        classLinkerOffsets = [offset - STD_STRING_SIZE - (3 * pointerSize)];
      } else {
        classLinkerOffsets = [offset - STD_STRING_SIZE - (2 * pointerSize)];
      }

      for (const classLinkerOffset of classLinkerOffsets) {
        const internTableOffset = classLinkerOffset - pointerSize;
        const threadListOffset = internTableOffset - pointerSize;

        let heapOffset;
        if (apiLevel >= 24) {
          heapOffset = threadListOffset - (8 * pointerSize);
        } else if (apiLevel >= 23) {
          heapOffset = threadListOffset - (7 * pointerSize);
        } else {
          heapOffset = threadListOffset - (4 * pointerSize);
        }

        const candidate = {
          offset: {
            heap: heapOffset,
            threadList: threadListOffset,
            internTable: internTableOffset,
            classLinker: classLinkerOffset,
            jniIdManager: jniIdManagerOffset
          }
        };
        if (tryGetArtClassLinkerSpec(runtime, candidate) !== null) {
          spec = candidate;
          break;
        }
      }

      break;
    }
  }

  if (spec === null) {
    throw new Error('Unable to determine Runtime field offsets');
  }

  spec.offset.instrumentation = tryDetectInstrumentationOffset(api);
  spec.offset.jniIdsIndirection = tryDetectJniIdsIndirectionOffset();

  return spec;
}

const instrumentationOffsetParsers = {
  ia32: parsex86InstrumentationOffset,
  x64: parsex86InstrumentationOffset,
  arm: parseArmInstrumentationOffset,
  arm64: parseArm64InstrumentationOffset
};

function tryDetectInstrumentationOffset (api) {
  const impl = api['art::Runtime::DeoptimizeBootImage'];
  if (impl === undefined) {
    return null;
  }

  return parseInstructionsAt(impl, instrumentationOffsetParsers[Process.arch], { limit: 30 });
}

function parsex86InstrumentationOffset (insn) {
  if (insn.mnemonic !== 'lea') {
    return null;
  }

  const offset = insn.operands[1].value.disp;
  if (offset < 0x100 || offset > 0x400) {
    return null;
  }

  return offset;
}

function parseArmInstrumentationOffset (insn) {
  if (insn.mnemonic !== 'add.w') {
    return null;
  }

  const ops = insn.operands;
  if (ops.length !== 3) {
    return null;
  }

  const op2 = ops[2];
  if (op2.type !== 'imm') {
    return null;
  }

  return op2.value;
}

function parseArm64InstrumentationOffset (insn) {
  if (insn.mnemonic !== 'add') {
    return null;
  }

  const ops = insn.operands;
  if (ops.length !== 3) {
    return null;
  }

  if (ops[0].value === 'sp' || ops[1].value === 'sp') {
    return null;
  }

  const op2 = ops[2];
  if (op2.type !== 'imm') {
    return null;
  }

  const offset = op2.value.valueOf();
  if (offset < 0x100 || offset > 0x400) {
    return null;
  }

  return offset;
}

const jniIdsIndirectionOffsetParsers = {
  ia32: parsex86JniIdsIndirectionOffset,
  x64: parsex86JniIdsIndirectionOffset,
  arm: parseArmJniIdsIndirectionOffset,
  arm64: parseArm64JniIdsIndirectionOffset
};

function tryDetectJniIdsIndirectionOffset () {
  const impl = Module.findExportByName('libart.so', '_ZN3art7Runtime12SetJniIdTypeENS_9JniIdTypeE');
  if (impl === null) {
    return null;
  }

  const offset = parseInstructionsAt(impl, jniIdsIndirectionOffsetParsers[Process.arch], { limit: 20 });
  if (offset === null) {
    throw new Error('Unable to determine Runtime.jni_ids_indirection_ offset');
  }

  return offset;
}

function parsex86JniIdsIndirectionOffset (insn) {
  if (insn.mnemonic === 'cmp') {
    return insn.operands[0].value.disp;
  }

  return null;
}

function parseArmJniIdsIndirectionOffset (insn) {
  if (insn.mnemonic === 'ldr.w') {
    return insn.operands[1].value.disp;
  }

  return null;
}

function parseArm64JniIdsIndirectionOffset (insn, prevInsn) {
  if (prevInsn === null) {
    return null;
  }

  const { mnemonic } = insn;
  const { mnemonic: prevMnemonic } = prevInsn;

  if ((mnemonic === 'cmp' && prevMnemonic === 'ldr') || (mnemonic === 'bl' && prevMnemonic === 'str')) {
    return prevInsn.operands[1].value.disp;
  }

  return null;
}

function _getArtInstrumentationSpec () {
  const deoptimizationEnabledOffsets = {
    '4-21': 136,
    '4-22': 136,
    '4-23': 172,
    '4-24': 196,
    '4-25': 196,
    '4-26': 196,
    '4-27': 196,
    '4-28': 212,
    '4-29': 172,
    '4-30': 180,
    '8-21': 224,
    '8-22': 224,
    '8-23': 296,
    '8-24': 344,
    '8-25': 344,
    '8-26': 352,
    '8-27': 352,
    '8-28': 392,
    '8-29': 328,
    '8-30': 336
  };

  const deoptEnabledOffset = deoptimizationEnabledOffsets[`${pointerSize}-${getAndroidApiLevel()}`];
  if (deoptEnabledOffset === undefined) {
    throw new Error('Unable to determine Instrumentation field offsets');
  }

  return {
    offset: {
      forcedInterpretOnly: 4,
      deoptimizationEnabled: deoptEnabledOffset
    }
  };
}

function getArtClassLinkerSpec (runtime, runtimeSpec) {
  const spec = tryGetArtClassLinkerSpec(runtime, runtimeSpec);
  if (spec === null) {
    throw new Error('Unable to determine ClassLinker field offsets');
  }
  return spec;
}

function tryGetArtClassLinkerSpec (runtime, runtimeSpec) {
  if (cachedArtClassLinkerSpec !== null) {
    return cachedArtClassLinkerSpec;
  }

  /*
   * On Android 5.x:
   *
   * class ClassLinker {
   * ...
   * InternTable* intern_table_;                          <-- We find this then calculate our way forwards
   * const void* portable_resolution_trampoline_;
   * const void* quick_resolution_trampoline_;
   * const void* portable_imt_conflict_trampoline_;
   * const void* quick_imt_conflict_trampoline_;
   * const void* quick_generic_jni_trampoline_;           <-- ...to this
   * const void* quick_to_interpreter_bridge_trampoline_;
   * ...
   * }
   *
   * On Android 6.x and above:
   *
   * class ClassLinker {
   * ...
   * InternTable* intern_table_;                          <-- We find this then calculate our way forwards
   * const void* quick_resolution_trampoline_;
   * const void* quick_imt_conflict_trampoline_;
   * const void* quick_generic_jni_trampoline_;           <-- ...to this
   * const void* quick_to_interpreter_bridge_trampoline_;
   * ...
   * }
   */

  const { classLinker: classLinkerOffset, internTable: internTableOffset } = runtimeSpec.offset;
  const classLinker = runtime.add(classLinkerOffset).readPointer();
  const internTable = runtime.add(internTableOffset).readPointer();

  const startOffset = (pointerSize === 4) ? 100 : 200;
  const endOffset = startOffset + (100 * pointerSize);

  const apiLevel = getAndroidApiLevel();

  let spec = null;

  for (let offset = startOffset; offset !== endOffset; offset += pointerSize) {
    const value = classLinker.add(offset).readPointer();
    if (value.equals(internTable)) {
      let delta;
      if (apiLevel >= 30 || getAndroidCodename() === 'R') {
        delta = 6;
      } else if (apiLevel >= 29) {
        delta = 4;
      } else if (apiLevel >= 23) {
        delta = 3;
      } else {
        delta = 5;
      }

      const quickGenericJniTrampolineOffset = offset + (delta * pointerSize);

      let quickResolutionTrampolineOffset;
      if (apiLevel >= 23) {
        quickResolutionTrampolineOffset = quickGenericJniTrampolineOffset - (2 * pointerSize);
      } else {
        quickResolutionTrampolineOffset = quickGenericJniTrampolineOffset - (3 * pointerSize);
      }

      spec = {
        offset: {
          quickResolutionTrampoline: quickResolutionTrampolineOffset,
          quickImtConflictTrampoline: quickGenericJniTrampolineOffset - pointerSize,
          quickGenericJniTrampoline: quickGenericJniTrampolineOffset,
          quickToInterpreterBridgeTrampoline: quickGenericJniTrampolineOffset + pointerSize
        }
      };

      break;
    }
  }

  if (spec !== null) {
    cachedArtClassLinkerSpec = spec;
  }

  return spec;
}

function getArtClassSpec (vm) {
  let apiLevel;
  try {
    apiLevel = getAndroidApiLevel();
  } catch (e) {
    return null;
  }

  if (apiLevel < 24) {
    return null;
  }

  let base, cmo;
  if (apiLevel >= 26) {
    base = 40;
    cmo = 116;
  } else {
    base = 56;
    cmo = 124;
  }

  return {
    offset: {
      ifields: base,
      methods: base + 8,
      sfields: base + 16,
      copiedMethodsOffset: cmo
    }
  };
}

function _getArtMethodSpec (vm) {
  const api = getApi();
  let spec;

  vm.perform(env => {
    const process = env.findClass('android/os/Process');
    const getElapsedCpuTime = unwrapMethodId(env.getStaticMethodId(process, 'getElapsedCpuTime', '()J'));
    env.deleteLocalRef(process);

    const runtimeModule = Process.getModuleByName('libandroid_runtime.so');
    const runtimeStart = runtimeModule.base;
    const runtimeEnd = runtimeStart.add(runtimeModule.size);

    const apiLevel = getAndroidApiLevel();

    const entrypointFieldSize = (apiLevel <= 21) ? 8 : pointerSize;

    const expectedAccessFlags = kAccPublic | kAccStatic | kAccFinal | kAccNative;
    const relevantAccessFlagsMask = ~(kAccFastInterpreterToInterpreterInvoke | kAccPublicApi | kAccNterpInvokeFastPathFlag) >>> 0;

    let jniCodeOffset = null;
    let accessFlagsOffset = null;
    let remaining = 2;
    for (let offset = 0; offset !== 64 && remaining !== 0; offset += 4) {
      const field = getElapsedCpuTime.add(offset);

      if (jniCodeOffset === null) {
        const address = field.readPointer();
        if (address.compare(runtimeStart) >= 0 && address.compare(runtimeEnd) < 0) {
          jniCodeOffset = offset;
          remaining--;
        }
      }

      if (accessFlagsOffset === null) {
        const flags = field.readU32();
        if ((flags & relevantAccessFlagsMask) === expectedAccessFlags) {
          accessFlagsOffset = offset;
          remaining--;
        }
      }
    }

    if (remaining !== 0) {
      throw new Error('Unable to determine ArtMethod field offsets');
    }

    const quickCodeOffset = jniCodeOffset + entrypointFieldSize;

    const size = (apiLevel <= 21) ? (quickCodeOffset + 32) : (quickCodeOffset + pointerSize);

    spec = {
      size,
      offset: {
        jniCode: jniCodeOffset,
        quickCode: quickCodeOffset,
        accessFlags: accessFlagsOffset
      }
    };

    if ('artInterpreterToCompiledCodeBridge' in api) {
      spec.offset.interpreterCode = jniCodeOffset - entrypointFieldSize;
    }
  });

  return spec;
}

function getArtFieldSpec (vm) {
  const apiLevel = getAndroidApiLevel();

  if (apiLevel >= 23) {
    return {
      size: 16,
      offset: {
        accessFlags: 4
      }
    };
  }

  if (apiLevel >= 21) {
    return {
      size: 24,
      offset: {
        accessFlags: 12
      }
    };
  }

  return null;
}

function _getArtThreadSpec (vm) {
  /*
   * bool32_t is_exception_reported_to_instrumentation_; <-- We need this on API level <= 22
   * ...
   * mirror::Throwable* exception;                       <-- ...and this on all versions
   * uint8_t* stack_end;
   * ManagedStack managed_stack;
   * uintptr_t* suspend_trigger;
   * JNIEnvExt* jni_env;                                 <-- We find this then calculate our way backwards/forwards
   * JNIEnvExt* tmp_jni_env;                             <-- API level >= 23
   * Thread* self;
   * mirror::Object* opeer;
   * jobject jpeer;
   * uint8_t* stack_begin;
   * size_t stack_size;
   * ThrowLocation throw_location;                       <-- ...and this on API level <= 22
   * union DepsOrStackTraceSample {
   *   DepsOrStackTraceSample() {
   *     verifier_deps = nullptr;
   *     stack_trace_sample = nullptr;
   *   }
   *   std::vector<ArtMethod*>* stack_trace_sample;
   *   verifier::VerifierDeps* verifier_deps;
   * } deps_or_stack_trace_sample;
   * Thread* wait_next;
   * mirror::Object* monitor_enter_object;
   * BaseHandleScope* top_handle_scope;                  <-- ...and to this on all versions
   */

  const apiLevel = getAndroidApiLevel();

  let spec;

  vm.perform(env => {
    const threadHandle = getArtThreadFromEnv(env);
    const envHandle = env.handle;

    let isExceptionReportedOffset = null;
    let exceptionOffset = null;
    let throwLocationOffset = null;
    let topHandleScopeOffset = null;
    let managedStackOffset = null;
    let selfOffset = null;

    for (let offset = 144; offset !== 256; offset += pointerSize) {
      const field = threadHandle.add(offset);

      const value = field.readPointer();
      if (value.equals(envHandle)) {
        exceptionOffset = offset - (6 * pointerSize);
        managedStackOffset = offset - (4 * pointerSize);
        selfOffset = offset + (2 * pointerSize);
        if (apiLevel <= 22) {
          exceptionOffset -= pointerSize;

          isExceptionReportedOffset = exceptionOffset - pointerSize - (9 * 8) - (3 * 4);

          throwLocationOffset = offset + (6 * pointerSize);

          managedStackOffset -= pointerSize;

          selfOffset -= pointerSize;
        }

        topHandleScopeOffset = offset + (9 * pointerSize);
        if (apiLevel <= 22) {
          topHandleScopeOffset += (2 * pointerSize) + 4;
          if (pointerSize === 8) {
            topHandleScopeOffset += 4;
          }
        }
        if (apiLevel >= 23) {
          topHandleScopeOffset += pointerSize;
        }

        break;
      }
    }

    if (topHandleScopeOffset === null) {
      throw new Error('Unable to determine ArtThread field offsets');
    }

    spec = {
      offset: {
        isExceptionReportedToInstrumentation: isExceptionReportedOffset,
        exception: exceptionOffset,
        throwLocation: throwLocationOffset,
        topHandleScope: topHandleScopeOffset,
        managedStack: managedStackOffset,
        self: selfOffset
      }
    };
  });

  return spec;
}

function _getArtManagedStackSpec () {
  const apiLevel = getAndroidApiLevel();

  if (apiLevel >= 23) {
    return {
      offset: {
        topQuickFrame: 0,
        link: pointerSize
      }
    };
  } else {
    return {
      offset: {
        topQuickFrame: 2 * pointerSize,
        link: 0
      }
    };
  }
}

const artQuickTrampolineParsers = {
  ia32: parseArtQuickTrampolineX86,
  x64: parseArtQuickTrampolineX86,
  arm: parseArtQuickTrampolineArm,
  arm64: parseArtQuickTrampolineArm64
};

function getArtQuickEntrypointFromTrampoline (trampoline, vm) {
  let address;

  vm.perform(env => {
    const thread = getArtThreadFromEnv(env);

    const tryParse = artQuickTrampolineParsers[Process.arch];

    const insn = Instruction.parse(trampoline);

    const offset = tryParse(insn);
    if (offset !== null) {
      address = thread.add(offset).readPointer();
    } else {
      address = trampoline;
    }
  });

  return address;
}

function parseArtQuickTrampolineX86 (insn) {
  if (insn.mnemonic === 'jmp') {
    return insn.operands[0].value.disp;
  }

  return null;
}

function parseArtQuickTrampolineArm (insn) {
  if (insn.mnemonic === 'ldr.w') {
    return insn.operands[1].value.disp;
  }

  return null;
}

function parseArtQuickTrampolineArm64 (insn) {
  if (insn.mnemonic === 'ldr') {
    return insn.operands[1].value.disp;
  }

  return null;
}

function getArtThreadFromEnv (env) {
  return env.handle.add(pointerSize).readPointer();
}

function _getAndroidVersion () {
  return getAndroidSystemProperty('ro.build.version.release');
}

function _getAndroidCodename () {
  return getAndroidSystemProperty('ro.build.version.codename');
}

function _getAndroidApiLevel () {
  return parseInt(getAndroidSystemProperty('ro.build.version.sdk'), 10);
}

let systemPropertyGet = null;
const PROP_VALUE_MAX = 92;

function getAndroidSystemProperty (name) {
  if (systemPropertyGet === null) {
    systemPropertyGet = new NativeFunction(Module.getExportByName('libc.so', '__system_property_get'), 'int', ['pointer', 'pointer'], nativeFunctionOptions);
  }
  const buf = Memory.alloc(PROP_VALUE_MAX);
  systemPropertyGet(Memory.allocUtf8String(name), buf);
  return buf.readUtf8String();
}

function withRunnableArtThread (vm, env, fn) {
  const perform = getArtThreadStateTransitionImpl(vm, env);

  const id = getArtThreadFromEnv(env).toString();
  artThreadStateTransitions[id] = fn;

  perform(env.handle);

  if (artThreadStateTransitions[id] !== undefined) {
    delete artThreadStateTransitions[id];
    throw new Error('Unable to perform state transition; please file a bug');
  }
}

function _getArtThreadStateTransitionImpl (vm, env) {
  const callback = new NativeCallback(onThreadStateTransitionComplete, 'void', ['pointer']);
  return makeArtThreadStateTransitionImpl(vm, env, callback);
}

function onThreadStateTransitionComplete (thread) {
  const id = thread.toString();

  const fn = artThreadStateTransitions[id];
  delete artThreadStateTransitions[id];
  fn(thread);
}

function withAllArtThreadsSuspended (fn) {
  const api = getApi();

  const threadList = api.artThreadList;
  const longSuspend = false;
  api['art::ThreadList::SuspendAll'](threadList, Memory.allocUtf8String('frida'), longSuspend ? 1 : 0);
  try {
    fn();
  } finally {
    api['art::ThreadList::ResumeAll'](threadList);
  }
}

class ArtClassVisitor {
  constructor (visit) {
    const visitor = Memory.alloc(4 * pointerSize);

    const vtable = visitor.add(pointerSize);
    visitor.writePointer(vtable);

    const onVisit = new NativeCallback((self, klass) => {
      return visit(klass) === true ? 1 : 0;
    }, 'bool', ['pointer', 'pointer']);
    vtable.add(2 * pointerSize).writePointer(onVisit);

    this.handle = visitor;
    this._onVisit = onVisit;
  }
}

function makeArtClassVisitor (visit) {
  const api = getApi();

  if (api['art::ClassLinker::VisitClasses'] instanceof NativeFunction) {
    return new ArtClassVisitor(visit);
  }

  return new NativeCallback(klass => {
    return visit(klass) === true ? 1 : 0;
  }, 'bool', ['pointer', 'pointer']);
}

class ArtClassLoaderVisitor {
  constructor (visit) {
    const visitor = Memory.alloc(4 * pointerSize);

    const vtable = visitor.add(pointerSize);
    visitor.writePointer(vtable);

    const onVisit = new NativeCallback((self, klass) => {
      visit(klass);
    }, 'void', ['pointer', 'pointer']);
    vtable.add(2 * pointerSize).writePointer(onVisit);

    this.handle = visitor;
    this._onVisit = onVisit;
  }
}

function makeArtClassLoaderVisitor (visit) {
  return new ArtClassLoaderVisitor(visit);
}

const WalkKind = {
  'include-inlined-frames': 0,
  'skip-inlined-frames': 1
};

class ArtStackVisitor {
  constructor (thread, context, walkKind, numFrames = 0, checkSuspended = true) {
    const api = getApi();

    const baseSize = 512; /* Up to 488 bytes on 64-bit Android Q. */
    const vtableSize = 3 * pointerSize;

    const visitor = Memory.alloc(baseSize + vtableSize);

    api['art::StackVisitor::StackVisitor'](visitor, thread, context, WalkKind[walkKind], numFrames,
      checkSuspended ? 1 : 0);

    const vtable = visitor.add(baseSize);
    visitor.writePointer(vtable);

    const onVisitFrame = new NativeCallback(this._visitFrame.bind(this), 'bool', ['pointer']);
    vtable.add(2 * pointerSize).writePointer(onVisitFrame);

    this.handle = visitor;
    this._onVisitFrame = onVisitFrame;

    const curShadowFrame = visitor.add((pointerSize === 4) ? 12 : 24);
    this._curShadowFrame = curShadowFrame;
    this._curQuickFrame = curShadowFrame.add(pointerSize);
    this._curQuickFramePc = curShadowFrame.add(2 * pointerSize);
    this._curOatQuickMethodHeader = curShadowFrame.add(3 * pointerSize);

    this._getMethodImpl = api['art::StackVisitor::GetMethod'];
    this._descLocImpl = api['art::StackVisitor::DescribeLocation'];
    this._getCQFIImpl = api['art::StackVisitor::GetCurrentQuickFrameInfo'];
  }

  walkStack (includeTransitions = false) {
    getApi()['art::StackVisitor::WalkStack'](this.handle, includeTransitions ? 1 : 0);
  }

  _visitFrame () {
    return this.visitFrame() ? 1 : 0;
  }

  visitFrame () {
    throw new Error('Subclass must implement visitFrame');
  }

  getMethod () {
    const methodHandle = this._getMethodImpl(this.handle);
    if (methodHandle.isNull()) {
      return null;
    }
    return new ArtMethod(methodHandle);
  }

  getCurrentQuickFramePc () {
    return this._curQuickFramePc.readPointer();
  }

  getCurrentQuickFrame () {
    return this._curQuickFrame.readPointer();
  }

  getCurrentShadowFrame () {
    return this._curShadowFrame.readPointer();
  }

  describeLocation () {
    const result = new StdString();
    this._descLocImpl(result, this.handle);
    return result.disposeToString();
  }

  getCurrentOatQuickMethodHeader () {
    return this._curOatQuickMethodHeader.readPointer();
  }

  getCurrentQuickFrameInfo () {
    return this._getCQFIImpl(this.handle);
  }
}

class ArtMethod {
  constructor (handle) {
    this.handle = handle;
  }

  prettyMethod (withSignature = true) {
    const result = new StdString();
    getApi()['art::ArtMethod::PrettyMethod'](result, this.handle, withSignature ? 1 : 0);
    return result.disposeToString();
  }

  toString () {
    return `ArtMethod(handle=${this.handle})`;
  }
}

function makeArtQuickFrameInfoGetter (impl) {
  return function (self) {
    const result = Memory.alloc(12);

    getArtQuickFrameInfoGetterThunk(impl)(result, self);

    return {
      frameSizeInBytes: result.readU32(),
      coreSpillMask: result.add(4).readU32(),
      fpSpillMask: result.add(8).readU32()
    };
  };
}

function _getArtQuickFrameInfoGetterThunk (impl) {
  let thunk = NULL;
  switch (Process.arch) {
    case 'ia32':
      thunk = makeThunk(32, writer => {
        writer.putMovRegRegOffsetPtr('ecx', 'esp', 4); // result
        writer.putMovRegRegOffsetPtr('edx', 'esp', 8); // self
        writer.putCallAddressWithArguments(impl, ['ecx', 'edx']);

        // Restore callee's stack frame
        writer.putMovRegReg('esp', 'ebp');
        writer.putPopReg('ebp');

        writer.putRet();
      });
      break;
    case 'x64':
      thunk = makeThunk(32, writer => {
        writer.putPushReg('rdi'); // preserve result buffer pointer
        writer.putCallAddressWithArguments(impl, ['rsi']); // self
        writer.putPopReg('rdi');

        // Struct is stored by value in the rax and edx registers
        // Write struct to result buffer
        writer.putMovRegPtrReg('rdi', 'rax');
        writer.putMovRegOffsetPtrReg('rdi', 8, 'edx');

        writer.putRet();
      });
      break;
    case 'arm':
      thunk = makeThunk(16, writer => {
        // By calling convention, we pass a pointer for the result struct
        writer.putCallAddressWithArguments(impl, ['r0', 'r1']);
        writer.putPopRegs(['r0', 'lr']);
        writer.putMovRegReg('pc', 'lr');
      });
      break;
    case 'arm64':
      thunk = makeThunk(64, writer => {
        writer.putPushRegReg('x0', 'lr');
        writer.putCallAddressWithArguments(impl, ['x1']);
        writer.putPopRegReg('x2', 'lr');
        writer.putStrRegRegOffset('x0', 'x2', 0);
        writer.putStrRegRegOffset('w1', 'x2', 8);
        writer.putRet();
      });
      break;
  }
  return new NativeFunction(thunk, 'void', ['pointer', 'pointer'], nativeFunctionOptions);
}

const thunkRelocators = {
  ia32: global.X86Relocator,
  x64: global.X86Relocator,
  arm: global.ThumbRelocator,
  arm64: global.Arm64Relocator
};

const thunkWriters = {
  ia32: global.X86Writer,
  x64: global.X86Writer,
  arm: global.ThumbWriter,
  arm64: global.Arm64Writer
};

function makeThunk (size, write) {
  if (thunkPage === null) {
    thunkPage = Memory.alloc(Process.pageSize);
  }

  const thunk = thunkPage.add(thunkOffset);

  const arch = Process.arch;

  const Writer = thunkWriters[arch];
  Memory.patchCode(thunk, size, code => {
    const writer = new Writer(code, { pc: thunk });
    write(writer);
    writer.flush();
    if (writer.offset > size) {
      throw new Error(`Wrote ${writer.offset}, exceeding maximum of ${size}`);
    }
  });

  thunkOffset += size;

  return (arch === 'arm') ? thunk.or(1) : thunk;
}

function notifyArtMethodHooked (method, vm) {
  ensureArtKnowsHowToHandleMethodInstrumentation(vm);
  ensureArtKnowsHowToHandleReplacementMethods(vm);
}

function makeArtController (vm) {
  const threadOffsets = getArtThreadSpec(vm).offset;
  const managedStackOffsets = getArtManagedStackSpec().offset;

  const code = `
#include <gum/guminterceptor.h>

extern GMutex lock;
extern GHashTable * methods;
extern GHashTable * replacements;
extern gpointer last_seen_art_method;

extern gpointer get_oat_quick_method_header_impl (gpointer method, gpointer pc);

void
init (void)
{
  g_mutex_init (&lock);
  methods = g_hash_table_new_full (NULL, NULL, NULL, NULL);
  replacements = g_hash_table_new_full (NULL, NULL, NULL, NULL);
}

void
finalize (void)
{
  g_hash_table_unref (replacements);
  g_hash_table_unref (methods);
  g_mutex_clear (&lock);
}

gboolean
is_replacement_method (gpointer method)
{
  gboolean is_replacement;

  g_mutex_lock (&lock);

  is_replacement = g_hash_table_contains (replacements, method);

  g_mutex_unlock (&lock);

  return is_replacement;
}

gpointer
get_replacement_method (gpointer original_method)
{
  gpointer replacement_method;

  g_mutex_lock (&lock);

  replacement_method = g_hash_table_lookup (methods, original_method);

  g_mutex_unlock (&lock);

  return replacement_method;
}

void
set_replacement_method (gpointer original_method,
                        gpointer replacement_method)
{
  g_mutex_lock (&lock);

  g_hash_table_insert (methods, original_method, replacement_method);
  g_hash_table_insert (replacements, replacement_method, original_method);

  g_mutex_unlock (&lock);
}

void
delete_replacement_method (gpointer original_method)
{
  gpointer replacement_method;

  g_mutex_lock (&lock);

  replacement_method = g_hash_table_lookup (methods, original_method);
  if (replacement_method != NULL)
  {
    g_hash_table_remove (methods, original_method);
    g_hash_table_remove (replacements, replacement_method);
  }

  g_mutex_unlock (&lock);
}

gpointer
translate_method (gpointer method)
{
  gpointer translated_method;

  g_mutex_lock (&lock);

  translated_method = g_hash_table_lookup (replacements, method);

  g_mutex_unlock (&lock);

  return (translated_method != NULL) ? translated_method : method;
}

gpointer
find_replacement_method_from_quick_code (gpointer method,
                                         gpointer thread)
{
  gpointer replacement_method;
  gpointer managed_stack;
  gpointer top_quick_frame;
  gpointer link_managed_stack;
  gpointer * link_top_quick_frame;

  replacement_method = get_replacement_method (method);
  if (replacement_method == NULL)
    return NULL;

  /*
   * Stack check.
   *
   * Return NULL to indicate that the original method should be invoked, otherwise
   * return a pointer to the replacement ArtMethod.
   *
   * If the caller is our own JNI replacement stub, then a stack transition must
   * have been pushed onto the current thread's linked list.
   *
   * Therefore, we invoke the original method if the following conditions are met:
   *   1- The current managed stack is empty.
   *   2- The ArtMethod * inside the linked managed stack's top quick frame is the
   *      same as our replacement.
   */
  managed_stack = thread + ${threadOffsets.managedStack};
  top_quick_frame = *((gpointer *) (managed_stack + ${managedStackOffsets.topQuickFrame}));
  if (top_quick_frame != NULL)
    return replacement_method;

  link_managed_stack = *((gpointer *) (managed_stack + ${managedStackOffsets.link}));
  if (link_managed_stack == NULL)
    return replacement_method;

  link_top_quick_frame = GSIZE_TO_POINTER (*((gsize *) (link_managed_stack + ${managedStackOffsets.topQuickFrame})) & ~((gsize) 1));
  if (link_top_quick_frame == NULL || *link_top_quick_frame != replacement_method)
    return replacement_method;

  return NULL;
}

void
on_interpreter_do_call (GumInvocationContext * ic)
{
  gpointer method, replacement_method;

  method = gum_invocation_context_get_nth_argument (ic, 0);

  replacement_method = get_replacement_method (method);
  if (replacement_method != NULL)
    gum_invocation_context_replace_nth_argument (ic, 0, replacement_method);
}

gpointer
on_art_method_get_oat_quick_method_header (gpointer method,
                                           gpointer pc)
{
  if (is_replacement_method (method))
    return NULL;

  return get_oat_quick_method_header_impl (method, pc);
}

void
on_art_method_pretty_method (GumInvocationContext * ic)
{
  const guint this_arg_index = ${(Process.arch === 'arm64') ? 0 : 1};
  gpointer method;

  method = gum_invocation_context_get_nth_argument (ic, this_arg_index);
  if (method == NULL)
    gum_invocation_context_replace_nth_argument (ic, this_arg_index, last_seen_art_method);
  else
    last_seen_art_method = method;
}

void
on_leave_gc_concurrent_copying_copying_phase (GumInvocationContext * ic)
{
  GHashTableIter iter;
  gpointer hooked_method, replacement_method;

  g_mutex_lock (&lock);

  g_hash_table_iter_init (&iter, methods);
  while (g_hash_table_iter_next (&iter, &hooked_method, &replacement_method))
    *((uint32_t *) replacement_method) = *((uint32_t *) hooked_method);

  g_mutex_unlock (&lock);
}
`;

  const lockSize = 8;
  const methodsSize = pointerSize;
  const replacementsSize = pointerSize;
  const lastSeenArtMethodSize = pointerSize;

  const data = Memory.alloc(lockSize + methodsSize + replacementsSize + lastSeenArtMethodSize);

  const lock = data;
  const methods = lock.add(lockSize);
  const replacements = methods.add(methodsSize);
  const lastSeenArtMethod = replacements.add(replacementsSize);

  const getOatQuickMethodHeaderImpl = Module.findExportByName('libart.so',
    (pointerSize === 4)
      ? '_ZN3art9ArtMethod23GetOatQuickMethodHeaderEj'
      : '_ZN3art9ArtMethod23GetOatQuickMethodHeaderEm');

  const cm = new CModule(code, {
    lock,
    methods,
    replacements,
    last_seen_art_method: lastSeenArtMethod,
    get_oat_quick_method_header_impl: getOatQuickMethodHeaderImpl ?? ptr('0xdeadbeef')
  });

  const fastOptions = { exceptions: 'propagate', scheduling: 'exclusive' };

  return {
    handle: cm,
    replacedMethods: {
      isReplacement: new NativeFunction(cm.is_replacement_method, 'bool', ['pointer'], fastOptions),
      get: new NativeFunction(cm.get_replacement_method, 'pointer', ['pointer'], fastOptions),
      set: new NativeFunction(cm.set_replacement_method, 'void', ['pointer', 'pointer'], fastOptions),
      delete: new NativeFunction(cm.delete_replacement_method, 'void', ['pointer'], fastOptions),
      translate: new NativeFunction(cm.translate_method, 'pointer', ['pointer'], fastOptions),
      findReplacementFromQuickCode: cm.find_replacement_method_from_quick_code
    },
    getOatQuickMethodHeaderImpl,
    hooks: {
      Interpreter: {
        doCall: cm.on_interpreter_do_call
      },
      ArtMethod: {
        getOatQuickMethodHeader: cm.on_art_method_get_oat_quick_method_header,
        prettyMethod: cm.on_art_method_pretty_method
      },
      Gc: {
        copyingPhase: {
          onLeave: cm.on_leave_gc_concurrent_copying_copying_phase
        }
      }
    }
  };
}

function ensureArtKnowsHowToHandleMethodInstrumentation (vm) {
  if (taughtArtAboutMethodInstrumentation) {
    return;
  }
  taughtArtAboutMethodInstrumentation = true;

  instrumentArtQuickEntrypoints(vm);
  instrumentArtMethodInvocationFromInterpreter();
}

function instrumentArtQuickEntrypoints (vm) {
  const api = getApi();

  // Entrypoints that dispatch method invocation from the quick ABI.
  const quickEntrypoints = [
    api.artQuickGenericJniTrampoline,
    api.artQuickToInterpreterBridge
  ];

  quickEntrypoints.forEach(entrypoint => {
    Memory.protect(entrypoint, 32, 'rwx');

    const interceptor = new ArtQuickCodeInterceptor(entrypoint);
    interceptor.activate(vm);

    artQuickInterceptors.push(interceptor);
  });
}

function instrumentArtMethodInvocationFromInterpreter () {
  const apiLevel = getAndroidApiLevel();

  let artInterpreterDoCallExportRegex;
  if (apiLevel <= 22) {
    artInterpreterDoCallExportRegex = /^_ZN3art11interpreter6DoCallILb[0-1]ELb[0-1]EEEbPNS_6mirror9ArtMethodEPNS_6ThreadERNS_11ShadowFrameEPKNS_11InstructionEtPNS_6JValueE$/;
  } else {
    artInterpreterDoCallExportRegex = /^_ZN3art11interpreter6DoCallILb[0-1]ELb[0-1]EEEbPNS_9ArtMethodEPNS_6ThreadERNS_11ShadowFrameEPKNS_11InstructionEtPNS_6JValueE$/;
  }

  for (const exp of Module.enumerateExports('libart.so').filter(exp => artInterpreterDoCallExportRegex.test(exp.name))) {
    Interceptor.attach(exp.address, artController.hooks.Interpreter.doCall);
  }
}

function ensureArtKnowsHowToHandleReplacementMethods (vm) {
  if (taughtArtAboutReplacementMethods) {
    return;
  }
  taughtArtAboutReplacementMethods = true;

  if (!maybeInstrumentGetOatQuickMethodHeaderInlineCopies()) {
    const { getOatQuickMethodHeaderImpl } = artController;
    if (getOatQuickMethodHeaderImpl === null) {
      return;
    }

    try {
      Interceptor.replace(getOatQuickMethodHeaderImpl, artController.hooks.ArtMethod.getOatQuickMethodHeader);
    } catch (e) {
      /*
       * Already replaced by another script. For now we don't support replacing methods from multiple scripts,
       * but we'll allow users to try it if they're feeling adventurous.
       */
    }
  }

  const apiLevel = getAndroidApiLevel();

  let exportName = null;
  if (apiLevel > 28) {
    exportName = '_ZN3art2gc9collector17ConcurrentCopying12CopyingPhaseEv';
  } else if (apiLevel > 22) {
    exportName = '_ZN3art2gc9collector17ConcurrentCopying12MarkingPhaseEv';
  }

  if (exportName !== null) {
    Interceptor.attach(Module.getExportByName('libart.so', exportName), artController.hooks.Gc.copyingPhase);
  }
}

const artGetOatQuickMethodHeaderInlinedCopyHandler = {
  arm: {
    signatures: [
      {
        pattern: [
          'b0 68', // ldr r0, [r6, #8]
          '01 30', // adds r0, #1
          '0c d0', // beq #0x16fcd4
          '1b 98', // ldr r0, [sp, #0x6c]
          ':',
          'c0 ff',
          'c0 ff',
          '00 ff',
          '00 2f'
        ],
        validateMatch: validateGetOatQuickMethodHeaderInlinedMatchArm
      },
      {
        pattern: [
          'd8 f8 08 00', // ldr r0, [r8, #8]
          '01 30', // adds r0, #1
          '0c d0', // beq #0x16fcd4
          '1b 98', // ldr r0, [sp, #0x6c]
          ':',
          'f0 ff ff 0f',
          'ff ff',
          '00 ff',
          '00 2f'
        ],
        validateMatch: validateGetOatQuickMethodHeaderInlinedMatchArm
      },
      {
        pattern: [
          'b0 68', // ldr r0, [r6, #8]
          '01 30', // adds r0, #1
          '40 f0 c3 80', // bne #0x203bf0
          '00 25', // movs r5, #0
          ':',
          'c0 ff',
          'c0 ff',
          'c0 fb 00 d0',
          'ff f8'
        ],
        validateMatch: validateGetOatQuickMethodHeaderInlinedMatchArm
      }
    ],
    instrument: instrumentGetOatQuickMethodHeaderInlinedCopyArm
  },
  arm64: {
    signatures: [
      {
        pattern: [
          /* e8 */ '0a 40 b9', // ldr w8, [x23, #0x8]
          '1f 05 00 31', // cmn w8, #0x1
          '40 01 00 54', // b.eq 0x2e4204
          '88 39 00 f0', // adrp x8, 0xa17000
          ':',
          /* 00 */ 'fc ff ff',
          '1f fc ff ff',
          '1f 00 00 ff',
          '00 00 00 9f'
        ],
        offset: 1,
        validateMatch: validateGetOatQuickMethodHeaderInlinedMatchArm64
      },
      {
        pattern: [
          /* e8 */ '0a 40 b9', // ldr w8, [x23, #0x8]
          '1f 05 00 31', // cmn w8, #0x1
          '01 34 00 54', // b.ne 0x3d8e50
          'e0 03 1f aa', // mov x0, xzr
          ':',
          /* 00 */ 'fc ff ff',
          '1f fc ff ff',
          '1f 00 00 ff',
          'e0 ff ff ff'
        ],
        offset: 1,
        validateMatch: validateGetOatQuickMethodHeaderInlinedMatchArm64
      }
    ],
    instrument: instrumentGetOatQuickMethodHeaderInlinedCopyArm64
  }
};

function validateGetOatQuickMethodHeaderInlinedMatchArm ({ address, size }) {
  const ldr = Instruction.parse(address.or(1));
  const [ldrDst, ldrSrc] = ldr.operands;
  const methodReg = ldrSrc.value.base;
  const scratchReg = ldrDst.value;

  const branch = Instruction.parse(ldr.next.add(2));
  const targetWhenTrue = ptr(branch.operands[0].value);
  const targetWhenFalse = branch.address.add(branch.size);

  let targetWhenRegularMethod, targetWhenRuntimeMethod;
  if (branch.mnemonic === 'beq') {
    targetWhenRegularMethod = targetWhenFalse;
    targetWhenRuntimeMethod = targetWhenTrue;
  } else {
    targetWhenRegularMethod = targetWhenTrue;
    targetWhenRuntimeMethod = targetWhenFalse;
  }

  return parseInstructionsAt(targetWhenRegularMethod.or(1), tryParse, { limit: 3 });

  function tryParse (insn) {
    const { mnemonic } = insn;
    if (!(mnemonic === 'ldr' || mnemonic === 'ldr.w')) {
      return null;
    }

    const { base, disp } = insn.operands[1].value;
    if (!(base === methodReg && disp === 0x14)) {
      return null;
    }

    return {
      methodReg,
      scratchReg,
      target: {
        whenTrue: targetWhenTrue,
        whenRegularMethod: targetWhenRegularMethod,
        whenRuntimeMethod: targetWhenRuntimeMethod
      }
    };
  }
}

function validateGetOatQuickMethodHeaderInlinedMatchArm64 ({ address, size }) {
  const [ldrDst, ldrSrc] = Instruction.parse(address).operands;
  const methodReg = ldrSrc.value.base;
  const scratchReg = 'x' + ldrDst.value.substring(1);

  const branch = Instruction.parse(address.add(8));
  const targetWhenTrue = ptr(branch.operands[0].value);
  const targetWhenFalse = address.add(12);

  let targetWhenRegularMethod, targetWhenRuntimeMethod;
  if (branch.mnemonic === 'b.eq') {
    targetWhenRegularMethod = targetWhenFalse;
    targetWhenRuntimeMethod = targetWhenTrue;
  } else {
    targetWhenRegularMethod = targetWhenTrue;
    targetWhenRuntimeMethod = targetWhenFalse;
  }

  return parseInstructionsAt(targetWhenRegularMethod, tryParse, { limit: 3 });

  function tryParse (insn) {
    if (insn.mnemonic !== 'ldr') {
      return null;
    }

    const { base, disp } = insn.operands[1].value;
    if (!(base === methodReg && disp === 0x18)) {
      return null;
    }

    return {
      methodReg,
      scratchReg,
      target: {
        whenTrue: targetWhenTrue,
        whenRegularMethod: targetWhenRegularMethod,
        whenRuntimeMethod: targetWhenRuntimeMethod
      }
    };
  }
}

function maybeInstrumentGetOatQuickMethodHeaderInlineCopies () {
  if (getAndroidApiLevel() < 31) {
    return false;
  }

  const handler = artGetOatQuickMethodHeaderInlinedCopyHandler[Process.arch];
  if (handler === undefined) {
    // Not needed on x86 and x64, at least not for now...
    return false;
  }

  const signatures = handler.signatures.map(({ pattern, offset = 0, validateMatch = returnEmptyObject }) => {
    return {
      pattern: new MatchPattern(pattern.join('')),
      offset,
      validateMatch
    };
  });

  const impls = [];
  for (const { base, size } of getApi().module.enumerateRanges('--x')) {
    for (const { pattern, offset, validateMatch } of signatures) {
      const matches = Memory.scanSync(base, size, pattern)
        .map(({ address, size }) => {
          return { address: address.sub(offset), size: size + offset };
        })
        .filter(match => {
          const validationResult = validateMatch(match);
          if (validationResult === null) {
            return false;
          }
          match.validationResult = validationResult;
          return true;
        });
      impls.push(...matches);
    }
  }

  if (impls.length === 0) {
    return false;
  }

  impls.forEach(handler.instrument);

  return true;
}

function returnEmptyObject () {
  return {};
}

class InlineHook {
  constructor (address, size, trampoline) {
    this.address = address;
    this.size = size;
    this.originalCode = address.readByteArray(size);
    this.trampoline = trampoline;
  }

  revert () {
    Memory.patchCode(this.address, this.size, code => {
      code.writeByteArray(this.originalCode);
    });
  }
}

function instrumentGetOatQuickMethodHeaderInlinedCopyArm ({ address, size, validationResult }) {
  const { methodReg, target } = validationResult;

  const trampoline = Memory.alloc(Process.pageSize);
  let redirectCapacity = size;

  Memory.patchCode(trampoline, 256, code => {
    const writer = new ThumbWriter(code, { pc: trampoline });

    const relocator = new ThumbRelocator(address, writer);
    for (let i = 0; i !== 2; i++) {
      relocator.readOne();
    }
    relocator.writeAll();

    relocator.readOne();
    relocator.skipOne();
    writer.putBCondLabel('eq', 'runtime_or_replacement_method');

    const vpushFpRegs = [0x2d, 0xed, 0x10, 0x0a]; /* vpush {s0-s15} */
    writer.putBytes(vpushFpRegs);

    const savedRegs = ['r0', 'r1', 'r2', 'r3'];
    writer.putPushRegs(savedRegs);

    writer.putCallAddressWithArguments(artController.replacedMethods.isReplacement, [methodReg]);
    writer.putCmpRegImm('r0', 0);

    writer.putPopRegs(savedRegs);

    const vpopFpRegs = [0xbd, 0xec, 0x10, 0x0a]; /* vpop {s0-s15} */
    writer.putBytes(vpopFpRegs);

    writer.putBCondLabel('ne', 'runtime_or_replacement_method');
    writer.putBLabel('regular_method');

    relocator.readOne();

    const tailIsRegular = relocator.input.address.equals(target.whenRegularMethod);

    writer.putLabel(tailIsRegular ? 'regular_method' : 'runtime_or_replacement_method');
    relocator.writeOne();
    while (redirectCapacity < 10) {
      const offset = relocator.readOne();
      if (offset === 0) {
        redirectCapacity = 10;
        break;
      }
      redirectCapacity = offset;
    }
    relocator.writeAll();
    writer.putBranchAddress(address.add(redirectCapacity + 1));

    writer.putLabel(tailIsRegular ? 'runtime_or_replacement_method' : 'regular_method');
    writer.putBranchAddress(target.whenTrue);

    writer.flush();
  });

  inlineHooks.push(new InlineHook(address, redirectCapacity, trampoline));

  Memory.patchCode(address, redirectCapacity, code => {
    const writer = new ThumbWriter(code, { pc: address });
    writer.putLdrRegAddress('pc', trampoline.or(1));
    writer.flush();
  });
}

function instrumentGetOatQuickMethodHeaderInlinedCopyArm64 ({ address, size, validationResult }) {
  const { methodReg, scratchReg, target } = validationResult;

  const trampoline = Memory.alloc(Process.pageSize);

  Memory.patchCode(trampoline, 256, code => {
    const writer = new Arm64Writer(code, { pc: trampoline });

    const relocator = new Arm64Relocator(address, writer);
    for (let i = 0; i !== 2; i++) {
      relocator.readOne();
    }
    relocator.writeAll();

    relocator.readOne();
    relocator.skipOne();
    writer.putBCondLabel('eq', 'runtime_or_replacement_method');

    const savedRegs = [
      'd0', 'd1',
      'd2', 'd3',
      'd4', 'd5',
      'd6', 'd7',
      'x0', 'x1',
      'x2', 'x3',
      'x4', 'x5',
      'x6', 'x7',
      'x8', 'x9',
      'x10', 'x11',
      'x12', 'x13',
      'x14', 'x15',
      'x16', 'x17'
    ];
    const numSavedRegs = savedRegs.length;

    for (let i = 0; i !== numSavedRegs; i += 2) {
      writer.putPushRegReg(savedRegs[i], savedRegs[i + 1]);
    }

    writer.putCallAddressWithArguments(artController.replacedMethods.isReplacement, [methodReg]);
    writer.putCmpRegReg('x0', 'xzr');

    for (let i = numSavedRegs - 2; i >= 0; i -= 2) {
      writer.putPopRegReg(savedRegs[i], savedRegs[i + 1]);
    }

    writer.putBCondLabel('ne', 'runtime_or_replacement_method');
    writer.putBLabel('regular_method');

    relocator.readOne();
    const tailInstruction = relocator.input;

    const tailIsRegular = tailInstruction.address.equals(target.whenRegularMethod);

    writer.putLabel(tailIsRegular ? 'regular_method' : 'runtime_or_replacement_method');
    relocator.writeOne();
    writer.putBranchAddress(tailInstruction.next);

    writer.putLabel(tailIsRegular ? 'runtime_or_replacement_method' : 'regular_method');
    writer.putBranchAddress(target.whenTrue);

    writer.flush();
  });

  inlineHooks.push(new InlineHook(address, size, trampoline));

  Memory.patchCode(address, size, code => {
    const writer = new Arm64Writer(code, { pc: address });
    writer.putLdrRegAddress(scratchReg, trampoline);
    writer.putBrReg(scratchReg);
    writer.flush();
  });
}

function makeMethodMangler (methodId) {
  return new MethodMangler(methodId);
}

function translateMethod (methodId) {
  return artController.replacedMethods.translate(methodId);
}

function backtrace (vm, options = {}) {
  const { limit = 16 } = options;

  const env = vm.getEnv();

  if (backtraceModule === null) {
    backtraceModule = makeBacktraceModule(vm, env);
  }

  return backtraceModule.backtrace(env, limit);
}

function makeBacktraceModule (vm, env) {
  const api = getApi();

  const performImpl = Memory.alloc(Process.pointerSize);

  const cm = new CModule(`
#include <glib.h>
#include <stdbool.h>
#include <string.h>
#include <gum/gumtls.h>
#include <json-glib/json-glib.h>

typedef struct _ArtBacktrace ArtBacktrace;
typedef struct _ArtStackFrame ArtStackFrame;

typedef struct _ArtStackVisitor ArtStackVisitor;
typedef struct _ArtStackVisitorVTable ArtStackVisitorVTable;

typedef struct _ArtClass ArtClass;
typedef struct _ArtMethod ArtMethod;
typedef struct _ArtThread ArtThread;
typedef struct _ArtContext ArtContext;

typedef struct _JNIEnv JNIEnv;

typedef struct _StdString StdString;
typedef struct _StdTinyString StdTinyString;
typedef struct _StdLargeString StdLargeString;

typedef enum {
  STACK_WALK_INCLUDE_INLINED_FRAMES,
  STACK_WALK_SKIP_INLINED_FRAMES,
} StackWalkKind;

struct _StdTinyString
{
  guint8 unused;
  gchar data[(3 * sizeof (gpointer)) - 1];
};

struct _StdLargeString
{
  gsize capacity;
  gsize size;
  gchar * data;
};

struct _StdString
{
  union
  {
    guint8 flags;
    StdTinyString tiny;
    StdLargeString large;
  };
};

struct _ArtBacktrace
{
  GChecksum * id;
  GArray * frames;
  gchar * frames_json;
};

struct _ArtStackFrame
{
  ArtMethod * method;
  gsize dexpc;
  StdString description;
};

struct _ArtStackVisitorVTable
{
  void (* unused1) (void);
  void (* unused2) (void);
  bool (* visit) (ArtStackVisitor * visitor);
};

struct _ArtStackVisitor
{
  ArtStackVisitorVTable * vtable;

  guint8 padding[512];

  ArtStackVisitorVTable vtable_storage;

  ArtBacktrace * backtrace;
};

struct _ArtMethod
{
  guint32 declaring_class;
  guint32 access_flags;
};

extern GumTlsKey current_backtrace;

extern void (* perform_art_thread_state_transition) (JNIEnv * env);

extern ArtContext * art_thread_get_long_jump_context (ArtThread * thread);

extern void art_stack_visitor_init (ArtStackVisitor * visitor, ArtThread * thread, void * context, StackWalkKind walk_kind,
    size_t num_frames, bool check_suspended);
extern void art_stack_visitor_walk_stack (ArtStackVisitor * visitor, bool include_transitions);
extern ArtMethod * art_stack_visitor_get_method (ArtStackVisitor * visitor);
extern void art_stack_visitor_describe_location (StdString * description, ArtStackVisitor * visitor);
extern ArtMethod * translate_method (ArtMethod * method);
extern void translate_location (ArtMethod * method, guint32 pc, const gchar ** source_file, gint32 * line_number);
extern void get_class_location (StdString * result, ArtClass * klass);
extern void cxx_delete (void * mem);
extern unsigned long strtoul (const char * str, char ** endptr, int base);

static bool visit_frame (ArtStackVisitor * visitor);
static void art_stack_frame_destroy (ArtStackFrame * frame);

static void append_jni_type_name (GString * s, const gchar * name, gsize length);

static void std_string_destroy (StdString * str);
static gchar * std_string_get_data (StdString * str);

void
init (void)
{
  current_backtrace = gum_tls_key_new ();
}

void
finalize (void)
{
  gum_tls_key_free (current_backtrace);
}

ArtBacktrace *
_create (JNIEnv * env,
         guint limit)
{
  ArtBacktrace * bt;

  bt = g_new (ArtBacktrace, 1);
  bt->id = g_checksum_new (G_CHECKSUM_SHA1);
  bt->frames = (limit != 0)
      ? g_array_sized_new (FALSE, FALSE, sizeof (ArtStackFrame), limit)
      : g_array_new (FALSE, FALSE, sizeof (ArtStackFrame));
  g_array_set_clear_func (bt->frames, (GDestroyNotify) art_stack_frame_destroy);
  bt->frames_json = NULL;

  gum_tls_key_set_value (current_backtrace, bt);

  perform_art_thread_state_transition (env);

  gum_tls_key_set_value (current_backtrace, NULL);

  return bt;
}

void
_on_thread_state_transition_complete (ArtThread * thread)
{
  ArtContext * context;
  ArtStackVisitor visitor = {
    .vtable_storage = {
      .visit = visit_frame,
    },
  };

  context = art_thread_get_long_jump_context (thread);

  art_stack_visitor_init (&visitor, thread, context, STACK_WALK_SKIP_INLINED_FRAMES, 0, true);
  visitor.vtable = &visitor.vtable_storage;
  visitor.backtrace = gum_tls_key_get_value (current_backtrace);

  art_stack_visitor_walk_stack (&visitor, false);

  cxx_delete (context);
}

static bool
visit_frame (ArtStackVisitor * visitor)
{
  ArtBacktrace * bt = visitor->backtrace;
  ArtStackFrame frame;
  const gchar * description, * dexpc_part;

  frame.method = art_stack_visitor_get_method (visitor);

  art_stack_visitor_describe_location (&frame.description, visitor);

  description = std_string_get_data (&frame.description);
  if (strstr (description, " '<") != NULL)
    goto skip;

  dexpc_part = strstr (description, " at dex PC 0x");
  if (dexpc_part == NULL)
    goto skip;
  frame.dexpc = strtoul (dexpc_part + 13, NULL, 16);

  g_array_append_val (bt->frames, frame);

  g_checksum_update (bt->id, (guchar *) &frame.method, sizeof (frame.method));
  g_checksum_update (bt->id, (guchar *) &frame.dexpc, sizeof (frame.dexpc));

  return true;

skip:
  std_string_destroy (&frame.description);
  return true;
}

static void
art_stack_frame_destroy (ArtStackFrame * frame)
{
  std_string_destroy (&frame->description);
}

void
_destroy (ArtBacktrace * backtrace)
{
  g_free (backtrace->frames_json);
  g_array_free (backtrace->frames, TRUE);
  g_checksum_free (backtrace->id);
  g_free (backtrace);
}

const gchar *
_get_id (ArtBacktrace * backtrace)
{
  return g_checksum_get_string (backtrace->id);
}

const gchar *
_get_frames (ArtBacktrace * backtrace)
{
  GArray * frames = backtrace->frames;
  JsonBuilder * b;
  guint i;
  JsonNode * root;

  if (backtrace->frames_json != NULL)
    return backtrace->frames_json;

  b = json_builder_new_immutable ();

  json_builder_begin_array (b);

  for (i = 0; i != frames->len; i++)
  {
    ArtStackFrame * frame = &g_array_index (frames, ArtStackFrame, i);
    gchar * description, * ret_type, * paren_open, * paren_close, * arg_types, * token, * method_name, * class_name;
    GString * signature;
    gchar * cursor;
    ArtMethod * translated_method;
    StdString location;
    gsize dexpc;
    const gchar * source_file;
    gint32 line_number;

    description = std_string_get_data (&frame->description);

    ret_type = strchr (description, '\\'') + 1;

    paren_open = strchr (ret_type, '(');
    paren_close = strchr (paren_open, ')');
    *paren_open = '\\0';
    *paren_close = '\\0';

    arg_types = paren_open + 1;

    token = strrchr (ret_type, '.');
    *token = '\\0';

    method_name = token + 1;

    token = strrchr (ret_type, ' ');
    *token = '\\0';

    class_name = token + 1;

    signature = g_string_sized_new (128);

    append_jni_type_name (signature, class_name, method_name - class_name - 1);
    g_string_append_c (signature, ',');
    g_string_append (signature, method_name);
    g_string_append (signature, ",(");

    if (arg_types != paren_close)
    {
      for (cursor = arg_types; cursor != NULL;)
      {
        gsize length;
        gchar * next;

        token = strstr (cursor, ", ");
        if (token != NULL)
        {
          length = token - cursor;
          next = token + 2;
        }
        else
        {
          length = paren_close - cursor;
          next = NULL;
        }

        append_jni_type_name (signature, cursor, length);

        cursor = next;
      }
    }

    g_string_append_c (signature, ')');

    append_jni_type_name (signature, ret_type, class_name - ret_type - 1);

    translated_method = translate_method (frame->method);
    dexpc = (translated_method == frame->method) ? frame->dexpc : 0;

    get_class_location (&location, GSIZE_TO_POINTER (translated_method->declaring_class));

    translate_location (translated_method, dexpc, &source_file, &line_number);

    json_builder_begin_object (b);

    json_builder_set_member_name (b, "signature");
    json_builder_add_string_value (b, signature->str);

    json_builder_set_member_name (b, "origin");
    json_builder_add_string_value (b, std_string_get_data (&location));

    json_builder_set_member_name (b, "className");
    json_builder_add_string_value (b, class_name);

    json_builder_set_member_name (b, "methodName");
    json_builder_add_string_value (b, method_name);

    json_builder_set_member_name (b, "methodFlags");
    json_builder_add_int_value (b, translated_method->access_flags);

    json_builder_set_member_name (b, "fileName");
    json_builder_add_string_value (b, source_file);

    json_builder_set_member_name (b, "lineNumber");
    json_builder_add_int_value (b, line_number);

    json_builder_end_object (b);

    std_string_destroy (&location);
    g_string_free (signature, TRUE);
  }

  json_builder_end_array (b);

  root = json_builder_get_root (b);
  backtrace->frames_json = json_to_string (root, FALSE);
  json_node_unref (root);

  return backtrace->frames_json;
}

static void
append_jni_type_name (GString * s,
                      const gchar * name,
                      gsize length)
{
  gchar shorty = '\\0';
  gsize i;

  switch (name[0])
  {
    case 'b':
      if (strncmp (name, "boolean", length) == 0)
        shorty = 'Z';
      else if (strncmp (name, "byte", length) == 0)
        shorty = 'B';
      break;
    case 'c':
      if (strncmp (name, "char", length) == 0)
        shorty = 'C';
      break;
    case 'd':
      if (strncmp (name, "double", length) == 0)
        shorty = 'D';
      break;
    case 'f':
      if (strncmp (name, "float", length) == 0)
        shorty = 'F';
      break;
    case 'i':
      if (strncmp (name, "int", length) == 0)
        shorty = 'I';
      break;
    case 'l':
      if (strncmp (name, "long", length) == 0)
        shorty = 'J';
      break;
    case 's':
      if (strncmp (name, "short", length) == 0)
        shorty = 'S';
      break;
    case 'v':
      if (strncmp (name, "void", length) == 0)
        shorty = 'V';
      break;
  }

  if (shorty != '\\0')
  {
    g_string_append_c (s, shorty);

    return;
  }

  if (length > 2 && name[length - 2] == '[' && name[length - 1] == ']')
  {
    g_string_append_c (s, '[');
    append_jni_type_name (s, name, length - 2);

    return;
  }

  g_string_append_c (s, 'L');

  for (i = 0; i != length; i++)
  {
    gchar ch = name[i];
    if (ch != '.')
      g_string_append_c (s, ch);
    else
      g_string_append_c (s, '/');
  }

  g_string_append_c (s, ';');
}

static void
std_string_destroy (StdString * str)
{
  bool is_large = (str->flags & 1) != 0;
  if (is_large)
    cxx_delete (str->large.data);
}

static gchar *
std_string_get_data (StdString * str)
{
  bool is_large = (str->flags & 1) != 0;
  return is_large ? str->large.data : str->tiny.data;
}
`, {
    current_backtrace: Memory.alloc(Process.pointerSize),
    perform_art_thread_state_transition: performImpl,
    art_thread_get_long_jump_context: api['art::Thread::GetLongJumpContext'],
    art_stack_visitor_init: api['art::StackVisitor::StackVisitor'],
    art_stack_visitor_walk_stack: api['art::StackVisitor::WalkStack'],
    art_stack_visitor_get_method: api['art::StackVisitor::GetMethod'],
    art_stack_visitor_describe_location: api['art::StackVisitor::DescribeLocation'],
    translate_method: artController.replacedMethods.translate,
    translate_location: api['art::Monitor::TranslateLocation'],
    get_class_location: api['art::mirror::Class::GetLocation'],
    cxx_delete: api.$delete,
    strtoul: Module.getExportByName('libc.so', 'strtoul')
  });

  const _create = new NativeFunction(cm._create, 'pointer', ['pointer', 'uint'], nativeFunctionOptions);
  const _destroy = new NativeFunction(cm._destroy, 'void', ['pointer'], nativeFunctionOptions);

  const fastOptions = { exceptions: 'propagate', scheduling: 'exclusive' };
  const _getId = new NativeFunction(cm._get_id, 'pointer', ['pointer'], fastOptions);
  const _getFrames = new NativeFunction(cm._get_frames, 'pointer', ['pointer'], fastOptions);

  const performThreadStateTransition = makeArtThreadStateTransitionImpl(vm, env, cm._on_thread_state_transition_complete);
  cm._performData = performThreadStateTransition;
  performImpl.writePointer(performThreadStateTransition);

  cm.backtrace = (env, limit) => {
    const handle = _create(env, limit);
    const bt = new Backtrace(handle);
    Script.bindWeak(bt, destroy.bind(null, handle));
    return bt;
  };

  function destroy (handle) {
    _destroy(handle);
  }

  cm.getId = handle => {
    return _getId(handle).readUtf8String();
  };

  cm.getFrames = handle => {
    return JSON.parse(_getFrames(handle).readUtf8String());
  };

  return cm;
}

class Backtrace {
  constructor (handle) {
    this.handle = handle;
  }

  get id () {
    return backtraceModule.getId(this.handle);
  }

  get frames () {
    return backtraceModule.getFrames(this.handle);
  }
}

function revertGlobalPatches () {
  patchedClasses.forEach(entry => {
    entry.vtablePtr.writePointer(entry.vtable);
    entry.vtableCountPtr.writeS32(entry.vtableCount);
  });
  patchedClasses.clear();

  for (const interceptor of artQuickInterceptors.splice(0)) {
    interceptor.deactivate();
  }

  for (const hook of inlineHooks.splice(0)) {
    hook.revert();
  }
}

function unwrapMethodId (methodId) {
  const api = getApi();

  const runtimeOffset = getArtRuntimeSpec(api).offset;
  const jniIdManagerOffset = runtimeOffset.jniIdManager;
  const jniIdsIndirectionOffset = runtimeOffset.jniIdsIndirection;

  if (jniIdManagerOffset !== null && jniIdsIndirectionOffset !== null) {
    const runtime = api.artRuntime;

    const jniIdsIndirection = runtime.add(jniIdsIndirectionOffset).readInt();

    if (jniIdsIndirection !== kPointer) {
      const jniIdManager = runtime.add(jniIdManagerOffset).readPointer();
      return api['art::jni::JniIdManager::DecodeMethodId'](jniIdManager, methodId);
    }
  }

  return methodId;
}

const artQuickCodeReplacementTrampolineWriters = {
  ia32: writeArtQuickCodeReplacementTrampolineIA32,
  x64: writeArtQuickCodeReplacementTrampolineX64,
  arm: writeArtQuickCodeReplacementTrampolineArm,
  arm64: writeArtQuickCodeReplacementTrampolineArm64
};

function writeArtQuickCodeReplacementTrampolineIA32 (trampoline, target, redirectSize, constraints, vm) {
  const threadOffsets = getArtThreadSpec(vm).offset;
  const artMethodOffsets = getArtMethodSpec(vm).offset;

  let offset;
  Memory.patchCode(trampoline, 128, code => {
    const writer = new X86Writer(code, { pc: trampoline });
    const relocator = new X86Relocator(target, writer);

    const fxsave = [0x0f, 0xae, 0x04, 0x24]; /* fxsave [esp] */
    const fxrstor = [0x0f, 0xae, 0x0c, 0x24]; /* fxrstor [esp] */

    // Save core args & callee-saves.
    writer.putPushax();

    writer.putMovRegReg('ebp', 'esp');

    // Save FPRs + alignment padding.
    writer.putAndRegU32('esp', 0xfffffff0);
    writer.putSubRegImm('esp', 512);
    writer.putBytes(fxsave);

    writer.putMovRegFsU32Ptr('ebx', threadOffsets.self);
    writer.putCallAddressWithAlignedArguments(artController.replacedMethods.findReplacementFromQuickCode, ['eax', 'ebx']);

    writer.putTestRegReg('eax', 'eax');
    writer.putJccShortLabel('je', 'restore_registers', 'no-hint');

    // Set value of eax in the current frame.
    writer.putMovRegOffsetPtrReg('ebp', 7 * 4, 'eax');

    writer.putLabel('restore_registers');

    // Restore FPRs.
    writer.putBytes(fxrstor);

    writer.putMovRegReg('esp', 'ebp');

    // Restore core args & callee-saves.
    writer.putPopax();

    writer.putJccShortLabel('jne', 'invoke_replacement', 'no-hint');

    do {
      offset = relocator.readOne();
    } while (offset < redirectSize && !relocator.eoi);

    relocator.writeAll();

    if (!relocator.eoi) {
      writer.putJmpAddress(target.add(offset));
    }

    writer.putLabel('invoke_replacement');

    writer.putJmpRegOffsetPtr('eax', artMethodOffsets.quickCode);

    writer.flush();
  });

  return offset;
}

function writeArtQuickCodeReplacementTrampolineX64 (trampoline, target, redirectSize, constraints, vm) {
  const threadOffsets = getArtThreadSpec(vm).offset;
  const artMethodOffsets = getArtMethodSpec(vm).offset;

  let offset;
  Memory.patchCode(trampoline, 256, code => {
    const writer = new X86Writer(code, { pc: trampoline });
    const relocator = new X86Relocator(target, writer);

    const fxsave = [0x0f, 0xae, 0x04, 0x24]; /* fxsave [rsp] */
    const fxrstor = [0x0f, 0xae, 0x0c, 0x24]; /* fxrstor [rsp] */

    // Save core args & callee-saves.
    writer.putPushax();

    writer.putMovRegReg('rbp', 'rsp');

    // Save FPRs + alignment padding.
    writer.putAndRegU32('rsp', 0xfffffff0);
    writer.putSubRegImm('rsp', 512);
    writer.putBytes(fxsave);

    writer.putMovRegGsU32Ptr('rbx', threadOffsets.self);
    writer.putCallAddressWithAlignedArguments(artController.replacedMethods.findReplacementFromQuickCode, ['rdi', 'rbx']);

    writer.putTestRegReg('rax', 'rax');
    writer.putJccShortLabel('je', 'restore_registers', 'no-hint');

    // Set value of rdi in the current frame.
    writer.putMovRegOffsetPtrReg('rbp', 8 * 8, 'rax');

    writer.putLabel('restore_registers');

    // Restore FPRs.
    writer.putBytes(fxrstor);

    writer.putMovRegReg('rsp', 'rbp');

    // Restore core args & callee-saves.
    writer.putPopax();

    writer.putJccShortLabel('jne', 'invoke_replacement', 'no-hint');

    do {
      offset = relocator.readOne();
    } while (offset < redirectSize && !relocator.eoi);

    relocator.writeAll();

    if (!relocator.eoi) {
      writer.putJmpAddress(target.add(offset));
    }

    writer.putLabel('invoke_replacement');

    writer.putJmpRegOffsetPtr('rdi', artMethodOffsets.quickCode);

    writer.flush();
  });

  return offset;
}

function writeArtQuickCodeReplacementTrampolineArm (trampoline, target, redirectSize, constraints, vm) {
  const artMethodOffsets = getArtMethodSpec(vm).offset;

  const targetAddress = target.and(THUMB_BIT_REMOVAL_MASK);

  let offset;
  Memory.patchCode(trampoline, 128, code => {
    const writer = new ThumbWriter(code, { pc: trampoline });
    const relocator = new ThumbRelocator(targetAddress, writer);

    const vpushFpRegs = [0x2d, 0xed, 0x10, 0x0a]; /* vpush {s0-s15} */
    const vpopFpRegs = [0xbd, 0xec, 0x10, 0x0a]; /* vpop {s0-s15} */

    // Save core args, callee-saves, LR.
    writer.putPushRegs([
      'r1',
      'r2',
      'r3',
      'r5',
      'r6',
      'r7',
      'r8',
      'r10',
      'r11',
      'lr'
    ]);

    // Save FPRs.
    writer.putBytes(vpushFpRegs);

    // Save ArtMethod* + alignment padding.
    writer.putSubRegRegImm('sp', 'sp', 8);
    writer.putStrRegRegOffset('r0', 'sp', 0);

    writer.putCallAddressWithArguments(artController.replacedMethods.findReplacementFromQuickCode, ['r0', 'r9']);

    writer.putCmpRegImm('r0', 0);
    writer.putBCondLabel('eq', 'restore_registers');

    // Set value of r0 in the current frame.
    writer.putStrRegRegOffset('r0', 'sp', 0);

    writer.putLabel('restore_registers');

    // Restore ArtMethod*
    writer.putLdrRegRegOffset('r0', 'sp', 0);
    writer.putAddRegRegImm('sp', 'sp', 8);

    // Restore FPRs.
    writer.putBytes(vpopFpRegs);

    // Restore LR, callee-saves & core args.
    writer.putPopRegs([
      'lr',
      'r11',
      'r10',
      'r8',
      'r7',
      'r6',
      'r5',
      'r3',
      'r2',
      'r1'
    ]);

    writer.putBCondLabel('ne', 'invoke_replacement');

    do {
      offset = relocator.readOne();
    } while (offset < redirectSize && !relocator.eoi);

    relocator.writeAll();

    if (!relocator.eoi) {
      writer.putLdrRegAddress('pc', target.add(offset));
    }

    writer.putLabel('invoke_replacement');

    writer.putLdrRegRegOffset('pc', 'r0', artMethodOffsets.quickCode);

    writer.flush();
  });

  return offset;
}

function writeArtQuickCodeReplacementTrampolineArm64 (trampoline, target, redirectSize, { availableScratchRegs }, vm) {
  const artMethodOffsets = getArtMethodSpec(vm).offset;

  let offset;
  Memory.patchCode(trampoline, 256, code => {
    const writer = new Arm64Writer(code, { pc: trampoline });
    const relocator = new Arm64Relocator(target, writer);

    // Save FPRs.
    writer.putPushRegReg('d0', 'd1');
    writer.putPushRegReg('d2', 'd3');
    writer.putPushRegReg('d4', 'd5');
    writer.putPushRegReg('d6', 'd7');

    // Save core args, callee-saves & LR.
    writer.putPushRegReg('x1', 'x2');
    writer.putPushRegReg('x3', 'x4');
    writer.putPushRegReg('x5', 'x6');
    writer.putPushRegReg('x7', 'x20');
    writer.putPushRegReg('x21', 'x22');
    writer.putPushRegReg('x23', 'x24');
    writer.putPushRegReg('x25', 'x26');
    writer.putPushRegReg('x27', 'x28');
    writer.putPushRegReg('x29', 'lr');

    // Save ArtMethod* + alignment padding.
    writer.putSubRegRegImm('sp', 'sp', 16);
    writer.putStrRegRegOffset('x0', 'sp', 0);

    writer.putCallAddressWithArguments(artController.replacedMethods.findReplacementFromQuickCode, ['x0', 'x19']);

    writer.putCmpRegReg('x0', 'xzr');
    writer.putBCondLabel('eq', 'restore_registers');

    // Set value of x0 in the current frame.
    writer.putStrRegRegOffset('x0', 'sp', 0);

    writer.putLabel('restore_registers');

    // Restore ArtMethod*
    writer.putLdrRegRegOffset('x0', 'sp', 0);
    writer.putAddRegRegImm('sp', 'sp', 16);

    // Restore core args, callee-saves & LR.
    writer.putPopRegReg('x29', 'lr');
    writer.putPopRegReg('x27', 'x28');
    writer.putPopRegReg('x25', 'x26');
    writer.putPopRegReg('x23', 'x24');
    writer.putPopRegReg('x21', 'x22');
    writer.putPopRegReg('x7', 'x20');
    writer.putPopRegReg('x5', 'x6');
    writer.putPopRegReg('x3', 'x4');
    writer.putPopRegReg('x1', 'x2');

    // Restore FPRs.
    writer.putPopRegReg('d6', 'd7');
    writer.putPopRegReg('d4', 'd5');
    writer.putPopRegReg('d2', 'd3');
    writer.putPopRegReg('d0', 'd1');

    writer.putBCondLabel('ne', 'invoke_replacement');

    do {
      offset = relocator.readOne();
    } while (offset < redirectSize && !relocator.eoi);

    relocator.writeAll();

    if (!relocator.eoi) {
      const scratchReg = Array.from(availableScratchRegs)[0];
      writer.putLdrRegAddress(scratchReg, target.add(offset));
      writer.putBrReg(scratchReg);
    }

    writer.putLabel('invoke_replacement');

    writer.putLdrRegRegOffset('x16', 'x0', artMethodOffsets.quickCode);
    writer.putBrReg('x16');

    writer.flush();
  });

  return offset;
}

const artQuickCodePrologueWriters = {
  ia32: writeArtQuickCodePrologueX86,
  x64: writeArtQuickCodePrologueX86,
  arm: writeArtQuickCodePrologueArm,
  arm64: writeArtQuickCodePrologueArm64
};

function writeArtQuickCodePrologueX86 (target, trampoline, redirectSize) {
  Memory.patchCode(target, 16, code => {
    const writer = new X86Writer(code, { pc: target });

    writer.putJmpAddress(trampoline);
    writer.flush();
  });
}

function writeArtQuickCodePrologueArm (target, trampoline, redirectSize) {
  const targetAddress = target.and(THUMB_BIT_REMOVAL_MASK);

  Memory.patchCode(targetAddress, 16, code => {
    const writer = new ThumbWriter(code, { pc: targetAddress });

    writer.putLdrRegAddress('pc', trampoline.or(1));
    writer.flush();
  });
}

function writeArtQuickCodePrologueArm64 (target, trampoline, redirectSize) {
  Memory.patchCode(target, 16, code => {
    const writer = new Arm64Writer(code, { pc: target });

    if (redirectSize === 16) {
      writer.putLdrRegAddress('x16', trampoline);
    } else {
      writer.putAdrpRegAddress('x16', trampoline);
    }

    writer.putBrReg('x16');

    writer.flush();
  });
}

const artQuickCodeHookRedirectSize = {
  ia32: 5,
  x64: 16,
  arm: 8,
  arm64: 16
};

class ArtQuickCodeInterceptor {
  constructor (quickCode) {
    this.quickCode = quickCode;
    this.quickCodeAddress = (Process.arch === 'arm')
      ? quickCode.and(THUMB_BIT_REMOVAL_MASK)
      : quickCode;

    this.redirectSize = 0;
    this.trampoline = null;
    this.overwrittenPrologue = null;
    this.overwrittenPrologueLength = 0;
  }

  _canRelocateCode (relocationSize, constraints) {
    const Writer = thunkWriters[Process.arch];
    const Relocator = thunkRelocators[Process.arch];

    const { quickCodeAddress } = this;

    const writer = new Writer(quickCodeAddress);
    const relocator = new Relocator(quickCodeAddress, writer);

    let offset;
    if (Process.arch === 'arm64') {
      let availableScratchRegs = new Set(['x16', 'x17']);

      do {
        const nextOffset = relocator.readOne();

        const nextScratchRegs = new Set(availableScratchRegs);
        const { read, written } = relocator.input.regsAccessed;
        for (const regs of [read, written]) {
          for (const reg of regs) {
            let name;
            if (reg.startsWith('w')) {
              name = 'x' + reg.substring(1);
            } else {
              name = reg;
            }
            nextScratchRegs.delete(name);
          }
        }
        if (nextScratchRegs.size === 0) {
          break;
        }

        offset = nextOffset;
        availableScratchRegs = nextScratchRegs;
      } while (offset < relocationSize && !relocator.eoi);

      constraints.availableScratchRegs = availableScratchRegs;
    } else {
      do {
        offset = relocator.readOne();
      } while (offset < relocationSize && !relocator.eoi);
    }

    return offset >= relocationSize;
  }

  _allocateTrampoline () {
    if (trampolineAllocator === null) {
      const trampolineSize = (pointerSize === 4) ? 128 : 256;
      trampolineAllocator = makeCodeAllocator(trampolineSize);
    }

    const maxRedirectSize = artQuickCodeHookRedirectSize[Process.arch];

    let redirectSize, spec;
    let alignment = 1;
    const constraints = {};
    if (pointerSize === 4 || this._canRelocateCode(maxRedirectSize, constraints)) {
      redirectSize = maxRedirectSize;

      spec = {};
    } else {
      let maxDistance;
      if (Process.arch === 'x64') {
        redirectSize = 5;
        maxDistance = X86_JMP_MAX_DISTANCE;
      } else if (Process.arch === 'arm64') {
        redirectSize = 8;
        maxDistance = ARM64_ADRP_MAX_DISTANCE;
        alignment = 4096;
      }

      spec = { near: this.quickCodeAddress, maxDistance };
    }

    this.redirectSize = redirectSize;
    this.trampoline = trampolineAllocator.allocateSlice(spec, alignment);

    return constraints;
  }

  _destroyTrampoline () {
    trampolineAllocator.freeSlice(this.trampoline);
  }

  activate (vm) {
    const constraints = this._allocateTrampoline();

    const { trampoline, quickCode, redirectSize } = this;

    const writeTrampoline = artQuickCodeReplacementTrampolineWriters[Process.arch];
    const prologueLength = writeTrampoline(trampoline, quickCode, redirectSize, constraints, vm);
    this.overwrittenPrologueLength = prologueLength;

    this.overwrittenPrologue = Memory.dup(this.quickCodeAddress, prologueLength);

    const writePrologue = artQuickCodePrologueWriters[Process.arch];
    writePrologue(quickCode, trampoline, redirectSize);
  }

  deactivate () {
    const { quickCodeAddress, overwrittenPrologueLength: prologueLength } = this;

    const Writer = thunkWriters[Process.arch];
    Memory.patchCode(quickCodeAddress, prologueLength, code => {
      const writer = new Writer(code, { pc: quickCodeAddress });

      const { overwrittenPrologue } = this;

      writer.putBytes(overwrittenPrologue.readByteArray(prologueLength));
      writer.flush();
    });

    this._destroyTrampoline();
  }
}

function isArtQuickEntrypoint (address) {
  const api = getApi();

  const { module: m, artClassLinker } = api;

  return address.equals(artClassLinker.quickGenericJniTrampoline) ||
      address.equals(artClassLinker.quickToInterpreterBridgeTrampoline) ||
      address.equals(artClassLinker.quickResolutionTrampoline) ||
      address.equals(artClassLinker.quickImtConflictTrampoline) ||
      (address.compare(m.base) >= 0 && address.compare(m.base.add(m.size)) < 0);
}

class ArtMethodMangler {
  constructor (opaqueMethodId) {
    const methodId = unwrapMethodId(opaqueMethodId);

    this.methodId = methodId;
    this.originalMethod = null;
    this.hookedMethodId = methodId;
    this.replacementMethodId = null;

    this.interceptor = null;
  }

  replace (impl, isInstanceMethod, argTypes, vm, api) {
    const { kAccCompileDontBother, artNterpEntryPoint } = api;

    this.originalMethod = fetchArtMethod(this.methodId, vm);

    const originalFlags = this.originalMethod.accessFlags;

    if ((originalFlags & kAccXposedHookedMethod) !== 0 && xposedIsSupported()) {
      const hookInfo = this.originalMethod.jniCode;
      this.hookedMethodId = hookInfo.add(2 * pointerSize).readPointer();
      this.originalMethod = fetchArtMethod(this.hookedMethodId, vm);
    }

    const { hookedMethodId } = this;

    const replacementMethodId = cloneArtMethod(hookedMethodId, vm);
    this.replacementMethodId = replacementMethodId;

    patchArtMethod(replacementMethodId, {
      jniCode: impl,
      accessFlags: ((originalFlags & ~(kAccCriticalNative | kAccFastNative | kAccNterpEntryPointFastPathFlag)) | kAccNative | kAccCompileDontBother) >>> 0,
      quickCode: api.artClassLinker.quickGenericJniTrampoline,
      interpreterCode: api.artInterpreterToCompiledCodeBridge
    }, vm);

    // Remove kAccFastInterpreterToInterpreterInvoke and kAccSkipAccessChecks to disable use_fast_path
    // in interpreter_common.h
    let hookedMethodRemovedFlags = kAccFastInterpreterToInterpreterInvoke | kAccSingleImplementation | kAccNterpEntryPointFastPathFlag;
    if ((originalFlags & kAccNative) === 0) {
      hookedMethodRemovedFlags |= kAccSkipAccessChecks;
    }

    patchArtMethod(hookedMethodId, {
      accessFlags: ((originalFlags & ~(hookedMethodRemovedFlags)) | kAccCompileDontBother) >>> 0
    }, vm);

    const quickCode = this.originalMethod.quickCode;

    // Replace Nterp quick entrypoints with art_quick_to_interpreter_bridge to force stepping out
    // of ART's next-generation interpreter and use the quick stub instead.
    if (artNterpEntryPoint !== undefined && quickCode.equals(artNterpEntryPoint)) {
      patchArtMethod(hookedMethodId, {
        quickCode: api.artQuickToInterpreterBridge
      }, vm);
    }

    if (!isArtQuickEntrypoint(quickCode)) {
      const interceptor = new ArtQuickCodeInterceptor(quickCode);
      interceptor.activate(vm);

      this.interceptor = interceptor;
    }

    artController.replacedMethods.set(hookedMethodId, replacementMethodId);

    notifyArtMethodHooked(hookedMethodId, vm);
  }

  revert (vm) {
    const { hookedMethodId, interceptor } = this;

    patchArtMethod(hookedMethodId, this.originalMethod, vm);

    artController.replacedMethods.delete(hookedMethodId);

    if (interceptor !== null) {
      interceptor.deactivate();

      this.interceptor = null;
    }
  }

  resolveTarget (wrapper, isInstanceMethod, env, api) {
    return this.hookedMethodId;
  }
}

function xposedIsSupported () {
  return getAndroidApiLevel() < 28;
}

function fetchArtMethod (methodId, vm) {
  const artMethodSpec = getArtMethodSpec(vm);
  const artMethodOffset = artMethodSpec.offset;
  return (['jniCode', 'accessFlags', 'quickCode', 'interpreterCode']
    .reduce((original, name) => {
      const offset = artMethodOffset[name];
      if (offset === undefined) {
        return original;
      }
      const address = methodId.add(offset);
      const read = (name === 'accessFlags') ? readU32 : readPointer;
      original[name] = read.call(address);
      return original;
    }, {}));
}

function patchArtMethod (methodId, patches, vm) {
  const artMethodSpec = getArtMethodSpec(vm);
  const artMethodOffset = artMethodSpec.offset;
  Object.keys(patches).forEach(name => {
    const offset = artMethodOffset[name];
    if (offset === undefined) {
      return;
    }
    const address = methodId.add(offset);
    const write = (name === 'accessFlags') ? writeU32 : writePointer;
    write.call(address, patches[name]);
  });
}

class DalvikMethodMangler {
  constructor (methodId) {
    this.methodId = methodId;
    this.originalMethod = null;
  }

  replace (impl, isInstanceMethod, argTypes, vm, api) {
    const { methodId } = this;

    this.originalMethod = Memory.dup(methodId, DVM_METHOD_SIZE);

    let argsSize = argTypes.reduce((acc, t) => (acc + t.size), 0);
    if (isInstanceMethod) {
      argsSize++;
    }

    /*
     * make method native (with kAccNative)
     * insSize and registersSize are set to arguments size
     */
    const accessFlags = (methodId.add(DVM_METHOD_OFFSET_ACCESS_FLAGS).readU32() | kAccNative) >>> 0;
    const registersSize = argsSize;
    const outsSize = 0;
    const insSize = argsSize;

    methodId.add(DVM_METHOD_OFFSET_ACCESS_FLAGS).writeU32(accessFlags);
    methodId.add(DVM_METHOD_OFFSET_REGISTERS_SIZE).writeU16(registersSize);
    methodId.add(DVM_METHOD_OFFSET_OUTS_SIZE).writeU16(outsSize);
    methodId.add(DVM_METHOD_OFFSET_INS_SIZE).writeU16(insSize);
    methodId.add(DVM_METHOD_OFFSET_JNI_ARG_INFO).writeU32(computeDalvikJniArgInfo(methodId));

    api.dvmUseJNIBridge(methodId, impl);
  }

  revert (vm) {
    Memory.copy(this.methodId, this.originalMethod, DVM_METHOD_SIZE);
  }

  resolveTarget (wrapper, isInstanceMethod, env, api) {
    const thread = env.handle.add(DVM_JNI_ENV_OFFSET_SELF).readPointer();

    let objectPtr;
    if (isInstanceMethod) {
      objectPtr = api.dvmDecodeIndirectRef(thread, wrapper.$h);
    } else {
      const h = wrapper.$borrowClassHandle(env);
      objectPtr = api.dvmDecodeIndirectRef(thread, h.value);
      h.unref(env);
    }

    let classObject;
    if (isInstanceMethod) {
      classObject = objectPtr.add(DVM_OBJECT_OFFSET_CLAZZ).readPointer();
    } else {
      classObject = objectPtr;
    }

    const classKey = classObject.toString(16);
    let entry = patchedClasses.get(classKey);
    if (entry === undefined) {
      const vtablePtr = classObject.add(DVM_CLASS_OBJECT_OFFSET_VTABLE);
      const vtableCountPtr = classObject.add(DVM_CLASS_OBJECT_OFFSET_VTABLE_COUNT);
      const vtable = vtablePtr.readPointer();
      const vtableCount = vtableCountPtr.readS32();

      const vtableSize = vtableCount * pointerSize;
      const shadowVtable = Memory.alloc(2 * vtableSize);
      Memory.copy(shadowVtable, vtable, vtableSize);
      vtablePtr.writePointer(shadowVtable);

      entry = {
        classObject,
        vtablePtr,
        vtableCountPtr,
        vtable,
        vtableCount,
        shadowVtable,
        shadowVtableCount: vtableCount,
        targetMethods: new Map()
      };
      patchedClasses.set(classKey, entry);
    }

    const methodKey = this.methodId.toString(16);
    let targetMethod = entry.targetMethods.get(methodKey);
    if (targetMethod === undefined) {
      targetMethod = Memory.dup(this.originalMethod, DVM_METHOD_SIZE);

      const methodIndex = entry.shadowVtableCount++;
      entry.shadowVtable.add(methodIndex * pointerSize).writePointer(targetMethod);
      targetMethod.add(DVM_METHOD_OFFSET_METHOD_INDEX).writeU16(methodIndex);
      entry.vtableCountPtr.writeS32(entry.shadowVtableCount);

      entry.targetMethods.set(methodKey, targetMethod);
    }

    return targetMethod;
  }
}

function computeDalvikJniArgInfo (methodId) {
  if (Process.arch !== 'ia32') {
    return DALVIK_JNI_NO_ARG_INFO;
  }

  // For the x86 ABI, valid hints should always be generated.
  const shorty = methodId.add(DVM_METHOD_OFFSET_SHORTY).readPointer().readCString();
  if (shorty === null || shorty.length === 0 || shorty.length > 0xffff) {
    return DALVIK_JNI_NO_ARG_INFO;
  }

  let returnType;
  switch (shorty[0]) {
    case 'V':
      returnType = DALVIK_JNI_RETURN_VOID;
      break;
    case 'F':
      returnType = DALVIK_JNI_RETURN_FLOAT;
      break;
    case 'D':
      returnType = DALVIK_JNI_RETURN_DOUBLE;
      break;
    case 'J':
      returnType = DALVIK_JNI_RETURN_S8;
      break;
    case 'Z':
    case 'B':
      returnType = DALVIK_JNI_RETURN_S1;
      break;
    case 'C':
      returnType = DALVIK_JNI_RETURN_U2;
      break;
    case 'S':
      returnType = DALVIK_JNI_RETURN_S2;
      break;
    default:
      returnType = DALVIK_JNI_RETURN_S4;
      break;
  }

  let hints = 0;
  for (let i = shorty.length - 1; i > 0; i--) {
    const ch = shorty[i];
    hints += (ch === 'D' || ch === 'J') ? 2 : 1;
  }

  return (returnType << DALVIK_JNI_RETURN_SHIFT) | hints;
}

function cloneArtMethod (method, vm) {
  const api = getApi();

  if (getAndroidApiLevel() < 23) {
    const thread = api['art::Thread::CurrentFromGdb']();
    return api['art::mirror::Object::Clone'](method, thread);
  }

  return Memory.dup(method, getArtMethodSpec(vm).size);
}

function deoptimizeMethod (vm, env, method) {
  requestDeoptimization(vm, env, kSelectiveDeoptimization, method);
}

function deoptimizeEverything (vm, env) {
  requestDeoptimization(vm, env, kFullDeoptimization);
}

function deoptimizeBootImage (vm, env) {
  const api = getApi();

  if (getAndroidApiLevel() < 26) {
    throw new Error('This API is only available on Android >= 8.0');
  }

  withRunnableArtThread(vm, env, thread => {
    api['art::Runtime::DeoptimizeBootImage'](api.artRuntime);
  });
}

function requestDeoptimization (vm, env, kind, method) {
  const api = getApi();

  if (getAndroidApiLevel() < 24) {
    throw new Error('This API is only available on Android >= 7.0');
  }

  withRunnableArtThread(vm, env, thread => {
    if (getAndroidApiLevel() < 30) {
      if (!api.isJdwpStarted()) {
        const session = startJdwp(api);
        jdwpSessions.push(session);
      }

      if (!api.isDebuggerActive()) {
        api['art::Dbg::GoActive']();
      }

      const request = Memory.alloc(8 + pointerSize);
      request.writeU32(kind);

      switch (kind) {
        case kFullDeoptimization:
          break;
        case kSelectiveDeoptimization:
          request.add(8).writePointer(method);
          break;
        default:
          throw new Error('Unsupported deoptimization kind');
      }

      api['art::Dbg::RequestDeoptimization'](request);

      api['art::Dbg::ManageDeoptimization']();
    } else {
      const instrumentation = api.artInstrumentation;
      if (instrumentation === null) {
        throw new Error('Unable to find Instrumentation class in ART; please file a bug');
      }

      const enableDeopt = api['art::Instrumentation::EnableDeoptimization'];
      if (enableDeopt !== undefined) {
        const deoptimizationEnabled = !!instrumentation.add(getArtInstrumentationSpec().offset.deoptimizationEnabled).readU8();
        if (!deoptimizationEnabled) {
          enableDeopt(instrumentation);
        }
      }

      switch (kind) {
        case kFullDeoptimization:
          api['art::Instrumentation::DeoptimizeEverything'](instrumentation, Memory.allocUtf8String('frida'));
          break;
        case kSelectiveDeoptimization:
          api['art::Instrumentation::Deoptimize'](instrumentation, method);
          break;
        default:
          throw new Error('Unsupported deoptimization kind');
      }
    }
  });
}

class JdwpSession {
  constructor () {
    /*
     * We partially stub out the ADB JDWP transport to ensure we always
     * succeed in starting JDWP. Failure will crash the process.
     */
    const acceptImpl = Module.getExportByName('libart.so', '_ZN3art4JDWP12JdwpAdbState6AcceptEv');
    const receiveClientFdImpl = Module.getExportByName('libart.so', '_ZN3art4JDWP12JdwpAdbState15ReceiveClientFdEv');

    const controlPair = makeSocketPair();
    const clientPair = makeSocketPair();

    this._controlFd = controlPair[0];
    this._clientFd = clientPair[0];

    let acceptListener = null;
    acceptListener = Interceptor.attach(acceptImpl, function (args) {
      const state = args[0];

      const controlSockPtr = Memory.scanSync(state.add(8252), 256, '00 ff ff ff ff 00')[0].address.add(1);

      /*
       * This will make JdwpAdbState::Accept() skip the control socket() and connect(),
       * and skip right to calling ReceiveClientFd(), replaced below.
       */
      controlSockPtr.writeS32(controlPair[1]);

      acceptListener.detach();
    });

    Interceptor.replace(receiveClientFdImpl, new NativeCallback(function (state) {
      Interceptor.revert(receiveClientFdImpl);

      return clientPair[1];
    }, 'int', ['pointer']));

    Interceptor.flush();

    this._handshakeRequest = this._performHandshake();
  }

  async _performHandshake () {
    const input = new UnixInputStream(this._clientFd, { autoClose: false });
    const output = new UnixOutputStream(this._clientFd, { autoClose: false });

    const handshakePacket = [0x4a, 0x44, 0x57, 0x50, 0x2d, 0x48, 0x61, 0x6e, 0x64, 0x73, 0x68, 0x61, 0x6b, 0x65];
    try {
      await output.writeAll(handshakePacket);
      await input.readAll(handshakePacket.length);
    } catch (e) {
    }
  }
}

function startJdwp (api) {
  const session = new JdwpSession();

  api['art::Dbg::SetJdwpAllowed'](1);

  const options = makeJdwpOptions();
  api['art::Dbg::ConfigureJdwp'](options);

  const startDebugger = api['art::InternalDebuggerControlCallback::StartDebugger'];
  if (startDebugger !== undefined) {
    startDebugger(NULL);
  } else {
    api['art::Dbg::StartJdwp']();
  }

  return session;
}

function makeJdwpOptions () {
  const kJdwpTransportAndroidAdb = getAndroidApiLevel() < 28 ? 2 : 3;
  const kJdwpPortFirstAvailable = 0;

  const transport = kJdwpTransportAndroidAdb;
  const server = true;
  const suspend = false;
  const port = kJdwpPortFirstAvailable;

  const size = 8 + STD_STRING_SIZE + 2;
  const result = Memory.alloc(size);
  result
    .writeU32(transport).add(4)
    .writeU8(server ? 1 : 0).add(1)
    .writeU8(suspend ? 1 : 0).add(1)
    .add(STD_STRING_SIZE) // We leave `host` zeroed, i.e. empty string
    .writeU16(port);
  return result;
}

function makeSocketPair () {
  if (socketpair === null) {
    socketpair = new NativeFunction(
      Module.getExportByName('libc.so', 'socketpair'),
      'int',
      ['int', 'int', 'int', 'pointer']);
  }

  const buf = Memory.alloc(8);
  if (socketpair(AF_UNIX, SOCK_STREAM, 0, buf) === -1) {
    throw new Error('Unable to create socketpair for JDWP');
  }

  return [
    buf.readS32(),
    buf.add(4).readS32()
  ];
}

function makeAddGlobalRefFallbackForAndroid5 (api) {
  const offset = getArtVMSpec().offset;
  const lock = api.vm.add(offset.globalsLock);
  const table = api.vm.add(offset.globals);

  const add = api['art::IndirectReferenceTable::Add'];
  const acquire = api['art::ReaderWriterMutex::ExclusiveLock'];
  const release = api['art::ReaderWriterMutex::ExclusiveUnlock'];

  const IRT_FIRST_SEGMENT = 0;

  return function (vm, thread, obj) {
    acquire(lock, thread);
    try {
      return add(table, IRT_FIRST_SEGMENT, obj);
    } finally {
      release(lock, thread);
    }
  };
}

function makeDecodeGlobalFallbackForAndroid5 (api) {
  const decode = api['art::Thread::DecodeJObject'];

  return function (vm, thread, ref) {
    return decode(thread, ref);
  };
}

/*
 * In order to call internal ART APIs we need to transition our native thread's
 * art::Thread to the proper state. The ScopedObjectAccess (SOA) helper that ART
 * uses internally is what we would like to use to accomplish this goal.
 *
 * There is however a challenge. The SOA implementation is fully inlined, so
 * we cannot just allocate a chunk of memory and call its constructor and
 * destructor to get the desired setup and teardown.
 *
 * We could however precompile such code using a C++ compiler, but considering
 * how many versions of ART we would need to compile it for, multiplied by the
 * number of supported architectures, we really don't want to go there.
 *
 * Reimplementing it in JavaScript is not desirable either, as we would need
 * to keep track of even more internals prone to change as ART evolves.
 *
 * So our least terrible option is to find a really simple C++ method in ART
 * that sets up a SOA object, performs as few and distinct operations as
 * possible, and then returns. If we clone that implementation we can swap
 * out the few/distinct operations with our own.
 *
 * We can accomplish this by using Frida's relocator API, and detecting the
 * few/distinct operations happening between setup and teardown of the scope.
 * We skip those when making our copy and instead put a call to a NativeCallback
 * there. Our NativeCallback is thus able to call internal ART APIs safely.
 *
 * The ExceptionClear() implementation that's part of the JNIEnv's vtable is
 * a perfect fit, as all it does is clear one field of the art::Thread.
 * (Except on older versions where it also clears a bit more... but still
 * pretty simple.)
 *
 * However, checked JNI might be enabled, making ExceptionClear() a bit more
 * complex, and essentially a wrapper around the unchecked version.
 *
 * One last thing to note is that we also look up the address of FatalError(),
 * as ExceptionClear() typically ends with a __stack_chk_fail() noreturn call
 * that's followed by the next JNIEnv vtable method, FatalError(). We don't want
 * to recompile its code as well, so we try to detect it. There might however be
 * padding between the two functions, which we need to ignore. Ideally we would
 * know that the call is to __stack_chk_fail(), so we can stop at that point,
 * but detecting that isn't trivial.
 */

const threadStateTransitionRecompilers = {
  ia32: recompileExceptionClearForX86,
  x64: recompileExceptionClearForX86,
  arm: recompileExceptionClearForArm,
  arm64: recompileExceptionClearForArm64
};

function makeArtThreadStateTransitionImpl (vm, env, callback) {
  const envVtable = env.handle.readPointer();
  const exceptionClearImpl = envVtable.add(ENV_VTABLE_OFFSET_EXCEPTION_CLEAR).readPointer();
  const nextFuncImpl = envVtable.add(ENV_VTABLE_OFFSET_FATAL_ERROR).readPointer();

  const recompile = threadStateTransitionRecompilers[Process.arch];
  if (recompile === undefined) {
    throw new Error('Not yet implemented for ' + Process.arch);
  }

  let perform = null;

  const threadOffsets = getArtThreadSpec(vm).offset;

  const exceptionOffset = threadOffsets.exception;

  const neuteredOffsets = new Set();
  const isReportedOffset = threadOffsets.isExceptionReportedToInstrumentation;
  if (isReportedOffset !== null) {
    neuteredOffsets.add(isReportedOffset);
  }
  const throwLocationStartOffset = threadOffsets.throwLocation;
  if (throwLocationStartOffset !== null) {
    neuteredOffsets.add(throwLocationStartOffset);
    neuteredOffsets.add(throwLocationStartOffset + pointerSize);
    neuteredOffsets.add(throwLocationStartOffset + (2 * pointerSize));
  }

  const codeSize = 65536;
  const code = Memory.alloc(codeSize);
  Memory.patchCode(code, codeSize, buffer => {
    perform = recompile(buffer, code, exceptionClearImpl, nextFuncImpl, exceptionOffset, neuteredOffsets, callback);
  });

  perform._code = code;
  perform._callback = callback;

  return perform;
}

function recompileExceptionClearForX86 (buffer, pc, exceptionClearImpl, nextFuncImpl, exceptionOffset, neuteredOffsets, callback) {
  const blocks = {};
  const branchTargets = new Set();

  const pending = [exceptionClearImpl];
  while (pending.length > 0) {
    let current = pending.shift();

    const alreadyCovered = Object.values(blocks).some(({ begin, end }) => current.compare(begin) >= 0 && current.compare(end) < 0);
    if (alreadyCovered) {
      continue;
    }

    const blockAddressKey = current.toString();

    let block = {
      begin: current
    };
    let lastInsn = null;

    let reachedEndOfBlock = false;
    do {
      if (current.equals(nextFuncImpl)) {
        reachedEndOfBlock = true;
        break;
      }

      const insn = Instruction.parse(current);
      lastInsn = insn;

      const existingBlock = blocks[insn.address.toString()];
      if (existingBlock !== undefined) {
        delete blocks[existingBlock.begin.toString()];
        blocks[blockAddressKey] = existingBlock;
        existingBlock.begin = block.begin;
        block = null;
        break;
      }

      let branchTarget = null;
      switch (insn.mnemonic) {
        case 'jmp':
          branchTarget = ptr(insn.operands[0].value);
          reachedEndOfBlock = true;
          break;
        case 'je':
        case 'jg':
        case 'jle':
        case 'jne':
        case 'js':
          branchTarget = ptr(insn.operands[0].value);
          break;
        case 'ret':
          reachedEndOfBlock = true;
          break;
      }

      if (branchTarget !== null) {
        branchTargets.add(branchTarget.toString());

        pending.push(branchTarget);
        pending.sort((a, b) => a.compare(b));
      }

      current = insn.next;
    } while (!reachedEndOfBlock);

    if (block !== null) {
      block.end = lastInsn.address.add(lastInsn.size);
      blocks[blockAddressKey] = block;
    }
  }

  const blocksOrdered = Object.keys(blocks).map(key => blocks[key]);
  blocksOrdered.sort((a, b) => a.begin.compare(b.begin));

  const entryBlock = blocks[exceptionClearImpl.toString()];
  blocksOrdered.splice(blocksOrdered.indexOf(entryBlock), 1);
  blocksOrdered.unshift(entryBlock);

  const writer = new X86Writer(buffer, { pc });

  let foundCore = false;
  let threadReg = null;

  blocksOrdered.forEach(block => {
    const size = block.end.sub(block.begin).toInt32();

    const relocator = new X86Relocator(block.begin, writer);

    let offset;
    while ((offset = relocator.readOne()) !== 0) {
      const insn = relocator.input;
      const { mnemonic } = insn;

      const insnAddressId = insn.address.toString();
      if (branchTargets.has(insnAddressId)) {
        writer.putLabel(insnAddressId);
      }

      let keep = true;

      switch (mnemonic) {
        case 'jmp':
          writer.putJmpNearLabel(branchLabelFromOperand(insn.operands[0]));
          keep = false;
          break;
        case 'je':
        case 'jg':
        case 'jle':
        case 'jne':
        case 'js':
          writer.putJccNearLabel(mnemonic, branchLabelFromOperand(insn.operands[0]), 'no-hint');
          keep = false;
          break;
        /*
         * JNI::ExceptionClear(), when checked JNI is off.
         */
        case 'mov': {
          const [dst, src] = insn.operands;

          if (dst.type === 'mem' && src.type === 'imm') {
            const dstValue = dst.value;
            const dstOffset = dstValue.disp;

            if (dstOffset === exceptionOffset && src.value.valueOf() === 0) {
              threadReg = dstValue.base;

              writer.putPushfx();
              writer.putPushax();
              writer.putMovRegReg('xbp', 'xsp');
              if (pointerSize === 4) {
                writer.putAndRegU32('esp', 0xfffffff0);
              } else {
                const scratchReg = (threadReg !== 'rdi') ? 'rdi' : 'rsi';
                writer.putMovRegU64(scratchReg, uint64('0xfffffffffffffff0'));
                writer.putAndRegReg('rsp', scratchReg);
              }
              writer.putCallAddressWithAlignedArguments(callback, [threadReg]);
              writer.putMovRegReg('xsp', 'xbp');
              writer.putPopax();
              writer.putPopfx();

              foundCore = true;
              keep = false;
            } else if (neuteredOffsets.has(dstOffset) && dstValue.base === threadReg) {
              keep = false;
            }
          }

          break;
        }
        /*
         * CheckJNI::ExceptionClear, when checked JNI is on. Wrapper that calls JNI::ExceptionClear().
         */
        case 'call': {
          const target = insn.operands[0];
          if (target.type === 'mem' && target.value.disp === ENV_VTABLE_OFFSET_EXCEPTION_CLEAR) {
            /*
             * Get art::Thread * from JNIEnv *
             */
            if (pointerSize === 4) {
              writer.putPopReg('eax');
              writer.putMovRegRegOffsetPtr('eax', 'eax', 4);
              writer.putPushReg('eax');
            } else {
              writer.putMovRegRegOffsetPtr('rdi', 'rdi', 8);
            }

            writer.putCallAddressWithArguments(callback, []);

            foundCore = true;
            keep = false;
          }

          break;
        }
      }

      if (keep) {
        relocator.writeAll();
      } else {
        relocator.skipOne();
      }

      if (offset === size) {
        break;
      }
    }

    relocator.dispose();
  });

  writer.dispose();

  if (!foundCore) {
    throwThreadStateTransitionParseError();
  }

  return new NativeFunction(pc, 'void', ['pointer'], nativeFunctionOptions);
}

function recompileExceptionClearForArm (buffer, pc, exceptionClearImpl, nextFuncImpl, exceptionOffset, neuteredOffsets, callback) {
  const blocks = {};
  const branchTargets = new Set();

  const thumbBitRemovalMask = ptr(1).not();

  const pending = [exceptionClearImpl];
  while (pending.length > 0) {
    let current = pending.shift();

    const alreadyCovered = Object.values(blocks).some(({ begin, end }) => current.compare(begin) >= 0 && current.compare(end) < 0);
    if (alreadyCovered) {
      continue;
    }

    const begin = current.and(thumbBitRemovalMask);
    const blockId = begin.toString();
    const thumbBit = current.and(1);

    let block = {
      begin
    };
    let lastInsn = null;

    let reachedEndOfBlock = false;
    let ifThenBlockRemaining = 0;
    do {
      if (current.equals(nextFuncImpl)) {
        reachedEndOfBlock = true;
        break;
      }

      const insn = Instruction.parse(current);
      const { mnemonic } = insn;
      lastInsn = insn;

      const currentAddress = current.and(thumbBitRemovalMask);
      const insnId = currentAddress.toString();

      const existingBlock = blocks[insnId];
      if (existingBlock !== undefined) {
        delete blocks[existingBlock.begin.toString()];
        blocks[blockId] = existingBlock;
        existingBlock.begin = block.begin;
        block = null;
        break;
      }

      const isOutsideIfThenBlock = ifThenBlockRemaining === 0;

      let branchTarget = null;

      switch (mnemonic) {
        case 'b':
          branchTarget = ptr(insn.operands[0].value);
          reachedEndOfBlock = isOutsideIfThenBlock;
          break;
        case 'beq.w':
        case 'beq':
        case 'bne':
        case 'bgt':
          branchTarget = ptr(insn.operands[0].value);
          break;
        case 'cbz':
        case 'cbnz':
          branchTarget = ptr(insn.operands[1].value);
          break;
        case 'pop.w':
          if (isOutsideIfThenBlock) {
            reachedEndOfBlock = insn.operands.filter(op => op.value === 'pc').length === 1;
          }
          break;
      }

      switch (mnemonic) {
        case 'it':
          ifThenBlockRemaining = 1;
          break;
        case 'itt':
          ifThenBlockRemaining = 2;
          break;
        case 'ittt':
          ifThenBlockRemaining = 3;
          break;
        case 'itttt':
          ifThenBlockRemaining = 4;
          break;
        default:
          if (ifThenBlockRemaining > 0) {
            ifThenBlockRemaining--;
          }
          break;
      }

      if (branchTarget !== null) {
        branchTargets.add(branchTarget.toString());

        pending.push(branchTarget.or(thumbBit));
        pending.sort((a, b) => a.compare(b));
      }

      current = insn.next;
    } while (!reachedEndOfBlock);

    if (block !== null) {
      block.end = lastInsn.address.add(lastInsn.size);
      blocks[blockId] = block;
    }
  }

  const blocksOrdered = Object.keys(blocks).map(key => blocks[key]);
  blocksOrdered.sort((a, b) => a.begin.compare(b.begin));

  const entryBlock = blocks[exceptionClearImpl.and(thumbBitRemovalMask).toString()];
  blocksOrdered.splice(blocksOrdered.indexOf(entryBlock), 1);
  blocksOrdered.unshift(entryBlock);

  const writer = new ThumbWriter(buffer, { pc });

  let foundCore = false;
  let threadReg = null;
  let realImplReg = null;

  blocksOrdered.forEach(block => {
    const relocator = new ThumbRelocator(block.begin, writer);

    let address = block.begin;
    const end = block.end;
    let size = 0;
    do {
      const offset = relocator.readOne();
      if (offset === 0) {
        throw new Error('Unexpected end of block');
      }
      const insn = relocator.input;
      address = insn.address;
      size = insn.size;
      const { mnemonic } = insn;

      const insnAddressId = address.toString();
      if (branchTargets.has(insnAddressId)) {
        writer.putLabel(insnAddressId);
      }

      let keep = true;

      switch (mnemonic) {
        case 'b':
          writer.putBLabel(branchLabelFromOperand(insn.operands[0]));
          keep = false;
          break;
        case 'beq.w':
          writer.putBCondLabelWide('eq', branchLabelFromOperand(insn.operands[0]));
          keep = false;
          break;
        case 'beq':
        case 'bne':
        case 'bgt':
          writer.putBCondLabelWide(mnemonic.substr(1), branchLabelFromOperand(insn.operands[0]));
          keep = false;
          break;
        case 'cbz': {
          const ops = insn.operands;
          writer.putCbzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          keep = false;
          break;
        }
        case 'cbnz': {
          const ops = insn.operands;
          writer.putCbnzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          keep = false;
          break;
        }
        /*
         * JNI::ExceptionClear(), when checked JNI is off.
         */
        case 'str':
        case 'str.w': {
          const dstValue = insn.operands[1].value;
          const dstOffset = dstValue.disp;

          if (dstOffset === exceptionOffset) {
            threadReg = dstValue.base;

            const nzcvqReg = (threadReg !== 'r4') ? 'r4' : 'r5';
            const clobberedRegs = ['r0', 'r1', 'r2', 'r3', nzcvqReg, 'r9', 'r12', 'lr'];

            writer.putPushRegs(clobberedRegs);
            writer.putMrsRegReg(nzcvqReg, 'apsr-nzcvq');

            writer.putCallAddressWithArguments(callback, [threadReg]);

            writer.putMsrRegReg('apsr-nzcvq', nzcvqReg);
            writer.putPopRegs(clobberedRegs);

            foundCore = true;
            keep = false;
          } else if (neuteredOffsets.has(dstOffset) && dstValue.base === threadReg) {
            keep = false;
          }

          break;
        }
        /*
         * CheckJNI::ExceptionClear, when checked JNI is on. Wrapper that calls JNI::ExceptionClear().
         */
        case 'ldr': {
          const [dstOp, srcOp] = insn.operands;

          if (srcOp.type === 'mem') {
            const src = srcOp.value;

            if (src.base[0] === 'r' && src.disp === ENV_VTABLE_OFFSET_EXCEPTION_CLEAR) {
              realImplReg = dstOp.value;
            }
          }

          break;
        }
        case 'blx':
          if (insn.operands[0].value === realImplReg) {
            writer.putLdrRegRegOffset('r0', 'r0', 4); // Get art::Thread * from JNIEnv *
            writer.putCallAddressWithArguments(callback, ['r0']);

            foundCore = true;
            realImplReg = null;
            keep = false;
          }

          break;
      }

      if (keep) {
        relocator.writeAll();
      } else {
        relocator.skipOne();
      }
    } while (!address.add(size).equals(end));

    relocator.dispose();
  });

  writer.dispose();

  if (!foundCore) {
    throwThreadStateTransitionParseError();
  }

  return new NativeFunction(pc.or(1), 'void', ['pointer'], nativeFunctionOptions);
}

function recompileExceptionClearForArm64 (buffer, pc, exceptionClearImpl, nextFuncImpl, exceptionOffset, neuteredOffsets, callback) {
  const blocks = {};
  const branchTargets = new Set();

  const pending = [exceptionClearImpl];
  while (pending.length > 0) {
    let current = pending.shift();

    const alreadyCovered = Object.values(blocks).some(({ begin, end }) => current.compare(begin) >= 0 && current.compare(end) < 0);
    if (alreadyCovered) {
      continue;
    }

    const blockAddressKey = current.toString();

    let block = {
      begin: current
    };
    let lastInsn = null;

    let reachedEndOfBlock = false;
    do {
      if (current.equals(nextFuncImpl)) {
        reachedEndOfBlock = true;
        break;
      }

      let insn;
      try {
        insn = Instruction.parse(current);
      } catch (e) {
        if (current.readU32() === 0x00000000) {
          reachedEndOfBlock = true;
          break;
        } else {
          throw e;
        }
      }
      lastInsn = insn;

      const existingBlock = blocks[insn.address.toString()];
      if (existingBlock !== undefined) {
        delete blocks[existingBlock.begin.toString()];
        blocks[blockAddressKey] = existingBlock;
        existingBlock.begin = block.begin;
        block = null;
        break;
      }

      let branchTarget = null;
      switch (insn.mnemonic) {
        case 'b':
          branchTarget = ptr(insn.operands[0].value);
          reachedEndOfBlock = true;
          break;
        case 'b.eq':
        case 'b.ne':
        case 'b.le':
        case 'b.gt':
          branchTarget = ptr(insn.operands[0].value);
          break;
        case 'cbz':
        case 'cbnz':
          branchTarget = ptr(insn.operands[1].value);
          break;
        case 'tbz':
        case 'tbnz':
          branchTarget = ptr(insn.operands[2].value);
          break;
        case 'ret':
          reachedEndOfBlock = true;
          break;
      }

      if (branchTarget !== null) {
        branchTargets.add(branchTarget.toString());

        pending.push(branchTarget);
        pending.sort((a, b) => a.compare(b));
      }

      current = insn.next;
    } while (!reachedEndOfBlock);

    if (block !== null) {
      block.end = lastInsn.address.add(lastInsn.size);
      blocks[blockAddressKey] = block;
    }
  }

  const blocksOrdered = Object.keys(blocks).map(key => blocks[key]);
  blocksOrdered.sort((a, b) => a.begin.compare(b.begin));

  const entryBlock = blocks[exceptionClearImpl.toString()];
  blocksOrdered.splice(blocksOrdered.indexOf(entryBlock), 1);
  blocksOrdered.unshift(entryBlock);

  const writer = new Arm64Writer(buffer, { pc });

  writer.putBLabel('performTransition');

  const invokeCallback = pc.add(writer.offset);
  writer.putPushAllXRegisters();
  writer.putCallAddressWithArguments(callback, ['x0']);
  writer.putPopAllXRegisters();
  writer.putRet();

  writer.putLabel('performTransition');

  let foundCore = false;
  let threadReg = null;
  let realImplReg = null;

  blocksOrdered.forEach(block => {
    const size = block.end.sub(block.begin).toInt32();

    const relocator = new Arm64Relocator(block.begin, writer);

    let offset;
    while ((offset = relocator.readOne()) !== 0) {
      const insn = relocator.input;
      const { mnemonic } = insn;

      const insnAddressId = insn.address.toString();
      if (branchTargets.has(insnAddressId)) {
        writer.putLabel(insnAddressId);
      }

      let keep = true;

      switch (mnemonic) {
        case 'b':
          writer.putBLabel(branchLabelFromOperand(insn.operands[0]));
          keep = false;
          break;
        case 'b.eq':
        case 'b.ne':
        case 'b.le':
        case 'b.gt':
          writer.putBCondLabel(mnemonic.substr(2), branchLabelFromOperand(insn.operands[0]));
          keep = false;
          break;
        case 'cbz': {
          const ops = insn.operands;
          writer.putCbzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          keep = false;
          break;
        }
        case 'cbnz': {
          const ops = insn.operands;
          writer.putCbnzRegLabel(ops[0].value, branchLabelFromOperand(ops[1]));
          keep = false;
          break;
        }
        case 'tbz': {
          const ops = insn.operands;
          writer.putTbzRegImmLabel(ops[0].value, ops[1].value.valueOf(), branchLabelFromOperand(ops[2]));
          keep = false;
          break;
        }
        case 'tbnz': {
          const ops = insn.operands;
          writer.putTbnzRegImmLabel(ops[0].value, ops[1].value.valueOf(), branchLabelFromOperand(ops[2]));
          keep = false;
          break;
        }
        /*
         * JNI::ExceptionClear(), when checked JNI is off.
         */
        case 'str': {
          const ops = insn.operands;
          const srcReg = ops[0].value;
          const dstValue = ops[1].value;
          const dstOffset = dstValue.disp;

          if (srcReg === 'xzr' && dstOffset === exceptionOffset) {
            threadReg = dstValue.base;

            writer.putPushRegReg('x0', 'lr');
            writer.putMovRegReg('x0', threadReg);
            writer.putBlImm(invokeCallback);
            writer.putPopRegReg('x0', 'lr');

            foundCore = true;
            keep = false;
          } else if (neuteredOffsets.has(dstOffset) && dstValue.base === threadReg) {
            keep = false;
          }

          break;
        }
        /*
         * CheckJNI::ExceptionClear, when checked JNI is on. Wrapper that calls JNI::ExceptionClear().
         */
        case 'ldr': {
          const ops = insn.operands;

          const src = ops[1].value;
          if (src.base[0] === 'x' && src.disp === ENV_VTABLE_OFFSET_EXCEPTION_CLEAR) {
            realImplReg = ops[0].value;
          }

          break;
        }
        case 'blr':
          if (insn.operands[0].value === realImplReg) {
            writer.putLdrRegRegOffset('x0', 'x0', 8); // Get art::Thread * from JNIEnv *
            writer.putCallAddressWithArguments(callback, ['x0']);

            foundCore = true;
            realImplReg = null;
            keep = false;
          }

          break;
      }

      if (keep) {
        relocator.writeAll();
      } else {
        relocator.skipOne();
      }

      if (offset === size) {
        break;
      }
    }

    relocator.dispose();
  });

  writer.dispose();

  if (!foundCore) {
    throwThreadStateTransitionParseError();
  }

  return new NativeFunction(pc, 'void', ['pointer'], nativeFunctionOptions);
}

function throwThreadStateTransitionParseError () {
  throw new Error('Unable to parse ART internals; please file a bug');
}

function fixupArtQuickDeliverExceptionBug (api) {
  const prettyMethod = api['art::ArtMethod::PrettyMethod'];
  if (prettyMethod === undefined) {
    return;
  }

  /*
   * There is a bug in art::Thread::QuickDeliverException() where it assumes
   * there is a Java stack frame present on the art::Thread's stack. This is
   * not the case if a native thread calls a throwing method like FindClass().
   *
   * We work around this bug here by detecting when method->PrettyMethod()
   * happens with method == nullptr.
   */
  Interceptor.attach(prettyMethod.impl, artController.hooks.ArtMethod.prettyMethod);
  Interceptor.flush();
}

function branchLabelFromOperand (op) {
  return ptr(op.value).toString();
}

function makeCxxMethodWrapperReturningPointerByValueGeneric (address, argTypes) {
  return new NativeFunction(address, 'pointer', argTypes, nativeFunctionOptions);
}

function makeCxxMethodWrapperReturningPointerByValueInFirstArg (address, argTypes) {
  const impl = new NativeFunction(address, 'void', ['pointer'].concat(argTypes), nativeFunctionOptions);
  return function () {
    const resultPtr = Memory.alloc(pointerSize);
    impl(resultPtr, ...arguments);
    return resultPtr.readPointer();
  };
}

function makeCxxMethodWrapperReturningStdStringByValue (impl, argTypes) {
  const { arch } = Process;
  switch (arch) {
    case 'ia32':
    case 'arm64': {
      let thunk;
      if (arch === 'ia32') {
        thunk = makeThunk(64, writer => {
          const argCount = 1 + argTypes.length;
          const argvSize = argCount * 4;
          writer.putSubRegImm('esp', argvSize);
          for (let i = 0; i !== argCount; i++) {
            const offset = i * 4;
            writer.putMovRegRegOffsetPtr('eax', 'esp', argvSize + 4 + offset);
            writer.putMovRegOffsetPtrReg('esp', offset, 'eax');
          }
          writer.putCallAddress(impl);
          writer.putAddRegImm('esp', argvSize - 4);
          writer.putRet();
        });
      } else {
        thunk = makeThunk(32, writer => {
          writer.putMovRegReg('x8', 'x0');
          argTypes.forEach((t, i) => {
            writer.putMovRegReg('x' + i, 'x' + (i + 1));
          });
          writer.putLdrRegAddress('x7', impl);
          writer.putBrReg('x7');
        });
      }

      const invokeThunk = new NativeFunction(thunk, 'void', ['pointer'].concat(argTypes), nativeFunctionOptions);
      const wrapper = function (...args) {
        invokeThunk(...args);
      };
      wrapper.handle = thunk;
      wrapper.impl = impl;
      return wrapper;
    }
    default: {
      const result = new NativeFunction(impl, 'void', ['pointer'].concat(argTypes), nativeFunctionOptions);
      result.impl = impl;
      return result;
    }
  }
}

class StdString {
  constructor () {
    this.handle = Memory.alloc(STD_STRING_SIZE);
  }

  dispose () {
    const [data, isTiny] = this._getData();
    if (!isTiny) {
      getApi().$delete(data);
    }
  }

  disposeToString () {
    const result = this.toString();
    this.dispose();
    return result;
  }

  toString () {
    const [data] = this._getData();
    return data.readUtf8String();
  }

  _getData () {
    const str = this.handle;
    const isTiny = (str.readU8() & 1) === 0;
    const data = isTiny ? str.add(1) : str.add(2 * pointerSize).readPointer();
    return [data, isTiny];
  }
}

class StdVector {
  $delete () {
    this.dispose();
    getApi().$delete(this);
  }

  constructor (storage, elementSize) {
    this.handle = storage;

    this._begin = storage;
    this._end = storage.add(pointerSize);
    this._storage = storage.add(2 * pointerSize);

    this._elementSize = elementSize;
  }

  init () {
    this.begin = NULL;
    this.end = NULL;
    this.storage = NULL;
  }

  dispose () {
    getApi().$delete(this.begin);
  }

  get begin () {
    return this._begin.readPointer();
  }

  set begin (value) {
    this._begin.writePointer(value);
  }

  get end () {
    return this._end.readPointer();
  }

  set end (value) {
    this._end.writePointer(value);
  }

  get storage () {
    return this._storage.readPointer();
  }

  set storage (value) {
    this._storage.writePointer(value);
  }

  get size () {
    return this.end.sub(this.begin).toInt32() / this._elementSize;
  }
}

class HandleVector extends StdVector {
  static $new () {
    const vector = new HandleVector(getApi().$new(STD_VECTOR_SIZE));
    vector.init();
    return vector;
  }

  constructor (storage) {
    super(storage, pointerSize);
  }

  get handles () {
    const result = [];

    let cur = this.begin;
    const end = this.end;
    while (!cur.equals(end)) {
      result.push(cur.readPointer());
      cur = cur.add(pointerSize);
    }

    return result;
  }
}

const BHS_OFFSET_LINK = 0;
const BHS_OFFSET_NUM_REFS = pointerSize;
const BHS_SIZE = BHS_OFFSET_NUM_REFS + 4;

const kNumReferencesVariableSized = -1;

class BaseHandleScope {
  $delete () {
    this.dispose();
    getApi().$delete(this);
  }

  constructor (storage) {
    this.handle = storage;

    this._link = storage.add(BHS_OFFSET_LINK);
    this._numberOfReferences = storage.add(BHS_OFFSET_NUM_REFS);
  }

  init (link, numberOfReferences) {
    this.link = link;
    this.numberOfReferences = numberOfReferences;
  }

  dispose () {
  }

  get link () {
    return new BaseHandleScope(this._link.readPointer());
  }

  set link (value) {
    this._link.writePointer(value);
  }

  get numberOfReferences () {
    return this._numberOfReferences.readS32();
  }

  set numberOfReferences (value) {
    this._numberOfReferences.writeS32(value);
  }
}

const VSHS_OFFSET_SELF = alignPointerOffset(BHS_SIZE);
const VSHS_OFFSET_CURRENT_SCOPE = VSHS_OFFSET_SELF + pointerSize;
const VSHS_SIZE = VSHS_OFFSET_CURRENT_SCOPE + pointerSize;

class VariableSizedHandleScope extends BaseHandleScope {
  static $new (thread, vm) {
    const scope = new VariableSizedHandleScope(getApi().$new(VSHS_SIZE));
    scope.init(thread, vm);
    return scope;
  }

  constructor (storage) {
    super(storage);

    this._self = storage.add(VSHS_OFFSET_SELF);
    this._currentScope = storage.add(VSHS_OFFSET_CURRENT_SCOPE);

    const kLocalScopeSize = 64;
    const kSizeOfReferencesPerScope = kLocalScopeSize - pointerSize - 4 - 4;
    const kNumReferencesPerScope = kSizeOfReferencesPerScope / 4;
    this._scopeLayout = FixedSizeHandleScope.layoutForCapacity(kNumReferencesPerScope);
    this._topHandleScopePtr = null;
  }

  init (thread, vm) {
    const topHandleScopePtr = thread.add(getArtThreadSpec(vm).offset.topHandleScope);
    this._topHandleScopePtr = topHandleScopePtr;

    super.init(topHandleScopePtr.readPointer(), kNumReferencesVariableSized);

    this.self = thread;
    this.currentScope = FixedSizeHandleScope.$new(this._scopeLayout);

    topHandleScopePtr.writePointer(this);
  }

  dispose () {
    this._topHandleScopePtr.writePointer(this.link);

    let scope;
    while ((scope = this.currentScope) !== null) {
      const next = scope.link;
      scope.$delete();
      this.currentScope = next;
    }
  }

  get self () {
    return this._self.readPointer();
  }

  set self (value) {
    this._self.writePointer(value);
  }

  get currentScope () {
    const storage = this._currentScope.readPointer();
    if (storage.isNull()) {
      return null;
    }
    return new FixedSizeHandleScope(storage, this._scopeLayout);
  }

  set currentScope (value) {
    this._currentScope.writePointer(value);
  }

  newHandle (object) {
    return this.currentScope.newHandle(object);
  }
}

class FixedSizeHandleScope extends BaseHandleScope {
  static $new (layout) {
    const scope = new FixedSizeHandleScope(getApi().$new(layout.size), layout);
    scope.init();
    return scope;
  }

  constructor (storage, layout) {
    super(storage);

    const { offset } = layout;
    this._refsStorage = storage.add(offset.refsStorage);
    this._pos = storage.add(offset.pos);

    this._layout = layout;
  }

  init () {
    super.init(NULL, this._layout.numberOfReferences);

    this.pos = 0;
  }

  get pos () {
    return this._pos.readU32();
  }

  set pos (value) {
    this._pos.writeU32(value);
  }

  newHandle (object) {
    const pos = this.pos;
    const handle = this._refsStorage.add(pos * 4);
    handle.writeS32(object.toInt32());
    this.pos = pos + 1;
    return handle;
  }

  static layoutForCapacity (numRefs) {
    const refsStorage = BHS_SIZE;
    const pos = refsStorage + (numRefs * 4);

    return {
      size: pos + 4,
      numberOfReferences: numRefs,
      offset: {
        refsStorage,
        pos
      }
    };
  }
}

const objectVisitorPredicateFactories = {
  arm: function (needle, onMatch) {
    const size = Process.pageSize;

    const predicate = Memory.alloc(size);

    Memory.protect(predicate, size, 'rwx');

    const onMatchCallback = new NativeCallback(onMatch, 'void', ['pointer']);
    predicate._onMatchCallback = onMatchCallback;

    const instructions = [
      0x6801, // ldr r1, [r0]
      0x4a03, // ldr r2, =needle
      0x4291, // cmp r1, r2
      0xd101, // bne mismatch
      0x4b02, // ldr r3, =onMatch
      0x4718, // bx r3
      0x4770, // bx lr
      0xbf00 // nop
    ];
    const needleOffset = instructions.length * 2;
    const onMatchOffset = needleOffset + 4;
    const codeSize = onMatchOffset + 4;

    Memory.patchCode(predicate, codeSize, function (address) {
      instructions.forEach((instruction, index) => {
        address.add(index * 2).writeU16(instruction);
      });
      address.add(needleOffset).writeS32(needle);
      address.add(onMatchOffset).writePointer(onMatchCallback);
    });

    return predicate.or(1);
  },
  arm64: function (needle, onMatch) {
    const size = Process.pageSize;

    const predicate = Memory.alloc(size);

    Memory.protect(predicate, size, 'rwx');

    const onMatchCallback = new NativeCallback(onMatch, 'void', ['pointer']);
    predicate._onMatchCallback = onMatchCallback;

    const instructions = [
      0xb9400001, // ldr w1, [x0]
      0x180000c2, // ldr w2, =needle
      0x6b02003f, // cmp w1, w2
      0x54000061, // b.ne mismatch
      0x58000083, // ldr x3, =onMatch
      0xd61f0060, // br x3
      0xd65f03c0 // ret
    ];
    const needleOffset = instructions.length * 4;
    const onMatchOffset = needleOffset + 4;
    const codeSize = onMatchOffset + 8;

    Memory.patchCode(predicate, codeSize, function (address) {
      instructions.forEach((instruction, index) => {
        address.add(index * 4).writeU32(instruction);
      });
      address.add(needleOffset).writeS32(needle);
      address.add(onMatchOffset).writePointer(onMatchCallback);
    });

    return predicate;
  }
};

function makeObjectVisitorPredicate (needle, onMatch) {
  const factory = objectVisitorPredicateFactories[Process.arch] || makeGenericObjectVisitorPredicate;
  return factory(needle, onMatch);
}

function makeGenericObjectVisitorPredicate (needle, onMatch) {
  return new NativeCallback(object => {
    const klass = object.readS32();
    if (klass === needle) {
      onMatch(object);
    }
  }, 'void', ['pointer', 'pointer']);
}

function alignPointerOffset (offset) {
  const remainder = offset % pointerSize;
  if (remainder !== 0) {
    return offset + pointerSize - remainder;
  }
  return offset;
}

module.exports = {
  getApi,
  ensureClassInitialized,
  getAndroidVersion,
  getAndroidApiLevel,
  getArtClassSpec,
  getArtMethodSpec,
  getArtFieldSpec,
  getArtThreadSpec,
  getArtThreadFromEnv,
  withRunnableArtThread,
  withAllArtThreadsSuspended,
  makeArtClassVisitor,
  makeArtClassLoaderVisitor,
  ArtStackVisitor,
  ArtMethod,
  makeMethodMangler,
  translateMethod,
  backtrace,
  revertGlobalPatches,
  deoptimizeEverything,
  deoptimizeBootImage,
  deoptimizeMethod,
  HandleVector,
  VariableSizedHandleScope,
  makeObjectVisitorPredicate,
  DVM_JNI_ENV_OFFSET_SELF
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./alloc":7,"./jvmti":10,"./machine-code":11,"./memoize":12,"./result":13,"./vm":14}],9:[function(require,module,exports){
function Env (handle, vm) {
  this.handle = handle;
  this.vm = vm;
}

const pointerSize = Process.pointerSize;

const JNI_ABORT = 2;

const CALL_CONSTRUCTOR_METHOD_OFFSET = 28;

const CALL_OBJECT_METHOD_OFFSET = 34;
const CALL_BOOLEAN_METHOD_OFFSET = 37;
const CALL_BYTE_METHOD_OFFSET = 40;
const CALL_CHAR_METHOD_OFFSET = 43;
const CALL_SHORT_METHOD_OFFSET = 46;
const CALL_INT_METHOD_OFFSET = 49;
const CALL_LONG_METHOD_OFFSET = 52;
const CALL_FLOAT_METHOD_OFFSET = 55;
const CALL_DOUBLE_METHOD_OFFSET = 58;
const CALL_VOID_METHOD_OFFSET = 61;

const CALL_NONVIRTUAL_OBJECT_METHOD_OFFSET = 64;
const CALL_NONVIRTUAL_BOOLEAN_METHOD_OFFSET = 67;
const CALL_NONVIRTUAL_BYTE_METHOD_OFFSET = 70;
const CALL_NONVIRTUAL_CHAR_METHOD_OFFSET = 73;
const CALL_NONVIRTUAL_SHORT_METHOD_OFFSET = 76;
const CALL_NONVIRTUAL_INT_METHOD_OFFSET = 79;
const CALL_NONVIRTUAL_LONG_METHOD_OFFSET = 82;
const CALL_NONVIRTUAL_FLOAT_METHOD_OFFSET = 85;
const CALL_NONVIRTUAL_DOUBLE_METHOD_OFFSET = 88;
const CALL_NONVIRTUAL_VOID_METHOD_OFFSET = 91;

const CALL_STATIC_OBJECT_METHOD_OFFSET = 114;
const CALL_STATIC_BOOLEAN_METHOD_OFFSET = 117;
const CALL_STATIC_BYTE_METHOD_OFFSET = 120;
const CALL_STATIC_CHAR_METHOD_OFFSET = 123;
const CALL_STATIC_SHORT_METHOD_OFFSET = 126;
const CALL_STATIC_INT_METHOD_OFFSET = 129;
const CALL_STATIC_LONG_METHOD_OFFSET = 132;
const CALL_STATIC_FLOAT_METHOD_OFFSET = 135;
const CALL_STATIC_DOUBLE_METHOD_OFFSET = 138;
const CALL_STATIC_VOID_METHOD_OFFSET = 141;

const GET_OBJECT_FIELD_OFFSET = 95;
const GET_BOOLEAN_FIELD_OFFSET = 96;
const GET_BYTE_FIELD_OFFSET = 97;
const GET_CHAR_FIELD_OFFSET = 98;
const GET_SHORT_FIELD_OFFSET = 99;
const GET_INT_FIELD_OFFSET = 100;
const GET_LONG_FIELD_OFFSET = 101;
const GET_FLOAT_FIELD_OFFSET = 102;
const GET_DOUBLE_FIELD_OFFSET = 103;

const SET_OBJECT_FIELD_OFFSET = 104;
const SET_BOOLEAN_FIELD_OFFSET = 105;
const SET_BYTE_FIELD_OFFSET = 106;
const SET_CHAR_FIELD_OFFSET = 107;
const SET_SHORT_FIELD_OFFSET = 108;
const SET_INT_FIELD_OFFSET = 109;
const SET_LONG_FIELD_OFFSET = 110;
const SET_FLOAT_FIELD_OFFSET = 111;
const SET_DOUBLE_FIELD_OFFSET = 112;

const GET_STATIC_OBJECT_FIELD_OFFSET = 145;
const GET_STATIC_BOOLEAN_FIELD_OFFSET = 146;
const GET_STATIC_BYTE_FIELD_OFFSET = 147;
const GET_STATIC_CHAR_FIELD_OFFSET = 148;
const GET_STATIC_SHORT_FIELD_OFFSET = 149;
const GET_STATIC_INT_FIELD_OFFSET = 150;
const GET_STATIC_LONG_FIELD_OFFSET = 151;
const GET_STATIC_FLOAT_FIELD_OFFSET = 152;
const GET_STATIC_DOUBLE_FIELD_OFFSET = 153;

const SET_STATIC_OBJECT_FIELD_OFFSET = 154;
const SET_STATIC_BOOLEAN_FIELD_OFFSET = 155;
const SET_STATIC_BYTE_FIELD_OFFSET = 156;
const SET_STATIC_CHAR_FIELD_OFFSET = 157;
const SET_STATIC_SHORT_FIELD_OFFSET = 158;
const SET_STATIC_INT_FIELD_OFFSET = 159;
const SET_STATIC_LONG_FIELD_OFFSET = 160;
const SET_STATIC_FLOAT_FIELD_OFFSET = 161;
const SET_STATIC_DOUBLE_FIELD_OFFSET = 162;

const callMethodOffset = {
  pointer: CALL_OBJECT_METHOD_OFFSET,
  uint8: CALL_BOOLEAN_METHOD_OFFSET,
  int8: CALL_BYTE_METHOD_OFFSET,
  uint16: CALL_CHAR_METHOD_OFFSET,
  int16: CALL_SHORT_METHOD_OFFSET,
  int32: CALL_INT_METHOD_OFFSET,
  int64: CALL_LONG_METHOD_OFFSET,
  float: CALL_FLOAT_METHOD_OFFSET,
  double: CALL_DOUBLE_METHOD_OFFSET,
  void: CALL_VOID_METHOD_OFFSET
};

const callNonvirtualMethodOffset = {
  pointer: CALL_NONVIRTUAL_OBJECT_METHOD_OFFSET,
  uint8: CALL_NONVIRTUAL_BOOLEAN_METHOD_OFFSET,
  int8: CALL_NONVIRTUAL_BYTE_METHOD_OFFSET,
  uint16: CALL_NONVIRTUAL_CHAR_METHOD_OFFSET,
  int16: CALL_NONVIRTUAL_SHORT_METHOD_OFFSET,
  int32: CALL_NONVIRTUAL_INT_METHOD_OFFSET,
  int64: CALL_NONVIRTUAL_LONG_METHOD_OFFSET,
  float: CALL_NONVIRTUAL_FLOAT_METHOD_OFFSET,
  double: CALL_NONVIRTUAL_DOUBLE_METHOD_OFFSET,
  void: CALL_NONVIRTUAL_VOID_METHOD_OFFSET
};

const callStaticMethodOffset = {
  pointer: CALL_STATIC_OBJECT_METHOD_OFFSET,
  uint8: CALL_STATIC_BOOLEAN_METHOD_OFFSET,
  int8: CALL_STATIC_BYTE_METHOD_OFFSET,
  uint16: CALL_STATIC_CHAR_METHOD_OFFSET,
  int16: CALL_STATIC_SHORT_METHOD_OFFSET,
  int32: CALL_STATIC_INT_METHOD_OFFSET,
  int64: CALL_STATIC_LONG_METHOD_OFFSET,
  float: CALL_STATIC_FLOAT_METHOD_OFFSET,
  double: CALL_STATIC_DOUBLE_METHOD_OFFSET,
  void: CALL_STATIC_VOID_METHOD_OFFSET
};

const getFieldOffset = {
  pointer: GET_OBJECT_FIELD_OFFSET,
  uint8: GET_BOOLEAN_FIELD_OFFSET,
  int8: GET_BYTE_FIELD_OFFSET,
  uint16: GET_CHAR_FIELD_OFFSET,
  int16: GET_SHORT_FIELD_OFFSET,
  int32: GET_INT_FIELD_OFFSET,
  int64: GET_LONG_FIELD_OFFSET,
  float: GET_FLOAT_FIELD_OFFSET,
  double: GET_DOUBLE_FIELD_OFFSET
};

const setFieldOffset = {
  pointer: SET_OBJECT_FIELD_OFFSET,
  uint8: SET_BOOLEAN_FIELD_OFFSET,
  int8: SET_BYTE_FIELD_OFFSET,
  uint16: SET_CHAR_FIELD_OFFSET,
  int16: SET_SHORT_FIELD_OFFSET,
  int32: SET_INT_FIELD_OFFSET,
  int64: SET_LONG_FIELD_OFFSET,
  float: SET_FLOAT_FIELD_OFFSET,
  double: SET_DOUBLE_FIELD_OFFSET
};

const getStaticFieldOffset = {
  pointer: GET_STATIC_OBJECT_FIELD_OFFSET,
  uint8: GET_STATIC_BOOLEAN_FIELD_OFFSET,
  int8: GET_STATIC_BYTE_FIELD_OFFSET,
  uint16: GET_STATIC_CHAR_FIELD_OFFSET,
  int16: GET_STATIC_SHORT_FIELD_OFFSET,
  int32: GET_STATIC_INT_FIELD_OFFSET,
  int64: GET_STATIC_LONG_FIELD_OFFSET,
  float: GET_STATIC_FLOAT_FIELD_OFFSET,
  double: GET_STATIC_DOUBLE_FIELD_OFFSET
};

const setStaticFieldOffset = {
  pointer: SET_STATIC_OBJECT_FIELD_OFFSET,
  uint8: SET_STATIC_BOOLEAN_FIELD_OFFSET,
  int8: SET_STATIC_BYTE_FIELD_OFFSET,
  uint16: SET_STATIC_CHAR_FIELD_OFFSET,
  int16: SET_STATIC_SHORT_FIELD_OFFSET,
  int32: SET_STATIC_INT_FIELD_OFFSET,
  int64: SET_STATIC_LONG_FIELD_OFFSET,
  float: SET_STATIC_FLOAT_FIELD_OFFSET,
  double: SET_STATIC_DOUBLE_FIELD_OFFSET
};

const nativeFunctionOptions = {
  exceptions: 'propagate'
};

let cachedVtable = null;
let globalRefs = [];
Env.dispose = function (env) {
  globalRefs.forEach(env.deleteGlobalRef, env);
  globalRefs = [];
};

function register (globalRef) {
  globalRefs.push(globalRef);
  return globalRef;
}

function vtable (instance) {
  if (cachedVtable === null) {
    cachedVtable = instance.handle.readPointer();
  }
  return cachedVtable;
}

function proxy (offset, retType, argTypes, wrapper) {
  let impl = null;
  return function () {
    if (impl === null) {
      impl = new NativeFunction(vtable(this).add(offset * pointerSize).readPointer(), retType, argTypes, nativeFunctionOptions);
    }
    let args = [impl];
    args = args.concat.apply(args, arguments);
    return wrapper.apply(this, args);
  };
}

Env.prototype.getVersion = proxy(4, 'int32', ['pointer'], function (impl) {
  return impl(this.handle);
});

Env.prototype.findClass = proxy(6, 'pointer', ['pointer', 'pointer'], function (impl, name) {
  const result = impl(this.handle, Memory.allocUtf8String(name));
  this.throwIfExceptionPending();
  return result;
});

Env.prototype.throwIfExceptionPending = function () {
  const throwable = this.exceptionOccurred();
  if (throwable.isNull()) {
    return;
  }
  this.exceptionClear();
  const handle = this.newGlobalRef(throwable);
  this.deleteLocalRef(throwable);

  const description = this.vaMethod('pointer', [])(this.handle, handle, this.javaLangObject().toString);
  const descriptionStr = this.stringFromJni(description);
  this.deleteLocalRef(description);

  const error = new Error(descriptionStr);
  error.$h = handle;
  Script.bindWeak(error, makeErrorHandleDestructor(this.vm, handle));

  throw error;
};

function makeErrorHandleDestructor (vm, handle) {
  return function () {
    vm.perform(env => {
      env.deleteGlobalRef(handle);
    });
  };
}

Env.prototype.fromReflectedMethod = proxy(7, 'pointer', ['pointer', 'pointer'], function (impl, method) {
  return impl(this.handle, method);
});

Env.prototype.fromReflectedField = proxy(8, 'pointer', ['pointer', 'pointer'], function (impl, method) {
  return impl(this.handle, method);
});

Env.prototype.toReflectedMethod = proxy(9, 'pointer', ['pointer', 'pointer', 'pointer', 'uint8'], function (impl, klass, methodId, isStatic) {
  return impl(this.handle, klass, methodId, isStatic);
});

Env.prototype.getSuperclass = proxy(10, 'pointer', ['pointer', 'pointer'], function (impl, klass) {
  return impl(this.handle, klass);
});

Env.prototype.isAssignableFrom = proxy(11, 'uint8', ['pointer', 'pointer', 'pointer'], function (impl, klass1, klass2) {
  return !!impl(this.handle, klass1, klass2);
});

Env.prototype.toReflectedField = proxy(12, 'pointer', ['pointer', 'pointer', 'pointer', 'uint8'], function (impl, klass, fieldId, isStatic) {
  return impl(this.handle, klass, fieldId, isStatic);
});

Env.prototype.throw = proxy(13, 'int32', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.exceptionOccurred = proxy(15, 'pointer', ['pointer'], function (impl) {
  return impl(this.handle);
});

Env.prototype.exceptionDescribe = proxy(16, 'void', ['pointer'], function (impl) {
  impl(this.handle);
});

Env.prototype.exceptionClear = proxy(17, 'void', ['pointer'], function (impl) {
  impl(this.handle);
});

Env.prototype.pushLocalFrame = proxy(19, 'int32', ['pointer', 'int32'], function (impl, capacity) {
  return impl(this.handle, capacity);
});

Env.prototype.popLocalFrame = proxy(20, 'pointer', ['pointer', 'pointer'], function (impl, result) {
  return impl(this.handle, result);
});

Env.prototype.newGlobalRef = proxy(21, 'pointer', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.deleteGlobalRef = proxy(22, 'void', ['pointer', 'pointer'], function (impl, globalRef) {
  impl(this.handle, globalRef);
});

Env.prototype.deleteLocalRef = proxy(23, 'void', ['pointer', 'pointer'], function (impl, localRef) {
  impl(this.handle, localRef);
});

Env.prototype.isSameObject = proxy(24, 'uint8', ['pointer', 'pointer', 'pointer'], function (impl, ref1, ref2) {
  return !!impl(this.handle, ref1, ref2);
});

Env.prototype.newLocalRef = proxy(25, 'pointer', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.allocObject = proxy(27, 'pointer', ['pointer', 'pointer'], function (impl, clazz) {
  return impl(this.handle, clazz);
});

Env.prototype.getObjectClass = proxy(31, 'pointer', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.isInstanceOf = proxy(32, 'uint8', ['pointer', 'pointer', 'pointer'], function (impl, obj, klass) {
  return !!impl(this.handle, obj, klass);
});

Env.prototype.getMethodId = proxy(33, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getFieldId = proxy(94, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getIntField = proxy(100, 'int32', ['pointer', 'pointer', 'pointer'], function (impl, obj, fieldId) {
  return impl(this.handle, obj, fieldId);
});

Env.prototype.getStaticMethodId = proxy(113, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getStaticFieldId = proxy(144, 'pointer', ['pointer', 'pointer', 'pointer', 'pointer'], function (impl, klass, name, sig) {
  return impl(this.handle, klass, Memory.allocUtf8String(name), Memory.allocUtf8String(sig));
});

Env.prototype.getStaticIntField = proxy(150, 'int32', ['pointer', 'pointer', 'pointer'], function (impl, obj, fieldId) {
  return impl(this.handle, obj, fieldId);
});

Env.prototype.getStringLength = proxy(164, 'int32', ['pointer', 'pointer'], function (impl, str) {
  return impl(this.handle, str);
});

Env.prototype.getStringChars = proxy(165, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, str) {
  return impl(this.handle, str, NULL);
});

Env.prototype.releaseStringChars = proxy(166, 'void', ['pointer', 'pointer', 'pointer'], function (impl, str, utf) {
  impl(this.handle, str, utf);
});

Env.prototype.newStringUtf = proxy(167, 'pointer', ['pointer', 'pointer'], function (impl, str) {
  const utf = Memory.allocUtf8String(str);
  return impl(this.handle, utf);
});

Env.prototype.getStringUtfChars = proxy(169, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, str) {
  return impl(this.handle, str, NULL);
});

Env.prototype.releaseStringUtfChars = proxy(170, 'void', ['pointer', 'pointer', 'pointer'], function (impl, str, utf) {
  impl(this.handle, str, utf);
});

Env.prototype.getArrayLength = proxy(171, 'int32', ['pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array);
});

Env.prototype.newObjectArray = proxy(172, 'pointer', ['pointer', 'int32', 'pointer', 'pointer'], function (impl, length, elementClass, initialElement) {
  return impl(this.handle, length, elementClass, initialElement);
});

Env.prototype.getObjectArrayElement = proxy(173, 'pointer', ['pointer', 'pointer', 'int32'], function (impl, array, index) {
  return impl(this.handle, array, index);
});

Env.prototype.setObjectArrayElement = proxy(174, 'void', ['pointer', 'pointer', 'int32', 'pointer'], function (impl, array, index, value) {
  impl(this.handle, array, index, value);
});

Env.prototype.newBooleanArray = proxy(175, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newByteArray = proxy(176, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newCharArray = proxy(177, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newShortArray = proxy(178, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newIntArray = proxy(179, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newLongArray = proxy(180, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newFloatArray = proxy(181, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.newDoubleArray = proxy(182, 'pointer', ['pointer', 'int32'], function (impl, length) {
  return impl(this.handle, length);
});

Env.prototype.getBooleanArrayElements = proxy(183, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getByteArrayElements = proxy(184, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getCharArrayElements = proxy(185, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getShortArrayElements = proxy(186, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getIntArrayElements = proxy(187, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getLongArrayElements = proxy(188, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getFloatArrayElements = proxy(189, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.getDoubleArrayElements = proxy(190, 'pointer', ['pointer', 'pointer', 'pointer'], function (impl, array) {
  return impl(this.handle, array, NULL);
});

Env.prototype.releaseBooleanArrayElements = proxy(191, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseByteArrayElements = proxy(192, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseCharArrayElements = proxy(193, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseShortArrayElements = proxy(194, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseIntArrayElements = proxy(195, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseLongArrayElements = proxy(196, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseFloatArrayElements = proxy(197, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.releaseDoubleArrayElements = proxy(198, 'pointer', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, array, cArray) {
  impl(this.handle, array, cArray, JNI_ABORT);
});

Env.prototype.getByteArrayRegion = proxy(200, 'void', ['pointer', 'pointer', 'int', 'int', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setBooleanArrayRegion = proxy(207, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setByteArrayRegion = proxy(208, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setCharArrayRegion = proxy(209, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setShortArrayRegion = proxy(210, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setIntArrayRegion = proxy(211, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setLongArrayRegion = proxy(212, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setFloatArrayRegion = proxy(213, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.setDoubleArrayRegion = proxy(214, 'void', ['pointer', 'pointer', 'int32', 'int32', 'pointer'], function (impl, array, start, length, cArray) {
  impl(this.handle, array, start, length, cArray);
});

Env.prototype.registerNatives = proxy(215, 'int32', ['pointer', 'pointer', 'pointer', 'int32'], function (impl, klass, methods, numMethods) {
  return impl(this.handle, klass, methods, numMethods);
});

Env.prototype.monitorEnter = proxy(217, 'int32', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.monitorExit = proxy(218, 'int32', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.getDirectBufferAddress = proxy(230, 'pointer', ['pointer', 'pointer'], function (impl, obj) {
  return impl(this.handle, obj);
});

Env.prototype.getObjectRefType = proxy(232, 'int32', ['pointer', 'pointer'], function (impl, ref) {
  return impl(this.handle, ref);
});

const cachedMethods = new Map();

function plainMethod (offset, retType, argTypes, options) {
  return getOrMakeMethod(this, 'p', makePlainMethod, offset, retType, argTypes, options);
}

function vaMethod (offset, retType, argTypes, options) {
  return getOrMakeMethod(this, 'v', makeVaMethod, offset, retType, argTypes, options);
}

function nonvirtualVaMethod (offset, retType, argTypes, options) {
  return getOrMakeMethod(this, 'n', makeNonvirtualVaMethod, offset, retType, argTypes, options);
}

function getOrMakeMethod (env, flavor, construct, offset, retType, argTypes, options) {
  if (options !== undefined) {
    return construct(env, offset, retType, argTypes, options);
  }

  const key = [offset, flavor, retType].concat(argTypes).join('|');
  let m = cachedMethods.get(key);
  if (m === undefined) {
    m = construct(env, offset, retType, argTypes, nativeFunctionOptions);
    cachedMethods.set(key, m);
  }
  return m;
}

function makePlainMethod (env, offset, retType, argTypes, options) {
  return new NativeFunction(
    vtable(env).add(offset * pointerSize).readPointer(),
    retType,
    ['pointer', 'pointer', 'pointer'].concat(argTypes),
    options);
}

function makeVaMethod (env, offset, retType, argTypes, options) {
  return new NativeFunction(
    vtable(env).add(offset * pointerSize).readPointer(),
    retType,
    ['pointer', 'pointer', 'pointer', '...'].concat(argTypes),
    options);
}

function makeNonvirtualVaMethod (env, offset, retType, argTypes, options) {
  return new NativeFunction(
    vtable(env).add(offset * pointerSize).readPointer(),
    retType,
    ['pointer', 'pointer', 'pointer', 'pointer', '...'].concat(argTypes),
    options);
}

Env.prototype.constructor = function (argTypes, options) {
  return vaMethod.call(this, CALL_CONSTRUCTOR_METHOD_OFFSET, 'pointer', argTypes, options);
};

Env.prototype.vaMethod = function (retType, argTypes, options) {
  const offset = callMethodOffset[retType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + retType);
  }
  return vaMethod.call(this, offset, retType, argTypes, options);
};

Env.prototype.nonvirtualVaMethod = function (retType, argTypes, options) {
  const offset = callNonvirtualMethodOffset[retType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + retType);
  }
  return nonvirtualVaMethod.call(this, offset, retType, argTypes, options);
};

Env.prototype.staticVaMethod = function (retType, argTypes, options) {
  const offset = callStaticMethodOffset[retType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + retType);
  }
  return vaMethod.call(this, offset, retType, argTypes, options);
};

Env.prototype.getField = function (fieldType) {
  const offset = getFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, fieldType, []);
};

Env.prototype.getStaticField = function (fieldType) {
  const offset = getStaticFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, fieldType, []);
};

Env.prototype.setField = function (fieldType) {
  const offset = setFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, 'void', [fieldType]);
};

Env.prototype.setStaticField = function (fieldType) {
  const offset = setStaticFieldOffset[fieldType];
  if (offset === undefined) {
    throw new Error('Unsupported type: ' + fieldType);
  }
  return plainMethod.call(this, offset, 'void', [fieldType]);
};

let javaLangClass = null;
Env.prototype.javaLangClass = function () {
  if (javaLangClass === null) {
    const handle = this.findClass('java/lang/Class');
    try {
      const get = this.getMethodId.bind(this, handle);
      javaLangClass = {
        handle: register(this.newGlobalRef(handle)),
        getName: get('getName', '()Ljava/lang/String;'),
        getSimpleName: get('getSimpleName', '()Ljava/lang/String;'),
        getGenericSuperclass: get('getGenericSuperclass', '()Ljava/lang/reflect/Type;'),
        getDeclaredConstructors: get('getDeclaredConstructors', '()[Ljava/lang/reflect/Constructor;'),
        getDeclaredMethods: get('getDeclaredMethods', '()[Ljava/lang/reflect/Method;'),
        getDeclaredFields: get('getDeclaredFields', '()[Ljava/lang/reflect/Field;'),
        isArray: get('isArray', '()Z'),
        isPrimitive: get('isPrimitive', '()Z'),
        getComponentType: get('getComponentType', '()Ljava/lang/Class;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangClass;
};

let javaLangObject = null;
Env.prototype.javaLangObject = function () {
  if (javaLangObject === null) {
    const handle = this.findClass('java/lang/Object');
    try {
      const get = this.getMethodId.bind(this, handle);
      javaLangObject = {
        toString: get('toString', '()Ljava/lang/String;'),
        getClass: get('getClass', '()Ljava/lang/Class;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangObject;
};

let javaLangReflectConstructor = null;
Env.prototype.javaLangReflectConstructor = function () {
  if (javaLangReflectConstructor === null) {
    const handle = this.findClass('java/lang/reflect/Constructor');
    try {
      javaLangReflectConstructor = {
        getGenericParameterTypes: this.getMethodId(handle, 'getGenericParameterTypes', '()[Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectConstructor;
};

let javaLangReflectMethod = null;
Env.prototype.javaLangReflectMethod = function () {
  if (javaLangReflectMethod === null) {
    const handle = this.findClass('java/lang/reflect/Method');
    try {
      const get = this.getMethodId.bind(this, handle);
      javaLangReflectMethod = {
        getName: get('getName', '()Ljava/lang/String;'),
        getGenericParameterTypes: get('getGenericParameterTypes', '()[Ljava/lang/reflect/Type;'),
        getParameterTypes: get('getParameterTypes', '()[Ljava/lang/Class;'),
        getGenericReturnType: get('getGenericReturnType', '()Ljava/lang/reflect/Type;'),
        getGenericExceptionTypes: get('getGenericExceptionTypes', '()[Ljava/lang/reflect/Type;'),
        getModifiers: get('getModifiers', '()I'),
        isVarArgs: get('isVarArgs', '()Z')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectMethod;
};

let javaLangReflectField = null;
Env.prototype.javaLangReflectField = function () {
  if (javaLangReflectField === null) {
    const handle = this.findClass('java/lang/reflect/Field');
    try {
      const get = this.getMethodId.bind(this, handle);
      javaLangReflectField = {
        getName: get('getName', '()Ljava/lang/String;'),
        getType: get('getType', '()Ljava/lang/Class;'),
        getGenericType: get('getGenericType', '()Ljava/lang/reflect/Type;'),
        getModifiers: get('getModifiers', '()I'),
        toString: get('toString', '()Ljava/lang/String;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectField;
};

let javaLangReflectTypeVariable = null;
Env.prototype.javaLangReflectTypeVariable = function () {
  if (javaLangReflectTypeVariable === null) {
    const handle = this.findClass('java/lang/reflect/TypeVariable');
    try {
      const get = this.getMethodId.bind(this, handle);
      javaLangReflectTypeVariable = {
        handle: register(this.newGlobalRef(handle)),
        getName: get('getName', '()Ljava/lang/String;'),
        getBounds: get('getBounds', '()[Ljava/lang/reflect/Type;'),
        getGenericDeclaration: get('getGenericDeclaration', '()Ljava/lang/reflect/GenericDeclaration;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectTypeVariable;
};

let javaLangReflectWildcardType = null;
Env.prototype.javaLangReflectWildcardType = function () {
  if (javaLangReflectWildcardType === null) {
    const handle = this.findClass('java/lang/reflect/WildcardType');
    try {
      const get = this.getMethodId.bind(this, handle);
      javaLangReflectWildcardType = {
        handle: register(this.newGlobalRef(handle)),
        getLowerBounds: get('getLowerBounds', '()[Ljava/lang/reflect/Type;'),
        getUpperBounds: get('getUpperBounds', '()[Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectWildcardType;
};

let javaLangReflectGenericArrayType = null;
Env.prototype.javaLangReflectGenericArrayType = function () {
  if (javaLangReflectGenericArrayType === null) {
    const handle = this.findClass('java/lang/reflect/GenericArrayType');
    try {
      javaLangReflectGenericArrayType = {
        handle: register(this.newGlobalRef(handle)),
        getGenericComponentType: this.getMethodId(handle, 'getGenericComponentType', '()Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectGenericArrayType;
};

let javaLangReflectParameterizedType = null;
Env.prototype.javaLangReflectParameterizedType = function () {
  if (javaLangReflectParameterizedType === null) {
    const handle = this.findClass('java/lang/reflect/ParameterizedType');
    try {
      const get = this.getMethodId.bind(this, handle);
      javaLangReflectParameterizedType = {
        handle: register(this.newGlobalRef(handle)),
        getActualTypeArguments: get('getActualTypeArguments', '()[Ljava/lang/reflect/Type;'),
        getRawType: get('getRawType', '()Ljava/lang/reflect/Type;'),
        getOwnerType: get('getOwnerType', '()Ljava/lang/reflect/Type;')
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangReflectParameterizedType;
};

let javaLangString = null;
Env.prototype.javaLangString = function () {
  if (javaLangString === null) {
    const handle = this.findClass('java/lang/String');
    try {
      javaLangString = {
        handle: register(this.newGlobalRef(handle))
      };
    } finally {
      this.deleteLocalRef(handle);
    }
  }
  return javaLangString;
};

Env.prototype.getClassName = function (classHandle) {
  const name = this.vaMethod('pointer', [])(this.handle, classHandle, this.javaLangClass().getName);
  try {
    return this.stringFromJni(name);
  } finally {
    this.deleteLocalRef(name);
  }
};

Env.prototype.getObjectClassName = function (objHandle) {
  const jklass = this.getObjectClass(objHandle);
  try {
    return this.getClassName(jklass);
  } finally {
    this.deleteLocalRef(jklass);
  }
};

Env.prototype.getActualTypeArgument = function (type) {
  const actualTypeArguments = this.vaMethod('pointer', [])(this.handle, type, this.javaLangReflectParameterizedType().getActualTypeArguments);
  this.throwIfExceptionPending();
  if (!actualTypeArguments.isNull()) {
    try {
      return this.getTypeNameFromFirstTypeElement(actualTypeArguments);
    } finally {
      this.deleteLocalRef(actualTypeArguments);
    }
  }
};

Env.prototype.getTypeNameFromFirstTypeElement = function (typeArray) {
  const length = this.getArrayLength(typeArray);
  if (length > 0) {
    const typeArgument0 = this.getObjectArrayElement(typeArray, 0);
    try {
      return this.getTypeName(typeArgument0);
    } finally {
      this.deleteLocalRef(typeArgument0);
    }
  } else {
    // TODO
    return 'java.lang.Object';
  }
};

Env.prototype.getTypeName = function (type, getGenericsInformation) {
  const invokeObjectMethodNoArgs = this.vaMethod('pointer', []);

  if (this.isInstanceOf(type, this.javaLangClass().handle)) {
    return this.getClassName(type);
  } else if (this.isInstanceOf(type, this.javaLangReflectGenericArrayType().handle)) {
    return this.getArrayTypeName(type);
  } else if (this.isInstanceOf(type, this.javaLangReflectParameterizedType().handle)) {
    const rawType = invokeObjectMethodNoArgs(this.handle, type, this.javaLangReflectParameterizedType().getRawType);
    this.throwIfExceptionPending();
    let result;
    try {
      result = this.getTypeName(rawType);
    } finally {
      this.deleteLocalRef(rawType);
    }

    if (getGenericsInformation) {
      result += '<' + this.getActualTypeArgument(type) + '>';
    }
    return result;
  } else if (this.isInstanceOf(type, this.javaLangReflectTypeVariable().handle)) {
    // TODO
    return 'java.lang.Object';
  } else if (this.isInstanceOf(type, this.javaLangReflectWildcardType().handle)) {
    // TODO
    return 'java.lang.Object';
  } else {
    return 'java.lang.Object';
  }
};

Env.prototype.getArrayTypeName = function (type) {
  const invokeObjectMethodNoArgs = this.vaMethod('pointer', []);

  if (this.isInstanceOf(type, this.javaLangClass().handle)) {
    return this.getClassName(type);
  } else if (this.isInstanceOf(type, this.javaLangReflectGenericArrayType().handle)) {
    const componentType = invokeObjectMethodNoArgs(this.handle, type, this.javaLangReflectGenericArrayType().getGenericComponentType);
    // check for TypeNotPresentException and MalformedParameterizedTypeException
    this.throwIfExceptionPending();
    try {
      return '[L' + this.getTypeName(componentType) + ';';
    } finally {
      this.deleteLocalRef(componentType);
    }
  } else {
    return '[Ljava.lang.Object;';
  }
};

Env.prototype.stringFromJni = function (str) {
  const utf = this.getStringChars(str);
  if (utf.isNull()) {
    throw new Error('Unable to access string');
  }
  try {
    const length = this.getStringLength(str);
    return utf.readUtf16String(length);
  } finally {
    this.releaseStringChars(str, utf);
  }
};

module.exports = Env;

},{}],10:[function(require,module,exports){
const { checkJniResult } = require('./result');

const jvmtiVersion = {
  v1_0: 0x30010000,
  v1_2: 0x30010200
};

const jvmtiCapabilities = {
  canTagObjects: 1
};

const { pointerSize } = Process;
const nativeFunctionOptions = {
  exceptions: 'propagate'
};

function EnvJvmti (handle, vm) {
  this.handle = handle;
  this.vm = vm;
  this.vtable = handle.readPointer();
}

EnvJvmti.prototype.deallocate = proxy(47, 'int32', ['pointer', 'pointer'], function (impl, mem) {
  return impl(this.handle, mem);
});

EnvJvmti.prototype.getLoadedClasses = proxy(78, 'int32', ['pointer', 'pointer', 'pointer'], function (impl, classCountPtr, classesPtr) {
  const result = impl(this.handle, classCountPtr, classesPtr);
  checkJniResult('EnvJvmti::getLoadedClasses', result);
});

EnvJvmti.prototype.iterateOverInstancesOfClass = proxy(112, 'int32', ['pointer', 'pointer', 'int', 'pointer', 'pointer'], function (impl, klass, objectFilter, heapObjectCallback, userData) {
  const result = impl(this.handle, klass, objectFilter, heapObjectCallback, userData);
  checkJniResult('EnvJvmti::iterateOverInstancesOfClass', result);
});

EnvJvmti.prototype.getObjectsWithTags = proxy(114, 'int32', ['pointer', 'int', 'pointer', 'pointer', 'pointer', 'pointer'], function (impl, tagCount, tags, countPtr, objectResultPtr, tagResultPtr) {
  const result = impl(this.handle, tagCount, tags, countPtr, objectResultPtr, tagResultPtr);
  checkJniResult('EnvJvmti::getObjectsWithTags', result);
});

EnvJvmti.prototype.addCapabilities = proxy(142, 'int32', ['pointer', 'pointer'], function (impl, capabilitiesPtr) {
  return impl(this.handle, capabilitiesPtr);
});

function proxy (offset, retType, argTypes, wrapper) {
  let impl = null;
  return function () {
    if (impl === null) {
      impl = new NativeFunction(this.vtable.add((offset - 1) * pointerSize).readPointer(), retType, argTypes, nativeFunctionOptions);
    }
    let args = [impl];
    args = args.concat.apply(args, arguments);
    return wrapper.apply(this, args);
  };
}

module.exports = {
  jvmtiVersion,
  jvmtiCapabilities,
  EnvJvmti
};

},{"./result":13}],11:[function(require,module,exports){
function parseInstructionsAt (address, tryParse, { limit }) {
  let cursor = address;
  let prevInsn = null;

  for (let i = 0; i !== limit; i++) {
    const insn = Instruction.parse(cursor);

    const value = tryParse(insn, prevInsn);
    if (value !== null) {
      return value;
    }

    cursor = insn.next;
    prevInsn = insn;
  }

  return null;
}

module.exports = {
  parseInstructionsAt
};

},{}],12:[function(require,module,exports){
function memoize (compute) {
  let value = null;
  let computed = false;

  return function (...args) {
    if (!computed) {
      value = compute(...args);
      computed = true;
    }

    return value;
  };
}

module.exports = memoize;

},{}],13:[function(require,module,exports){
const JNI_OK = 0;

function checkJniResult (name, result) {
  if (result !== JNI_OK) {
    throw new Error(name + ' failed: ' + result);
  }
}

module.exports = {
  checkJniResult,
  JNI_OK: 0
};

},{}],14:[function(require,module,exports){
const Env = require('./env');
const { JNI_OK, checkJniResult } = require('./result');

const JNI_VERSION_1_6 = 0x00010006;

const pointerSize = Process.pointerSize;

const jsThreadID = Process.getCurrentThreadId();
const attachedThreads = new Map();
const activeEnvs = new Map();

function VM (api) {
  const handle = api.vm;
  let attachCurrentThread = null;
  let detachCurrentThread = null;
  let getEnv = null;

  function initialize () {
    const vtable = handle.readPointer();
    const options = {
      exceptions: 'propagate'
    };
    attachCurrentThread = new NativeFunction(vtable.add(4 * pointerSize).readPointer(), 'int32', ['pointer', 'pointer', 'pointer'], options);
    detachCurrentThread = new NativeFunction(vtable.add(5 * pointerSize).readPointer(), 'int32', ['pointer'], options);
    getEnv = new NativeFunction(vtable.add(6 * pointerSize).readPointer(), 'int32', ['pointer', 'pointer', 'int32'], options);
  }

  this.handle = handle;

  this.perform = function (fn) {
    const threadId = Process.getCurrentThreadId();

    const cachedEnv = tryGetCachedEnv(threadId);
    if (cachedEnv !== null) {
      return fn(cachedEnv);
    }

    let env = this._tryGetEnv();
    const alreadyAttached = env !== null;
    if (!alreadyAttached) {
      env = this.attachCurrentThread();
      attachedThreads.set(threadId, true);
    }

    this.link(threadId, env);

    try {
      return fn(env);
    } finally {
      const isJsThread = threadId === jsThreadID;

      if (!isJsThread) {
        this.unlink(threadId);
      }

      if (!alreadyAttached && !isJsThread) {
        const allowedToDetach = attachedThreads.get(threadId);
        attachedThreads.delete(threadId);

        if (allowedToDetach) {
          this.detachCurrentThread();
        }
      }
    }
  };

  this.attachCurrentThread = function () {
    const envBuf = Memory.alloc(pointerSize);
    checkJniResult('VM::AttachCurrentThread', attachCurrentThread(handle, envBuf, NULL));
    return new Env(envBuf.readPointer(), this);
  };

  this.detachCurrentThread = function () {
    checkJniResult('VM::DetachCurrentThread', detachCurrentThread(handle));
  };

  this.preventDetachDueToClassLoader = function () {
    const threadId = Process.getCurrentThreadId();

    if (attachedThreads.has(threadId)) {
      attachedThreads.set(threadId, false);
    }
  };

  this.getEnv = function () {
    const cachedEnv = tryGetCachedEnv(Process.getCurrentThreadId());
    if (cachedEnv !== null) {
      return cachedEnv;
    }

    const envBuf = Memory.alloc(pointerSize);
    const result = getEnv(handle, envBuf, JNI_VERSION_1_6);
    if (result === -2) {
      throw new Error('Current thread is not attached to the Java VM; please move this code inside a Java.perform() callback');
    }
    checkJniResult('VM::GetEnv', result);
    return new Env(envBuf.readPointer(), this);
  };

  this.tryGetEnv = function () {
    const cachedEnv = tryGetCachedEnv(Process.getCurrentThreadId());
    if (cachedEnv !== null) {
      return cachedEnv;
    }

    return this._tryGetEnv();
  };

  this._tryGetEnv = function () {
    const h = this.tryGetEnvHandle(JNI_VERSION_1_6);
    if (h === null) {
      return null;
    }
    return new Env(h, this);
  };

  this.tryGetEnvHandle = function (version) {
    const envBuf = Memory.alloc(pointerSize);
    const result = getEnv(handle, envBuf, version);
    if (result !== JNI_OK) {
      return null;
    }
    return envBuf.readPointer();
  };

  this.makeHandleDestructor = function (handle) {
    return () => {
      this.perform(env => {
        env.deleteGlobalRef(handle);
      });
    };
  };

  this.link = function (tid, env) {
    const entry = activeEnvs.get(tid);
    if (entry === undefined) {
      activeEnvs.set(tid, [env, 1]);
    } else {
      entry[1]++;
    }
  };

  this.unlink = function (tid) {
    const entry = activeEnvs.get(tid);
    if (entry[1] === 1) {
      activeEnvs.delete(tid);
    } else {
      entry[1]--;
    }
  };

  function tryGetCachedEnv (threadId) {
    const entry = activeEnvs.get(threadId);
    if (entry === undefined) {
      return null;
    }
    return entry[0];
  }

  initialize.call(this);
}

VM.dispose = function (vm) {
  if (attachedThreads.get(jsThreadID) === true) {
    attachedThreads.delete(jsThreadID);
    vm.detachCurrentThread();
  }
};

module.exports = VM;

/* global Memory, NativeFunction, NULL, Process */

},{"./env":9,"./result":13}],15:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],16:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":15,"timers":16}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.call_monitor = exports.CallStalkerTest = void 0;
const stalker_monitor_1 = require("../monitor/stalker_monitor");
class CallStalkerTest extends stalker_monitor_1.StalkerMonitor {
    stalkerOptions(tinfo) {
        const tag = `${tinfo.tid} - ${tinfo.tname} >  `;
        return {
            events: {
                //   compile: true,
                // call: true,
                // block: true,
                ret: true
            },
            onReceive(rawEvents) {
                let stalkerEventFulls = Stalker.parse(rawEvents, { annotate: true, stringify: false });
                console.log(tag + "onReceive...:" + stalkerEventFulls.length);
                // call/blr instructions
                const callEvents = stalkerEventFulls.filter((even) => even[0] == "call");
                // ret 或者 bx 指令
                const retEvents = stalkerEventFulls.filter((even) => even[0] == "ret");
                // all instructions. 所有指令
                const execEvents = stalkerEventFulls.filter((even) => even[0] == "exec");
                // basic block is executed. 基础块执行  
                const blockEvents = stalkerEventFulls.filter((even) => even[0] == "block");
                // basic block is compiled. 基础块编译 与 block 不同 他会在每次重新编译后生成统一的事件
                const compileEvents = stalkerEventFulls.filter((even) => even[0] == "compile");
                // _this.include_modules(["libsvcdemo1.so"]);
            }
        };
    }
}
exports.CallStalkerTest = CallStalkerTest;
var call_monitor;
(function (call_monitor) {
    function demoRun() {
        const cst = new CallStalkerTest();
        cst.watchMain();
    }
    call_monitor.demoRun = demoRun;
})(call_monitor = exports.call_monitor || (exports.call_monitor = {}));
},{"../monitor/stalker_monitor":4}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3Npc3QvZnV6enlfbWF0Y2hfYXNzaXN0LnRzIiwiYXNzaXN0L21vZHVsZV9hc3Npc3QudHMiLCJpbmRleC50cyIsIm1vbml0b3Ivc3RhbGtlcl9tb25pdG9yLnRzIiwibmF0aXZlL2FuZHJvaWRfYXJ0LnRzIiwibmF0aXZlL3VuaXhfYW5kcm9pZC50cyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvYWxsb2MuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtamF2YS1icmlkZ2UvbGliL2FuZHJvaWQuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtamF2YS1icmlkZ2UvbGliL2Vudi5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvanZtdGkuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtamF2YS1icmlkZ2UvbGliL21hY2hpbmUtY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvbWVtb2l6ZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvcmVzdWx0LmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWphdmEtYnJpZGdlL2xpYi92bS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsInRlc3QvY2FsbF9tb25pdG9yX3Rlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7QUNBQSxJQUFpQixTQUFTLENBU3pCO0FBVEQsV0FBaUIsU0FBUztJQUV0QixTQUFnQixLQUFLLENBQUMsT0FBZSxFQUFFLE9BQWU7UUFDbEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ3JELE1BQU0sU0FBUyxHQUFHLElBQUksTUFB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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcC9KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3I3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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
