(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var e = this && this.__importDefault || function(e) {
  return e && e.__esModule ? e : {
    default: e
  };
};

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.ChalkSelector = void 0;

const t = e(require("chalk"));

class l {
  chalks=[ t.default.cyan, t.default.blue, t.default.yellow, t.default.gray, t.default.green, t.default.magenta ];
  chalks_i=0;
  getChalk() {
    this.chalks_i >= this.chalks.length && (this.chalks_i = 0);
    const e = this.chalks_i;
    this.chalks_i++;
    return this.chalks[e % this.chalks.length];
  }
}

exports.ChalkSelector = l;

},{"chalk":17}],2:[function(require,module,exports){
"use strict";

var e;

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.str_fuzzy = void 0, function(e) {
  e.match = function(e, t) {
    const r = `^${t.replaceAll("*", ".*")}$`;
    return new RegExp(r, "i").test(e);
  };
}(e = exports.str_fuzzy || (exports.str_fuzzy = {}));

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.module_help = exports.alinker = void 0;

const e = require("../native/unix_android"), t = require("./fuzzy_match_assist");

var n;

exports.alinker = new e.AndroidLinker, function(e) {
  e.watchModule = function(e) {
    exports.alinker.hook_do_dlopen(e);
  }, e.toModuleNames = function(e) {
    return e.map((e => e.name));
  }, e.nagationModules = function(e, n, r) {
    e.values().filter((e => null == n || !t.str_fuzzy.match(e.path, n))).filter((e => null == r || !t.str_fuzzy.match(e.name, r)));
    const a = e.values().filter((e => null == n || t.str_fuzzy.match(e.path, n))).filter((e => null == r || t.str_fuzzy.match(e.name, r))).map((e => e.name)).reduce(((e, t, n, r) => (e.add(t), 
    e)), new Set);
    return e.values().filter((e => !a.has(e.name)));
  };
}(n = exports.module_help || (exports.module_help = {}));

},{"../native/unix_android":15,"./fuzzy_match_assist":2}],4:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";

function e() {}

Object.defineProperty(exports, "__esModule", {
  value: !0
}), require("./main"), setImmediate(e);

}).call(this)}).call(this,require("timers").setImmediate)

},{"./main":5,"timers":34}],5:[function(require,module,exports){
(function (setImmediate){(function (){
"use strict";

var t = this && this.__importDefault || function(t) {
  return t && t.__esModule ? t : {
    default: t
  };
};

Object.defineProperty(exports, "__esModule", {
  value: !0
});

const e = t(require("chalk")), o = require("./monitor/impl/monitor_selector");

let r = null;

const n = new o.MonitorSelectors, a = {
  rpcExports: {
    jniWatch: function(t) {
      n.monitorMap.get(t)().watchJniInvoke();
    },
    pthreadCreateWatch: function(t) {
      n.monitorMap.get(t)().watchPthreadCreate();
    },
    monitor: function(t, o) {
      setImmediate((() => {
        if (console.log(e.default.bgBlackBright("luck android native watch...")), r = n.monitorMap.get(t), 
        null != r) {
          const t = r("user");
          "init_array" == o ? (console.log(e.default.green("watch init_array")), t.watchElfInit()) : "jni" == o ? (console.log(e.default.green("watch jni")), 
          t.watchJniInvoke()) : (console.log(e.default.green("watch pthread_create")), t.watchPthreadCreate());
        }
      }));
    }
  }
};

Reflect.ownKeys(a.rpcExports).forEach((t => {
  const e = Reflect.get(a.rpcExports, t);
  Reflect.set(globalThis, t, e);
})), rpc.exports = a.rpcExports;

}).call(this)}).call(this,require("timers").setImmediate)

},{"./monitor/impl/monitor_selector":8,"chalk":17,"timers":34}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.CallLevenLogger = void 0;

class e {
  events;
  backtracer;
  constructor(e, t = Backtracer.ACCURATE) {
    this.events = this.distinct(e), this.backtracer = t;
  }
  distinct(e) {
    const t = e.reduce(((e, t, r, n) => {
      const [s, o, c, i] = t, d = `${c} - ${o}`;
      return e.set(d, t), e;
    }), new Map), r = [];
    for (const e of t.values()) r.push(e);
    return r;
  }
  trapzoidLogStr(e) {
    let r = "";
    const n = [ new s(e, 0) ], o = new Set;
    for (;n.length > 0; ) {
      let e = n.pop();
      const c = DebugSymbol.fromAddress(ptr(e.node.target));
      if (r = `${r}${`${t("   ", e.depth)}|${c}`}\n`, !o.has(e.node)) {
        o.add(e.node);
        for (const t of e.node.children) n.push(new s(t, e.depth + 1));
      }
    }
    return r;
  }
  printLog(e) {
    let t;
    t = this.backtracer == Backtracer.ACCURATE ? e => e : e => {
      const t = DebugSymbol.fromAddress(ptr(e));
      if (t.name && -1 != t.name.indexOf("+")) {
        return t.name.split("+")[0];
      }
      return e;
    };
    const r = n(this.events, t);
    for (const t of r) {
      const r = this.trapzoidLogStr(t);
      console.log(e(r));
    }
  }
}

function t(e, t) {
  let r = "";
  for (let n = 0; n < t; n++) r += e;
  return r;
}

exports.CallLevenLogger = e;

class r {
  target;
  children=[];
  children_view=new Set;
  constructor(e) {
    this.target = e;
  }
  add_child(e) {
    this.children_view.has(e) || (this.children_view.add(e), this.children.push(e));
  }
}

function n(e, t) {
  const n = new Map;
  for (const s of e) {
    const [e, o, c, i] = s, d = t(c), a = t(o);
    let l = n.get(d);
    l || (l = new r(c), n.set(d, l));
    let h = n.get(a);
    h || (h = new r(o), n.set(a, h)), l.add_child(h);
  }
  const s = [];
  for (const e of n.values()) {
    let t = !1;
    for (const r of n.values()) if (r.children_view.has(e)) {
      t = !0;
      break;
    }
    t || s.push(e);
  }
  return s;
}

class s {
  node;
  depth;
  constructor(e, t) {
    this.node = e, this.depth = t;
  }
}

},{}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.CallMonitor = void 0;

const e = require("../call_event_log"), t = require("../stalker_monitor"), r = require("../../assist/chalk_selector");

class o extends t.StalkerMonitor {
  chalkSelector=new r.ChalkSelector;
  stalkerOptions(r) {
    const o = this;
    const l = `${r.tid} - ${r.tname} >  `;
    return {
      events: {
        ret: !0
      },
      onReceive(r) {
        const n = o.chalkSelector.getChalk();
        const s = Stalker.parse(r, {
          annotate: !0,
          stringify: !0
        }).filter((e => "ret" == e[0]));
        if ((a = s) && a.length > 0) {
          console.log(n("\n" + l + "-----------retEvents:" + s.length));
          const r = s.filter((e => {
            const [r, l, n, s] = e, a = t.module_map.find(ptr(l)), i = t.module_map.find(ptr(n));
            return !(!a && !i || o.isExcludeModule(a) && o.isExcludeModule(i));
          }));
          new e.CallLevenLogger(r, Backtracer.FUZZY).printLog(n);
        }
        var a;
      }
    };
  }
}

exports.CallMonitor = o;

},{"../../assist/chalk_selector":1,"../call_event_log":6,"../stalker_monitor":10}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.MonitorSelectors = void 0;

const o = require("./call_monitor"), t = require("./svc_monitor");

class r {
  monitorMap=new Map;
  addMonitor(o, t) {
    this.monitorMap.set(o, t);
  }
  constructor() {
    this.addMonitor("call", function(...t) {
      return new o.CallMonitor(...t);
    }.bind(null)), this.addMonitor("svc", function(...o) {
      return new t.SvcMonitor(...o);
    }.bind(null));
  }
}

exports.MonitorSelectors = r;

},{"./call_monitor":7,"./svc_monitor":9}],9:[function(require,module,exports){
"use strict";

var e = this && this.__importDefault || function(e) {
  return e && e.__esModule ? e : {
    default: e
  };
};

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.SvcMonitor = void 0;

const t = require("../stalker_monitor"), o = require("../../assist/chalk_selector"), n = require("../svc/signal_name_map"), l = e(require("../svc/svc_log_translation")), s = new n.SignalNameMap, r = new l.default;

class c extends t.StalkerMonitor {
  chalkSelector=new o.ChalkSelector;
  stalkerOptions(e) {
    const t = this;
    e.tid, e.tname;
    return {
      transform: function(e) {
        let o, n = t.chalkSelector.getChalk();
        for (;null != (o = e.next()); ) "svc" === o.mnemonic && e.putCallout((function(e) {
          const t = e, o = t.x8;
          a(s.getSignalName(o.toInt32()), t, n);
        })), e.keep(), "svc" === o.mnemonic && e.putCallout((function(e) {
          const t = e, o = t.x8;
          i(s.getSignalName(o.toInt32()), t, n);
        }));
      }
    };
  }
}

function a(e, t, o) {
  const n = t.lr, l = t.pc, s = DebugSymbol.fromAddress(n), c = DebugSymbol.fromAddress(l), a = r.get(e);
  console.log(o(`\n-------------------svc ${e}--------------`));
  const i = `\nlrSymbol:${s}\n\tpcSymbol:${c}`;
  console.log(o(i)), console.log(o(`\n${a?.translate_before(t)}`));
}

function i(e, t, o) {
  const n = r.get(e);
  console.log(o(`\n${e} result:${n?.translate_after(t)}`));
}

exports.SvcMonitor = c;

},{"../../assist/chalk_selector":1,"../stalker_monitor":10,"../svc/signal_name_map":11,"../svc/svc_log_translation":12}],10:[function(require,module,exports){
"use strict";

var t = this && this.__importDefault || function(t) {
  return t && t.__esModule ? t : {
    default: t
  };
};

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.StalkerMonitor = exports.unixlibc = exports.unixproc = exports.module_map = void 0;

const e = require("../native/unix_android"), r = require("../assist/module_assist"), a = require("../native/android_art"), s = require("../native/soinfo"), n = t(require("chalk"));

function o() {
  r.alinker.hook_find_libraries((t => {
    exports.module_map.update();
  }));
}

exports.module_map = new ModuleMap, exports.unixproc = new e.UnixProc, exports.unixlibc = new e.UnixLibc, 
o();

class i {
  mpath="user";
  mname="*";
  symbol="*";
  initThreadIds=[];
  mainThreadId=-1;
  traceThreads=new Map;
  tracePtrs=new Set;
  excludeModules=new Set;
  excludeArtFun=new Set;
  once=!0;
  constructor(t = "user", e = "*", r = "*") {
    this.mpath = t, this.mname = e, this.symbol = r, this.initThreads(), this.watchModule();
  }
  watchJniInvoke() {
    this.javaNativeWatch(null);
  }
  watchElfInit() {
    const t = this;
    Interceptor.attach(r.alinker.call_constructors_ptr, {
      onEnter(e) {
        const r = e[0], a = new s.SoInfo(r), n = a.init_array_ptrs(), o = a.init_ptr();
        let i = null;
        n.length > 0 && (i = exports.module_map.find(n[0])), o.compare(0) && (i = exports.module_map.find(o)), 
        i && !t.isExcludeModule(i) && (this.initm = i, t.ttrace(this.threadId));
      },
      onLeave(e) {
        this.initm && t.unttrace(this.threadId);
      }
    });
  }
  unwatch() {
    for (const t of this.traceThreads.keys()) this.unttrace(t);
  }
  unttrace(t) {
    this.traceThreads.has(t) && (this.traceThreads.delete(t), Stalker.flush(), Stalker.unfollow(t));
  }
  isExcludeModule(t) {
    if (!t) return !0;
    const e = t instanceof Module ? t.name : t;
    return this.excludeModules.has(e);
  }
  updateExclude() {
    const t = r.module_help.nagationModules(exports.module_map, this.get_library_path_prefix(), this.mname);
    r.module_help.toModuleNames(t).forEach((t => {
      this.excludeModules.add(t);
    })), u(t);
  }
  watchModule() {
    this.updateExclude(), r.module_help.watchModule((t => {
      this.updateExclude();
    }));
  }
  watchMain() {
    this.javaNativeWatch(this.mainThreadId);
  }
  javaNativeWatch(t) {
    const e = this, r = a.art.get_art_jni_dlsym_lookup_stub_ptr();
    function s(t) {
      const s = t.toString();
      if (!e.excludeArtFun.has(s)) {
        const o = new a.ArtMethod(t), i = o.jniCodePtr(), d = exports.module_map.find(i), u = !e.isExcludeModule(d), c = null != i && null != r && 0 == i.compare(r);
        if (u || c) {
          const t = o.prettyMethod();
          return console.log(n.default.red("\n" + t)), !0;
        }
        return c || e.excludeArtFun.add(s), !1;
      }
      return !1;
    }
    a.art.hook_art_quick_invoke_stub(((r, a) => {
      const n = a[0], o = r.threadId;
      !s(n) || t && o != t || e.ttrace(o);
    }), (t => {
      e.unttrace(t.threadId);
    })), a.art.hook_art_quick_invoke_static_stub(((r, a) => {
      const n = a[0], o = r.threadId;
      !s(n) || t && o != t || e.ttrace(o);
    }), (t => {
      e.unttrace(t.threadId);
    }));
  }
  watchPthreadCreate() {
    const t = this;
    Interceptor.attach(exports.unixlibc.pthread_create_ptr, {
      onEnter(e) {
        const r = e[2];
        t.isExcludeModule(exports.module_map.find(r)) ? console.log("skip art or system thread...") : t.tracePtrs.has(r) || (t.tracePtrs.add(r), 
        Interceptor.attach(r, {
          onEnter(e) {
            t.ttrace(this.threadId);
          },
          onLeave(e) {
            t.unttrace(this.threadId);
          }
        }));
      }
    });
  }
  get_library_path_prefix() {
    return "user" == this.mpath ? "/data/app/**" : null;
  }
  ttrace(t) {
    if (this.traceThreads.has(t)) return;
    const e = d(t);
    this.traceThreads.set(t, e), Stalker.follow(t, this.stalkerOptions(e));
  }
  initThreads() {
    const t = Process.enumerateThreads().map((t => t.id)), e = Process.getCurrentThreadId(), r = t[0], a = Math.min(e, r);
    let s = t;
    a != r && (s = [ a, ...s ]), this.initThreadIds = s, this.mainThreadId = a;
  }
}

function d(t) {
  return {
    tname: exports.unixproc.getThreadComm(t),
    tid: t
  };
}

function u(t) {
  t.forEach((t => {
    Stalker.exclude(t);
  }));
}

exports.StalkerMonitor = i;

},{"../assist/module_assist":3,"../native/android_art":13,"../native/soinfo":14,"../native/unix_android":15,"chalk":17}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.SignalNameMap = void 0;

class _ {
  sinal_map=new Map;
  constructor() {
    this.auto_asm_generic_unistd_map();
  }
  getSignalName(_, s = "未知") {
    const t = this.sinal_map.get(_);
    return t || s;
  }
  auto_asm_generic_unistd_map() {
    this.sinal_map.set(0, "__NR_io_setup"), this.sinal_map.set(1, "__NR_io_destroy"), 
    this.sinal_map.set(2, "__NR_io_submit"), this.sinal_map.set(3, "__NR_io_cancel"), 
    this.sinal_map.set(4, "__NR_io_getevents"), this.sinal_map.set(5, "__NR_setxattr"), 
    this.sinal_map.set(6, "__NR_lsetxattr"), this.sinal_map.set(7, "__NR_fsetxattr"), 
    this.sinal_map.set(8, "__NR_getxattr"), this.sinal_map.set(9, "__NR_lgetxattr"), 
    this.sinal_map.set(10, "__NR_fgetxattr"), this.sinal_map.set(11, "__NR_listxattr"), 
    this.sinal_map.set(12, "__NR_llistxattr"), this.sinal_map.set(13, "__NR_flistxattr"), 
    this.sinal_map.set(14, "__NR_removexattr"), this.sinal_map.set(15, "__NR_lremovexattr"), 
    this.sinal_map.set(16, "__NR_fremovexattr"), this.sinal_map.set(17, "__NR_getcwd"), 
    this.sinal_map.set(18, "__NR_lookup_dcookie"), this.sinal_map.set(19, "__NR_eventfd2"), 
    this.sinal_map.set(20, "__NR_epoll_create1"), this.sinal_map.set(21, "__NR_epoll_ctl"), 
    this.sinal_map.set(22, "__NR_epoll_pwait"), this.sinal_map.set(23, "__NR_dup"), 
    this.sinal_map.set(24, "__NR_dup3"), this.sinal_map.set(25, "__NR3264_fcntl"), this.sinal_map.set(26, "__NR_inotify_init1"), 
    this.sinal_map.set(27, "__NR_inotify_add_watch"), this.sinal_map.set(28, "__NR_inotify_rm_watch"), 
    this.sinal_map.set(29, "__NR_ioctl"), this.sinal_map.set(30, "__NR_ioprio_set"), 
    this.sinal_map.set(31, "__NR_ioprio_get"), this.sinal_map.set(32, "__NR_flock"), 
    this.sinal_map.set(33, "__NR_mknodat"), this.sinal_map.set(34, "__NR_mkdirat"), 
    this.sinal_map.set(35, "__NR_unlinkat"), this.sinal_map.set(36, "__NR_symlinkat"), 
    this.sinal_map.set(37, "__NR_linkat"), this.sinal_map.set(38, "__NR_renameat"), 
    this.sinal_map.set(39, "__NR_umount2"), this.sinal_map.set(40, "__NR_mount"), this.sinal_map.set(41, "__NR_pivot_root"), 
    this.sinal_map.set(42, "__NR_nfsservctl"), this.sinal_map.set(43, "__NR3264_statfs"), 
    this.sinal_map.set(44, "__NR3264_fstatfs"), this.sinal_map.set(45, "__NR3264_truncate"), 
    this.sinal_map.set(46, "__NR3264_ftruncate"), this.sinal_map.set(47, "__NR_fallocate"), 
    this.sinal_map.set(48, "__NR_faccessat"), this.sinal_map.set(49, "__NR_chdir"), 
    this.sinal_map.set(50, "__NR_fchdir"), this.sinal_map.set(51, "__NR_chroot"), this.sinal_map.set(52, "__NR_fchmod"), 
    this.sinal_map.set(53, "__NR_fchmodat"), this.sinal_map.set(54, "__NR_fchownat"), 
    this.sinal_map.set(55, "__NR_fchown"), this.sinal_map.set(56, "__NR_openat"), this.sinal_map.set(57, "__NR_close"), 
    this.sinal_map.set(58, "__NR_vhangup"), this.sinal_map.set(59, "__NR_pipe2"), this.sinal_map.set(60, "__NR_quotactl"), 
    this.sinal_map.set(61, "__NR_getdents64"), this.sinal_map.set(62, "__NR3264_lseek"), 
    this.sinal_map.set(63, "__NR_read"), this.sinal_map.set(64, "__NR_write"), this.sinal_map.set(65, "__NR_readv"), 
    this.sinal_map.set(66, "__NR_writev"), this.sinal_map.set(67, "__NR_pread64"), this.sinal_map.set(68, "__NR_pwrite64"), 
    this.sinal_map.set(69, "__NR_preadv"), this.sinal_map.set(70, "__NR_pwritev"), this.sinal_map.set(71, "__NR3264_sendfile"), 
    this.sinal_map.set(72, "__NR_pselect6"), this.sinal_map.set(73, "__NR_ppoll"), this.sinal_map.set(74, "__NR_signalfd4"), 
    this.sinal_map.set(75, "__NR_vmsplice"), this.sinal_map.set(76, "__NR_splice"), 
    this.sinal_map.set(77, "__NR_tee"), this.sinal_map.set(78, "__NR_readlinkat"), this.sinal_map.set(79, "__NR3264_fstatat"), 
    this.sinal_map.set(80, "__NR3264_fstat"), this.sinal_map.set(81, "__NR_sync"), this.sinal_map.set(82, "__NR_fsync"), 
    this.sinal_map.set(83, "__NR_fdatasync"), this.sinal_map.set(84, "__NR_sync_file_range2"), 
    this.sinal_map.set(84, "__NR_sync_file_range"), this.sinal_map.set(85, "__NR_timerfd_create"), 
    this.sinal_map.set(86, "__NR_timerfd_settime"), this.sinal_map.set(87, "__NR_timerfd_gettime"), 
    this.sinal_map.set(88, "__NR_utimensat"), this.sinal_map.set(89, "__NR_acct"), this.sinal_map.set(90, "__NR_capget"), 
    this.sinal_map.set(91, "__NR_capset"), this.sinal_map.set(92, "__NR_personality"), 
    this.sinal_map.set(93, "__NR_exit"), this.sinal_map.set(94, "__NR_exit_group"), 
    this.sinal_map.set(95, "__NR_waitid"), this.sinal_map.set(96, "__NR_set_tid_address"), 
    this.sinal_map.set(97, "__NR_unshare"), this.sinal_map.set(98, "__NR_futex"), this.sinal_map.set(99, "__NR_set_robust_list"), 
    this.sinal_map.set(100, "__NR_get_robust_list"), this.sinal_map.set(101, "__NR_nanosleep"), 
    this.sinal_map.set(102, "__NR_getitimer"), this.sinal_map.set(103, "__NR_setitimer"), 
    this.sinal_map.set(104, "__NR_kexec_load"), this.sinal_map.set(105, "__NR_init_module"), 
    this.sinal_map.set(106, "__NR_delete_module"), this.sinal_map.set(107, "__NR_timer_create"), 
    this.sinal_map.set(108, "__NR_timer_gettime"), this.sinal_map.set(109, "__NR_timer_getoverrun"), 
    this.sinal_map.set(110, "__NR_timer_settime"), this.sinal_map.set(111, "__NR_timer_delete"), 
    this.sinal_map.set(112, "__NR_clock_settime"), this.sinal_map.set(113, "__NR_clock_gettime"), 
    this.sinal_map.set(114, "__NR_clock_getres"), this.sinal_map.set(115, "__NR_clock_nanosleep"), 
    this.sinal_map.set(116, "__NR_syslog"), this.sinal_map.set(117, "__NR_ptrace"), 
    this.sinal_map.set(118, "__NR_sched_setparam"), this.sinal_map.set(119, "__NR_sched_setscheduler"), 
    this.sinal_map.set(120, "__NR_sched_getscheduler"), this.sinal_map.set(121, "__NR_sched_getparam"), 
    this.sinal_map.set(122, "__NR_sched_setaffinity"), this.sinal_map.set(123, "__NR_sched_getaffinity"), 
    this.sinal_map.set(124, "__NR_sched_yield"), this.sinal_map.set(125, "__NR_sched_get_priority_max"), 
    this.sinal_map.set(126, "__NR_sched_get_priority_min"), this.sinal_map.set(127, "__NR_sched_rr_get_interval"), 
    this.sinal_map.set(128, "__NR_restart_syscall"), this.sinal_map.set(129, "__NR_kill"), 
    this.sinal_map.set(130, "__NR_tkill"), this.sinal_map.set(131, "__NR_tgkill"), this.sinal_map.set(132, "__NR_sigaltstack"), 
    this.sinal_map.set(133, "__NR_rt_sigsuspend"), this.sinal_map.set(134, "__NR_rt_sigaction"), 
    this.sinal_map.set(135, "__NR_rt_sigprocmask"), this.sinal_map.set(136, "__NR_rt_sigpending"), 
    this.sinal_map.set(137, "__NR_rt_sigtimedwait"), this.sinal_map.set(138, "__NR_rt_sigqueueinfo"), 
    this.sinal_map.set(139, "__NR_rt_sigreturn"), this.sinal_map.set(140, "__NR_setpriority"), 
    this.sinal_map.set(141, "__NR_getpriority"), this.sinal_map.set(142, "__NR_reboot"), 
    this.sinal_map.set(143, "__NR_setregid"), this.sinal_map.set(144, "__NR_setgid"), 
    this.sinal_map.set(145, "__NR_setreuid"), this.sinal_map.set(146, "__NR_setuid"), 
    this.sinal_map.set(147, "__NR_setresuid"), this.sinal_map.set(148, "__NR_getresuid"), 
    this.sinal_map.set(149, "__NR_setresgid"), this.sinal_map.set(150, "__NR_getresgid"), 
    this.sinal_map.set(151, "__NR_setfsuid"), this.sinal_map.set(152, "__NR_setfsgid"), 
    this.sinal_map.set(153, "__NR_times"), this.sinal_map.set(154, "__NR_setpgid"), 
    this.sinal_map.set(155, "__NR_getpgid"), this.sinal_map.set(156, "__NR_getsid"), 
    this.sinal_map.set(157, "__NR_setsid"), this.sinal_map.set(158, "__NR_getgroups"), 
    this.sinal_map.set(159, "__NR_setgroups"), this.sinal_map.set(160, "__NR_uname"), 
    this.sinal_map.set(161, "__NR_sethostname"), this.sinal_map.set(162, "__NR_setdomainname"), 
    this.sinal_map.set(163, "__NR_getrlimit"), this.sinal_map.set(164, "__NR_setrlimit"), 
    this.sinal_map.set(165, "__NR_getrusage"), this.sinal_map.set(166, "__NR_umask"), 
    this.sinal_map.set(167, "__NR_prctl"), this.sinal_map.set(168, "__NR_getcpu"), this.sinal_map.set(169, "__NR_gettimeofday"), 
    this.sinal_map.set(170, "__NR_settimeofday"), this.sinal_map.set(171, "__NR_adjtimex"), 
    this.sinal_map.set(172, "__NR_getpid"), this.sinal_map.set(173, "__NR_getppid"), 
    this.sinal_map.set(174, "__NR_getuid"), this.sinal_map.set(175, "__NR_geteuid"), 
    this.sinal_map.set(176, "__NR_getgid"), this.sinal_map.set(177, "__NR_getegid"), 
    this.sinal_map.set(178, "__NR_gettid"), this.sinal_map.set(179, "__NR_sysinfo"), 
    this.sinal_map.set(180, "__NR_mq_open"), this.sinal_map.set(181, "__NR_mq_unlink"), 
    this.sinal_map.set(182, "__NR_mq_timedsend"), this.sinal_map.set(183, "__NR_mq_timedreceive"), 
    this.sinal_map.set(184, "__NR_mq_notify"), this.sinal_map.set(185, "__NR_mq_getsetattr"), 
    this.sinal_map.set(186, "__NR_msgget"), this.sinal_map.set(187, "__NR_msgctl"), 
    this.sinal_map.set(188, "__NR_msgrcv"), this.sinal_map.set(189, "__NR_msgsnd"), 
    this.sinal_map.set(190, "__NR_semget"), this.sinal_map.set(191, "__NR_semctl"), 
    this.sinal_map.set(192, "__NR_semtimedop"), this.sinal_map.set(193, "__NR_semop"), 
    this.sinal_map.set(194, "__NR_shmget"), this.sinal_map.set(195, "__NR_shmctl"), 
    this.sinal_map.set(196, "__NR_shmat"), this.sinal_map.set(197, "__NR_shmdt"), this.sinal_map.set(198, "__NR_socket"), 
    this.sinal_map.set(199, "__NR_socketpair"), this.sinal_map.set(200, "__NR_bind"), 
    this.sinal_map.set(201, "__NR_listen"), this.sinal_map.set(202, "__NR_accept"), 
    this.sinal_map.set(203, "__NR_connect"), this.sinal_map.set(204, "__NR_getsockname"), 
    this.sinal_map.set(205, "__NR_getpeername"), this.sinal_map.set(206, "__NR_sendto"), 
    this.sinal_map.set(207, "__NR_recvfrom"), this.sinal_map.set(208, "__NR_setsockopt"), 
    this.sinal_map.set(209, "__NR_getsockopt"), this.sinal_map.set(210, "__NR_shutdown"), 
    this.sinal_map.set(211, "__NR_sendmsg"), this.sinal_map.set(212, "__NR_recvmsg"), 
    this.sinal_map.set(213, "__NR_readahead"), this.sinal_map.set(214, "__NR_brk"), 
    this.sinal_map.set(215, "__NR_munmap"), this.sinal_map.set(216, "__NR_mremap"), 
    this.sinal_map.set(217, "__NR_add_key"), this.sinal_map.set(218, "__NR_request_key"), 
    this.sinal_map.set(219, "__NR_keyctl"), this.sinal_map.set(220, "__NR_clone"), this.sinal_map.set(221, "__NR_execve"), 
    this.sinal_map.set(222, "__NR3264_mmap"), this.sinal_map.set(223, "__NR3264_fadvise64"), 
    this.sinal_map.set(224, "__NR_swapon"), this.sinal_map.set(225, "__NR_swapoff"), 
    this.sinal_map.set(226, "__NR_mprotect"), this.sinal_map.set(227, "__NR_msync"), 
    this.sinal_map.set(228, "__NR_mlock"), this.sinal_map.set(229, "__NR_munlock"), 
    this.sinal_map.set(230, "__NR_mlockall"), this.sinal_map.set(231, "__NR_munlockall"), 
    this.sinal_map.set(232, "__NR_mincore"), this.sinal_map.set(233, "__NR_madvise"), 
    this.sinal_map.set(234, "__NR_remap_file_pages"), this.sinal_map.set(235, "__NR_mbind"), 
    this.sinal_map.set(236, "__NR_get_mempolicy"), this.sinal_map.set(237, "__NR_set_mempolicy"), 
    this.sinal_map.set(238, "__NR_migrate_pages"), this.sinal_map.set(239, "__NR_move_pages"), 
    this.sinal_map.set(240, "__NR_rt_tgsigqueueinfo"), this.sinal_map.set(241, "__NR_perf_event_open"), 
    this.sinal_map.set(242, "__NR_accept4"), this.sinal_map.set(243, "__NR_recvmmsg"), 
    this.sinal_map.set(244, "__NR_arch_specific_syscall"), this.sinal_map.set(260, "__NR_wait4"), 
    this.sinal_map.set(261, "__NR_prlimit64"), this.sinal_map.set(262, "__NR_fanotify_init"), 
    this.sinal_map.set(263, "__NR_fanotify_mark"), this.sinal_map.set(264, "__NR_name_to_handle_at"), 
    this.sinal_map.set(265, "__NR_open_by_handle_at"), this.sinal_map.set(266, "__NR_clock_adjtime"), 
    this.sinal_map.set(267, "__NR_syncfs"), this.sinal_map.set(268, "__NR_setns"), this.sinal_map.set(269, "__NR_sendmmsg"), 
    this.sinal_map.set(270, "__NR_process_vm_readv"), this.sinal_map.set(271, "__NR_process_vm_writev"), 
    this.sinal_map.set(272, "__NR_kcmp"), this.sinal_map.set(273, "__NR_finit_module"), 
    this.sinal_map.set(274, "__NR_sched_setattr"), this.sinal_map.set(275, "__NR_sched_getattr"), 
    this.sinal_map.set(276, "__NR_renameat2"), this.sinal_map.set(277, "__NR_seccomp"), 
    this.sinal_map.set(278, "__NR_getrandom"), this.sinal_map.set(279, "__NR_memfd_create"), 
    this.sinal_map.set(280, "__NR_bpf"), this.sinal_map.set(281, "__NR_execveat"), this.sinal_map.set(282, "__NR_userfaultfd"), 
    this.sinal_map.set(283, "__NR_membarrier"), this.sinal_map.set(284, "__NR_mlock2"), 
    this.sinal_map.set(285, "__NR_copy_file_range"), this.sinal_map.set(286, "__NR_preadv2"), 
    this.sinal_map.set(287, "__NR_pwritev2"), this.sinal_map.set(288, "__NR_pkey_mprotect"), 
    this.sinal_map.set(289, "__NR_pkey_alloc"), this.sinal_map.set(290, "__NR_pkey_free"), 
    this.sinal_map.set(291, "__NR_statx"), this.sinal_map.set(292, "__NR_io_pgetevents"), 
    this.sinal_map.set(293, "__NR_rseq"), this.sinal_map.set(294, "__NR_kexec_file_load"), 
    this.sinal_map.set(403, "__NR_clock_gettime64"), this.sinal_map.set(404, "__NR_clock_settime64"), 
    this.sinal_map.set(405, "__NR_clock_adjtime64"), this.sinal_map.set(406, "__NR_clock_getres_time64"), 
    this.sinal_map.set(407, "__NR_clock_nanosleep_time64"), this.sinal_map.set(408, "__NR_timer_gettime64"), 
    this.sinal_map.set(409, "__NR_timer_settime64"), this.sinal_map.set(410, "__NR_timerfd_gettime64"), 
    this.sinal_map.set(411, "__NR_timerfd_settime64"), this.sinal_map.set(412, "__NR_utimensat_time64"), 
    this.sinal_map.set(413, "__NR_pselect6_time64"), this.sinal_map.set(414, "__NR_ppoll_time64"), 
    this.sinal_map.set(416, "__NR_io_pgetevents_time64"), this.sinal_map.set(417, "__NR_recvmmsg_time64"), 
    this.sinal_map.set(418, "__NR_mq_timedsend_time64"), this.sinal_map.set(419, "__NR_mq_timedreceive_time64"), 
    this.sinal_map.set(420, "__NR_semtimedop_time64"), this.sinal_map.set(421, "__NR_rt_sigtimedwait_time64"), 
    this.sinal_map.set(422, "__NR_futex_time64"), this.sinal_map.set(423, "__NR_sched_rr_get_interval_time64"), 
    this.sinal_map.set(424, "__NR_pidfd_send_signal"), this.sinal_map.set(425, "__NR_io_uring_setup"), 
    this.sinal_map.set(426, "__NR_io_uring_enter"), this.sinal_map.set(427, "__NR_io_uring_register"), 
    this.sinal_map.set(428, "__NR_open_tree"), this.sinal_map.set(429, "__NR_move_mount"), 
    this.sinal_map.set(430, "__NR_fsopen"), this.sinal_map.set(431, "__NR_fsconfig"), 
    this.sinal_map.set(432, "__NR_fsmount"), this.sinal_map.set(433, "__NR_fspick"), 
    this.sinal_map.set(434, "__NR_pidfd_open"), this.sinal_map.set(435, "__NR_clone3"), 
    this.sinal_map.set(436, "__NR_close_range"), this.sinal_map.set(437, "__NR_openat2"), 
    this.sinal_map.set(438, "__NR_pidfd_getfd"), this.sinal_map.set(439, "__NR_faccessat2"), 
    this.sinal_map.set(440, "__NR_process_madvise"), this.sinal_map.set(441, "__NR_epoll_pwait2"), 
    this.sinal_map.set(442, "__NR_mount_setattr"), this.sinal_map.set(443, "__NR_quotactl_fd"), 
    this.sinal_map.set(444, "__NR_landlock_create_ruleset"), this.sinal_map.set(445, "__NR_landlock_add_rule"), 
    this.sinal_map.set(446, "__NR_landlock_restrict_self"), this.sinal_map.set(447, "__NR_memfd_secret"), 
    this.sinal_map.set(448, "__NR_process_mrelease"), this.sinal_map.set(449, "__NR_futex_waitv"), 
    this.sinal_map.set(450, "__NR_set_mempolicy_home_node"), this.sinal_map.set(451, "__NR_syscalls");
  }
}

exports.SignalNameMap = _;

},{}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
});

const t = require("../../native/unix_android");

class e {
  support() {
    return "";
  }
  translate_before(t) {
    const e = {
      x0: t.x0,
      x1: t.x1,
      x2: t.x2,
      x3: t.x3,
      x4: t.x4,
      x5: t.x5,
      x6: t.x6,
      x7: t.x7,
      x8: t.x8
    };
    return JSON.stringify(e);
  }
  translate_after(t) {
    return t.x0.toString();
  }
}

class r extends e {}

const s = new t.UnixProc;

class n extends e {
  support() {
    return "__NR_openat";
  }
  translate_before(t) {
    const e = {
      fd: t.x0,
      pathname: t.x1.readCString(),
      flags: t.x2,
      model: t.x3
    };
    return JSON.stringify(e);
  }
  translate_after(t) {
    const e = t.x0.toInt32();
    return s.get_linker_fd_path(e);
  }
}

class a extends e {
  support() {
    return "__NR_openat2";
  }
  translate_before(t) {
    const e = {
      fd: t.x0,
      pathname: t.x1.readCString(),
      flags: t.x2,
      model: t.x3
    };
    return JSON.stringify(e);
  }
  translate_after(t) {
    const e = t.x0.toInt32();
    return s.get_linker_fd_path(e);
  }
}

class x extends e {
  support() {
    return "__NR_faccessat";
  }
  translate_before(t) {
    const e = t.x0, r = t.x1.readCString(), s = t.x2, n = {
      fd: e,
      pathname: r,
      flags: t.x3,
      model: s
    };
    return JSON.stringify(n);
  }
}

class o extends e {
  support() {
    return "__NR_faccessat2";
  }
  translate_before(t) {
    const e = t.x0, r = t.x1.readCString(), s = t.x2, n = {
      fd: e,
      pathname: r,
      flags: t.x3,
      model: s
    };
    return JSON.stringify(n);
  }
}

class d extends e {
  support() {
    return "__NR3264_fstatat";
  }
  translate_before(t) {
    const e = {
      fd: t.x0,
      pathname: t.x1.readCString(),
      flags: t.x3
    };
    return JSON.stringify(e);
  }
}

class _ extends e {
  support() {
    return "__NR_read";
  }
  translate_before(t) {
    const e = t.x0.toInt32(), r = {
      fd_path: s.get_linker_fd_path(e)
    };
    return JSON.stringify(r);
  }
}

class i extends e {
  support() {
    return "__NR3264_mmap";
  }
  translate_before(t) {
    const e = t.x0, r = t.x1, n = t.x2, a = t.x3, x = t.x4, o = t.x5, d = s.get_linker_fd_path(x.toInt32()), _ = {
      addr: e,
      length: r,
      prot: n,
      flags: a,
      fd: x,
      offset: o,
      fd_path: d
    };
    return JSON.stringify(_);
  }
}

class f {
  translations=new Map;
  constructor() {
    this.add(new r), this.add(new n), this.add(new a), this.add(new x), this.add(new o), 
    this.add(new _), this.add(new d), this.add(new i);
  }
  add(t) {
    const e = t.support();
    this.translations.set(e, t);
  }
  get(t) {
    const e = this.translations.get(t);
    return e || this.translations.get("");
  }
}

exports.default = f;

},{"../../native/unix_android":15}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.ArtMethod = exports.art = void 0;

const t = require("frida-java-bridge/lib/android");

var e;

!function(e) {
  function r(t, r, s) {
    const o = e.artso.enumerateSymbols().filter((e => e.name === t))[0].address;
    Interceptor.attach(o, {
      onEnter(t) {
        r(this, t);
      },
      onLeave(t) {
        s(this);
      }
    });
  }
  function s() {
    return t.getArtMethodSpec(Java.vm);
  }
  e.kAccNative = 256, e.artso = Process.findModuleByName("libart.so"), e._ArtMethodSpec = s(), 
  e.hook_art_quick_invoke_stub = function(t, e) {
    r("art_quick_invoke_stub", t, e);
  }, e.hook_art_quick_invoke_static_stub = function(t, e) {
    r("art_quick_invoke_static_stub", t, e);
  }, e.get_art_jni_dlsym_lookup_stub_ptr = function() {
    const t = e.artso.enumerateSymbols().filter((t => "art_jni_dlsym_lookup_stub" == t.name));
    return t.length > 0 ? t[0].address : null;
  }, e.getArtMethodSpec = s;
}(e = exports.art || (exports.art = {}));

class r {
  handle;
  constructor(t) {
    this.handle = t;
  }
  prettyMethod(e = !0) {
    const r = new n;
    return t.getApi()["art::ArtMethod::PrettyMethod"](r, this.handle, e ? 1 : 0), r.disposeToString();
  }
  accessFlags() {
    const t = e._ArtMethodSpec;
    return this.handle.add(t.offset.accessFlags).readU32();
  }
  isNative() {
    return 0 != (this.accessFlags() & e.kAccNative);
  }
  jniCodePtr() {
    const t = e._ArtMethodSpec;
    return this.handle.add(t.offset.jniCode).readPointer();
  }
}

exports.ArtMethod = r;

const s = Process.pointerSize, o = 3 * s;

class n {
  handle;
  constructor() {
    this.handle = Memory.alloc(o);
  }
  dispose() {
    const [e, r] = this._getData();
    r || t.getApi().$delete(e);
  }
  disposeToString() {
    const t = this.toString();
    return this.dispose(), t;
  }
  toString() {
    const [t] = this._getData();
    return t.readUtf8String();
  }
  _getData() {
    const t = this.handle, e = 0 == (1 & t.readU8());
    return [ e ? t.add(1) : t.add(2 * s).readPointer(), e ];
  }
}

},{"frida-java-bridge/lib/android":26}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.SoInfo = exports.somodule = void 0, exports.somodule = new CModule("\n#include <stddef.h>\n#include <stdint.h>\n\ntypedef size_t gsize;\ntypedef void * gpointer;\ntypedef uint32_t guint32;\ntypedef char gchar;\n\ntypedef struct _GumSoinfo GumSoinfo;\n\nstruct _GumSoinfo\n{\n\n\n  gpointer phdr;\n  gsize phnum;\n\n  gpointer base;\n  gsize size;\n\n\n\n  gpointer dynamic;\n\n\n\n  gpointer next;\n\n  uint32_t flags;\n\n  const gchar * strtab;\n  gpointer symtab;\n\n  gsize nbucket;\n  gsize nchain;\n  guint32 * bucket;\n  guint32 * chain;\n\n\n\n  gpointer plt_relx;\n  gsize plt_relx_count;\n\n  gpointer relx;\n  gsize relx_count;\n\n  gpointer * preinit_array;\n  gsize preinit_array_count;\n\n  gpointer * init_array;\n  gsize init_array_count;\n  gpointer * fini_array;\n  gsize fini_array_count;\n\n  gpointer init_func;\n  gpointer fini_func;\n};\n\nsize_t get_init_array_offset(){\n    return offsetof(GumSoinfo,init_array);\n} \nsize_t get_init_offset(){\n    return offsetof(GumSoinfo,init_func);\n} \nvoid* get_init_array(GumSoinfo* gsi){\n    return gsi->init_array;\n}\nint get_init_array_count(GumSoinfo* gsi){\n    return gsi->init_array_count;\n}\nvoid* get_init_func(GumSoinfo* gsi){\n    return gsi->init_func;\n}\n");

const n = new NativeFunction(exports.somodule.get_init_func, "pointer", [ "pointer" ]), t = new NativeFunction(exports.somodule.get_init_array_count, "int", [ "pointer" ]), i = new NativeFunction(exports.somodule.get_init_array, "pointer", [ "pointer" ]);

class e {
  handle;
  constructor(n) {
    this.handle = n;
  }
  init_array_ptrs() {
    const n = [], e = Process.pointerSize, r = t(this.handle), o = i(this.handle);
    for (let t = 0; t < r; t += e) n.push(o.add(t).readPointer());
    return n;
  }
  init_ptr() {
    return n(this.handle);
  }
}

exports.SoInfo = e;

},{}],15:[function(require,module,exports){
"use strict";

var t;

Object.defineProperty(exports, "__esModule", {
  value: !0
}), exports.AndroidLinker = exports.UnixLibc = exports.UnixProc = exports.unix = void 0, 
function(t) {
  let e, n;
  !function(t) {
    t[t.O_ACCMODE = 3] = "O_ACCMODE", t[t.O_RDONLY = 0] = "O_RDONLY", t[t.O_WRONLY = 1] = "O_WRONLY", 
    t[t.O_RDWR = 2] = "O_RDWR", t[t.O_CREAT = 64] = "O_CREAT", t[t.O_EXCL = 128] = "O_EXCL";
  }(e = t.fcntl || (t.fcntl = {})), function(t) {
    t[t.AT_FDCWD = -100] = "AT_FDCWD", t[t.AT_SYMLINK_NOFOLLOW = 256] = "AT_SYMLINK_NOFOLLOW", 
    t[t.AT_EACCESS = 512] = "AT_EACCESS", t[t.AT_REMOVEDIR = 512] = "AT_REMOVEDIR", 
    t[t.AT_SYMLINK_FOLLOW = 1024] = "AT_SYMLINK_FOLLOW", t[t.AT_NO_AUTOMOUNT = 2048] = "AT_NO_AUTOMOUNT", 
    t[t.AT_EMPTY_PATH = 4096] = "AT_EMPTY_PATH";
  }(n = t.linux_fcntl || (t.linux_fcntl = {}));
}(t = exports.unix || (exports.unix = {}));

class e {
  cmdline_path="/proc/self/cmdline";
  comm_path="/proc/self/task/%s/comm";
  libc;
  constructor() {
    this.libc = new n;
  }
  getThreadComm(e) {
    let n = this.comm_path.replace("%s", e.toString()), i = this.libc.open(n, t.fcntl.O_RDONLY);
    const r = this.libc.readStr(i).replace("\n", "");
    return this.libc.closeFun(i), r;
  }
  get_cmdline() {
    let e = this.libc.openat(t.linux_fcntl.AT_FDCWD, this.cmdline_path, t.fcntl.O_RDONLY, 0);
    const n = this.libc.readStr(e);
    return this.libc.closeFun(e), n;
  }
  get_linker_fd_path(e) {
    if (e > 0) {
      return this.libc.readlink(t.linux_fcntl.AT_FDCWD, e);
    }
    return "";
  }
}

exports.UnixProc = e;

class n {
  openFun;
  systemFun;
  readFun;
  closeFun;
  openatFun;
  dlopenFun;
  sleepFun;
  readlinkat;
  dlopen_ext_ptr;
  pthread_create_ptr;
  constructor() {
    const t = Module.findExportByName("libc.so", "open"), e = Module.findExportByName("libc.so", "openat"), n = Module.findExportByName("libc.so", "system"), i = Module.findExportByName("libc.so", "read"), r = Module.findExportByName("libc.so", "close"), o = Module.findExportByName("libc.so", "dlopen"), s = Module.findExportByName("libc.so", "sleep"), l = Module.findExportByName("libc.so", "readlinkat");
    this.pthread_create_ptr = Module.findExportByName("libc.so", "pthread_create"), 
    this.dlopen_ext_ptr = Module.findExportByName("libc.so", "android_dlopen_ext"), 
    this.openFun = new NativeFunction(t, "int", [ "pointer", "int" ]), this.openatFun = new NativeFunction(e, "int", [ "int", "pointer", "int", "int" ]), 
    this.systemFun = new NativeFunction(n, "int", [ "pointer" ]), this.readFun = new NativeFunction(i, "int", [ "int", "pointer", "int" ]), 
    this.closeFun = new NativeFunction(r, "int", [ "int" ]), this.dlopenFun = new NativeFunction(o, "void", [ "pointer", "int" ]), 
    this.sleepFun = new NativeFunction(s, "int", [ "uint" ]), this.readlinkat = new NativeFunction(l, "int", [ "int", "pointer", "pointer", "int" ]);
  }
  open(t, e) {
    return this.openFun(Memory.allocUtf8String(t), e);
  }
  openat(t, e, n, i) {
    return this.openatFun(t, Memory.allocUtf8String(e), n, i);
  }
  sleep(t) {
    return this.sleepFun(t);
  }
  readlink(t, e, n = 512) {
    const i = `/proc/self/fd/${e}`, r = Memory.allocUtf8String(i), o = Memory.alloc(n);
    return this.readlinkat(t, r, o, n), o.readCString();
  }
  readStr(t, e = 512) {
    const n = Memory.alloc(e);
    return -1 == this.readFun(t, n, e) ? "" : n.readCString();
  }
}

exports.UnixLibc = n;

class i {
  do_dlopen_ptr;
  call_array_ptr;
  call_constructors_ptr;
  find_libraries;
  constructor() {
    const t = Process.findModuleByName("linker64"), e = t?.enumerateSymbols();
    this.do_dlopen_ptr = e.filter((t => -1 != t.name.indexOf("dlopen_ext")))[0].address, 
    this.call_array_ptr = e.filter((t => -1 != t.name.indexOf("call_array")))[0].address, 
    this.call_constructors_ptr = e.filter((t => -1 != t.name.indexOf("call_constructors")))[0].address, 
    this.find_libraries = e.filter((t => -1 != t.name.indexOf("find_libraries")))[0].address;
  }
  hook_do_dlopen(t) {
    Interceptor.attach(this.do_dlopen_ptr, {
      onEnter(t) {
        this.path = t[0].readCString();
      },
      onLeave(e) {
        t(this.path);
      }
    });
  }
  hook_find_libraries(t) {
    Interceptor.attach(this.find_libraries, {
      onEnter(t) {
        const e = t[2], n = t[3].toInt32();
        this.firstLibPath = "", n > 0 && (this.firstLibPath = e.readPointer().readCString());
      },
      onLeave(e) {
        t(this.firstLibPath);
      }
    });
  }
}

exports.AndroidLinker = i;

},{}],16:[function(require,module,exports){
"use strict";

const e = (e, r) => (...o) => `[${e(...o) + r}m`, r = (e, r) => (...o) => {
  const t = e(...o);
  return `[${38 + r};5;${t}m`;
}, o = (e, r) => (...o) => {
  const t = e(...o);
  return `[${38 + r};2;${t[0]};${t[1]};${t[2]}m`;
}, t = e => e, g = (e, r, o) => [ e, r, o ], n = (e, r, o) => {
  Object.defineProperty(e, r, {
    get: () => {
      const t = o();
      return Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0
      }), t;
    },
    enumerable: !0,
    configurable: !0
  });
};

let i;

const l = (e, r, o, t) => {
  void 0 === i && (i = require("color-convert"));
  const g = t ? 10 : 0, n = {};
  for (const [t, l] of Object.entries(i)) {
    const i = "ansi16" === t ? "ansi" : t;
    t === r ? n[i] = e(o, g) : "object" == typeof l && (n[i] = e(l[r], g));
  }
  return n;
};

function b() {
  const i = new Map, b = {
    modifier: {
      reset: [ 0, 0 ],
      bold: [ 1, 22 ],
      dim: [ 2, 22 ],
      italic: [ 3, 23 ],
      underline: [ 4, 24 ],
      inverse: [ 7, 27 ],
      hidden: [ 8, 28 ],
      strikethrough: [ 9, 29 ]
    },
    color: {
      black: [ 30, 39 ],
      red: [ 31, 39 ],
      green: [ 32, 39 ],
      yellow: [ 33, 39 ],
      blue: [ 34, 39 ],
      magenta: [ 35, 39 ],
      cyan: [ 36, 39 ],
      white: [ 37, 39 ],
      blackBright: [ 90, 39 ],
      redBright: [ 91, 39 ],
      greenBright: [ 92, 39 ],
      yellowBright: [ 93, 39 ],
      blueBright: [ 94, 39 ],
      magentaBright: [ 95, 39 ],
      cyanBright: [ 96, 39 ],
      whiteBright: [ 97, 39 ]
    },
    bgColor: {
      bgBlack: [ 40, 49 ],
      bgRed: [ 41, 49 ],
      bgGreen: [ 42, 49 ],
      bgYellow: [ 43, 49 ],
      bgBlue: [ 44, 49 ],
      bgMagenta: [ 45, 49 ],
      bgCyan: [ 46, 49 ],
      bgWhite: [ 47, 49 ],
      bgBlackBright: [ 100, 49 ],
      bgRedBright: [ 101, 49 ],
      bgGreenBright: [ 102, 49 ],
      bgYellowBright: [ 103, 49 ],
      bgBlueBright: [ 104, 49 ],
      bgMagentaBright: [ 105, 49 ],
      bgCyanBright: [ 106, 49 ],
      bgWhiteBright: [ 107, 49 ]
    }
  };
  b.color.gray = b.color.blackBright, b.bgColor.bgGray = b.bgColor.bgBlackBright, 
  b.color.grey = b.color.blackBright, b.bgColor.bgGrey = b.bgColor.bgBlackBright;
  for (const [e, r] of Object.entries(b)) {
    for (const [e, o] of Object.entries(r)) b[e] = {
      open: `[${o[0]}m`,
      close: `[${o[1]}m`
    }, r[e] = b[e], i.set(o[0], o[1]);
    Object.defineProperty(b, e, {
      value: r,
      enumerable: !1
    });
  }
  return Object.defineProperty(b, "codes", {
    value: i,
    enumerable: !1
  }), b.color.close = "[39m", b.bgColor.close = "[49m", n(b.color, "ansi", (() => l(e, "ansi16", t, !1))), 
  n(b.color, "ansi256", (() => l(r, "ansi256", t, !1))), n(b.color, "ansi16m", (() => l(o, "rgb", g, !1))), 
  n(b.bgColor, "ansi", (() => l(e, "ansi16", t, !0))), n(b.bgColor, "ansi256", (() => l(r, "ansi256", t, !0))), 
  n(b.bgColor, "ansi16m", (() => l(o, "rgb", g, !0))), b;
}

Object.defineProperty(module, "exports", {
  enumerable: !0,
  get: b
});

},{"color-convert":21}],17:[function(require,module,exports){
"use strict";

const e = require("ansi-styles"), {stdout: t, stderr: r} = require("supports-color"), {stringReplaceAll: o, stringEncaseCRLFWithFirstIndex: s} = require("./util"), n = [ "ansi", "ansi", "ansi256", "ansi16m" ], l = Object.create(null), i = (e, r = {}) => {
  if (r.level > 3 || r.level < 0) throw new Error("The `level` option should be an integer from 0 to 3");
  const o = t ? t.level : 0;
  e.level = void 0 === r.level ? o : r.level;
};

class c {
  constructor(e) {
    return p(e);
  }
}

const p = e => {
  const t = {};
  return i(t, e), t.template = (...e) => g(t.template, ...e), Object.setPrototypeOf(t, u.prototype), 
  Object.setPrototypeOf(t.template, t), t.template.constructor = () => {
    throw new Error("`chalk.constructor()` is deprecated. Use `new chalk.Instance()` instead.");
  }, t.template.Instance = c, t.template;
};

function u(e) {
  return p(e);
}

for (const [t, r] of Object.entries(e)) l[t] = {
  get() {
    const e = f(this, v(r.open, r.close, this._styler), this._isEmpty);
    return Object.defineProperty(this, t, {
      value: e
    }), e;
  }
};

l.visible = {
  get() {
    const e = f(this, this._styler, !0);
    return Object.defineProperty(this, "visible", {
      value: e
    }), e;
  }
};

const a = [ "rgb", "hex", "keyword", "hsl", "hsv", "hwb", "ansi", "ansi256" ];

for (const t of a) l[t] = {
  get() {
    const {level: r} = this;
    return function(...o) {
      const s = v(e.color[n[r]][t](...o), e.color.close, this._styler);
      return f(this, s, this._isEmpty);
    };
  }
};

for (const t of a) {
  l["bg" + t[0].toUpperCase() + t.slice(1)] = {
    get() {
      const {level: r} = this;
      return function(...o) {
        const s = v(e.bgColor[n[r]][t](...o), e.bgColor.close, this._styler);
        return f(this, s, this._isEmpty);
      };
    }
  };
}

const h = Object.defineProperties((() => {}), {
  ...l,
  level: {
    enumerable: !0,
    get() {
      return this._generator.level;
    },
    set(e) {
      this._generator.level = e;
    }
  }
}), v = (e, t, r) => {
  let o, s;
  return void 0 === r ? (o = e, s = t) : (o = r.openAll + e, s = t + r.closeAll), 
  {
    open: e,
    close: t,
    openAll: o,
    closeAll: s,
    parent: r
  };
}, f = (e, t, r) => {
  const o = (...e) => d(o, 1 === e.length ? "" + e[0] : e.join(" "));
  return o.__proto__ = h, o._generator = e, o._styler = t, o._isEmpty = r, o;
}, d = (e, t) => {
  if (e.level <= 0 || !t) return e._isEmpty ? "" : t;
  let r = e._styler;
  if (void 0 === r) return t;
  const {openAll: n, closeAll: l} = r;
  if (-1 !== t.indexOf("")) for (;void 0 !== r; ) t = o(t, r.close, r.open), r = r.parent;
  const i = t.indexOf("\n");
  return -1 !== i && (t = s(t, l, n, i)), n + t + l;
};

let y;

const g = (e, ...t) => {
  const [r] = t;
  if (!Array.isArray(r)) return t.join(" ");
  const o = t.slice(1), s = [ r.raw[0] ];
  for (let e = 1; e < r.length; e++) s.push(String(o[e - 1]).replace(/[{}\\]/g, "\\$&"), String(r.raw[e]));
  return void 0 === y && (y = require("./templates")), y(e, s.join(""));
};

Object.defineProperties(u.prototype, l);

const _ = u();

_.supportsColor = t, _.stderr = u({
  level: r ? r.level : 0
}), _.stderr.supportsColor = r, _.Level = {
  None: 0,
  Basic: 1,
  Ansi256: 2,
  TrueColor: 3,
  0: "None",
  1: "Basic",
  2: "Ansi256",
  3: "TrueColor"
}, module.exports = _;

},{"./templates":18,"./util":19,"ansi-styles":16,"supports-color":24}],18:[function(require,module,exports){
"use strict";

const e = /(?:\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi, t = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g, n = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/, r = /\\(u(?:[a-f\d]{4}|\{[a-f\d]{1,6}\})|x[a-f\d]{2}|.)|([^\\])/gi, s = new Map([ [ "n", "\n" ], [ "r", "\r" ], [ "t", "\t" ], [ "b", "\b" ], [ "f", "\f" ], [ "v", "\v" ], [ "0", "\0" ], [ "\\", "\\" ], [ "e", "" ], [ "a", "" ] ]);

function o(e) {
  const t = "u" === e[0], n = "{" === e[1];
  return t && !n && 5 === e.length || "x" === e[0] && 3 === e.length ? String.fromCharCode(parseInt(e.slice(1), 16)) : t && n ? String.fromCodePoint(parseInt(e.slice(2, -1), 16)) : s.get(e) || e;
}

function l(e, t) {
  const s = [], l = t.trim().split(/\s*,\s*/g);
  let i;
  for (const t of l) {
    const l = Number(t);
    if (Number.isNaN(l)) {
      if (!(i = t.match(n))) throw new Error(`Invalid Chalk template style argument: ${t} (in style '${e}')`);
      s.push(i[2].replace(r, ((e, t, n) => t ? o(t) : n)));
    } else s.push(l);
  }
  return s;
}

function i(e) {
  t.lastIndex = 0;
  const n = [];
  let r;
  for (;null !== (r = t.exec(e)); ) {
    const e = r[1];
    if (r[2]) {
      const t = l(e, r[2]);
      n.push([ e ].concat(t));
    } else n.push([ e ]);
  }
  return n;
}

function f(e, t) {
  const n = {};
  for (const e of t) for (const t of e.styles) n[t[0]] = e.inverse ? null : t.slice(1);
  let r = e;
  for (const [e, t] of Object.entries(n)) if (Array.isArray(t)) {
    if (!(e in r)) throw new Error(`Unknown Chalk style: ${e}`);
    r = t.length > 0 ? r[e](...t) : r[e];
  }
  return r;
}

module.exports = (t, n) => {
  const r = [], s = [];
  let l = [];
  if (n.replace(e, ((e, n, a, c, u, h) => {
    if (n) l.push(o(n)); else if (c) {
      const e = l.join("");
      l = [], s.push(0 === r.length ? e : f(t, r)(e)), r.push({
        inverse: a,
        styles: i(c)
      });
    } else if (u) {
      if (0 === r.length) throw new Error("Found extraneous } in Chalk template literal");
      s.push(f(t, r)(l.join(""))), l = [], r.pop();
    } else l.push(h);
  })), s.push(l.join("")), r.length > 0) {
    const e = `Chalk template literal is missing ${r.length} closing bracket${1 === r.length ? "" : "s"} (\`}\`)`;
    throw new Error(e);
  }
  return s.join("");
};

},{}],19:[function(require,module,exports){
"use strict";

const t = (t, e, s) => {
  let n = t.indexOf(e);
  if (-1 === n) return t;
  const r = e.length;
  let i = 0, l = "";
  do {
    l += t.substr(i, n - i) + e + s, i = n + r, n = t.indexOf(e, i);
  } while (-1 !== n);
  return l += t.substr(i), l;
}, e = (t, e, s, n) => {
  let r = 0, i = "";
  do {
    const l = "\r" === t[n - 1];
    i += t.substr(r, (l ? n - 1 : n) - r) + e + (l ? "\r\n" : "\n") + s, r = n + 1, 
    n = t.indexOf("\n", r);
  } while (-1 !== n);
  return i += t.substr(r), i;
};

module.exports = {
  stringReplaceAll: t,
  stringEncaseCRLFWithFirstIndex: e
};

},{}],20:[function(require,module,exports){
const n = require("color-name"), t = {};

for (const r of Object.keys(n)) t[n[r]] = r;

const r = {
  rgb: {
    channels: 3,
    labels: "rgb"
  },
  hsl: {
    channels: 3,
    labels: "hsl"
  },
  hsv: {
    channels: 3,
    labels: "hsv"
  },
  hwb: {
    channels: 3,
    labels: "hwb"
  },
  cmyk: {
    channels: 4,
    labels: "cmyk"
  },
  xyz: {
    channels: 3,
    labels: "xyz"
  },
  lab: {
    channels: 3,
    labels: "lab"
  },
  lch: {
    channels: 3,
    labels: "lch"
  },
  hex: {
    channels: 1,
    labels: [ "hex" ]
  },
  keyword: {
    channels: 1,
    labels: [ "keyword" ]
  },
  ansi16: {
    channels: 1,
    labels: [ "ansi16" ]
  },
  ansi256: {
    channels: 1,
    labels: [ "ansi256" ]
  },
  hcg: {
    channels: 3,
    labels: [ "h", "c", "g" ]
  },
  apple: {
    channels: 3,
    labels: [ "r16", "g16", "b16" ]
  },
  gray: {
    channels: 1,
    labels: [ "gray" ]
  }
};

module.exports = r;

for (const n of Object.keys(r)) {
  if (!("channels" in r[n])) throw new Error("missing channels property: " + n);
  if (!("labels" in r[n])) throw new Error("missing channel labels property: " + n);
  if (r[n].labels.length !== r[n].channels) throw new Error("channel and label counts mismatch: " + n);
  const {channels: t, labels: e} = r[n];
  delete r[n].channels, delete r[n].labels, Object.defineProperty(r[n], "channels", {
    value: t
  }), Object.defineProperty(r[n], "labels", {
    value: e
  });
}

function e(n, t) {
  return (n[0] - t[0]) ** 2 + (n[1] - t[1]) ** 2 + (n[2] - t[2]) ** 2;
}

r.rgb.hsl = function(n) {
  const t = n[0] / 255, r = n[1] / 255, e = n[2] / 255, a = Math.min(t, r, e), c = Math.max(t, r, e), s = c - a;
  let o, l;
  c === a ? o = 0 : t === c ? o = (r - e) / s : r === c ? o = 2 + (e - t) / s : e === c && (o = 4 + (t - r) / s), 
  o = Math.min(60 * o, 360), o < 0 && (o += 360);
  const h = (a + c) / 2;
  return l = c === a ? 0 : h <= .5 ? s / (c + a) : s / (2 - c - a), [ o, 100 * l, 100 * h ];
}, r.rgb.hsv = function(n) {
  let t, r, e, a, c;
  const s = n[0] / 255, o = n[1] / 255, l = n[2] / 255, h = Math.max(s, o, l), u = h - Math.min(s, o, l), i = function(n) {
    return (h - n) / 6 / u + .5;
  };
  return 0 === u ? (a = 0, c = 0) : (c = u / h, t = i(s), r = i(o), e = i(l), s === h ? a = e - r : o === h ? a = 1 / 3 + t - e : l === h && (a = 2 / 3 + r - t), 
  a < 0 ? a += 1 : a > 1 && (a -= 1)), [ 360 * a, 100 * c, 100 * h ];
}, r.rgb.hwb = function(n) {
  const t = n[0], e = n[1];
  let a = n[2];
  const c = r.rgb.hsl(n)[0], s = 1 / 255 * Math.min(t, Math.min(e, a));
  return a = 1 - 1 / 255 * Math.max(t, Math.max(e, a)), [ c, 100 * s, 100 * a ];
}, r.rgb.cmyk = function(n) {
  const t = n[0] / 255, r = n[1] / 255, e = n[2] / 255, a = Math.min(1 - t, 1 - r, 1 - e);
  return [ 100 * ((1 - t - a) / (1 - a) || 0), 100 * ((1 - r - a) / (1 - a) || 0), 100 * ((1 - e - a) / (1 - a) || 0), 100 * a ];
}, r.rgb.keyword = function(r) {
  const a = t[r];
  if (a) return a;
  let c, s = 1 / 0;
  for (const t of Object.keys(n)) {
    const a = e(r, n[t]);
    a < s && (s = a, c = t);
  }
  return c;
}, r.keyword.rgb = function(t) {
  return n[t];
}, r.rgb.xyz = function(n) {
  let t = n[0] / 255, r = n[1] / 255, e = n[2] / 255;
  t = t > .04045 ? ((t + .055) / 1.055) ** 2.4 : t / 12.92, r = r > .04045 ? ((r + .055) / 1.055) ** 2.4 : r / 12.92, 
  e = e > .04045 ? ((e + .055) / 1.055) ** 2.4 : e / 12.92;
  return [ 100 * (.4124 * t + .3576 * r + .1805 * e), 100 * (.2126 * t + .7152 * r + .0722 * e), 100 * (.0193 * t + .1192 * r + .9505 * e) ];
}, r.rgb.lab = function(n) {
  const t = r.rgb.xyz(n);
  let e = t[0], a = t[1], c = t[2];
  e /= 95.047, a /= 100, c /= 108.883, e = e > .008856 ? e ** (1 / 3) : 7.787 * e + 16 / 116, 
  a = a > .008856 ? a ** (1 / 3) : 7.787 * a + 16 / 116, c = c > .008856 ? c ** (1 / 3) : 7.787 * c + 16 / 116;
  return [ 116 * a - 16, 500 * (e - a), 200 * (a - c) ];
}, r.hsl.rgb = function(n) {
  const t = n[0] / 360, r = n[1] / 100, e = n[2] / 100;
  let a, c, s;
  if (0 === r) return s = 255 * e, [ s, s, s ];
  a = e < .5 ? e * (1 + r) : e + r - e * r;
  const o = 2 * e - a, l = [ 0, 0, 0 ];
  for (let n = 0; n < 3; n++) c = t + 1 / 3 * -(n - 1), c < 0 && c++, c > 1 && c--, 
  s = 6 * c < 1 ? o + 6 * (a - o) * c : 2 * c < 1 ? a : 3 * c < 2 ? o + (a - o) * (2 / 3 - c) * 6 : o, 
  l[n] = 255 * s;
  return l;
}, r.hsl.hsv = function(n) {
  const t = n[0];
  let r = n[1] / 100, e = n[2] / 100, a = r;
  const c = Math.max(e, .01);
  e *= 2, r *= e <= 1 ? e : 2 - e, a *= c <= 1 ? c : 2 - c;
  return [ t, 100 * (0 === e ? 2 * a / (c + a) : 2 * r / (e + r)), 100 * ((e + r) / 2) ];
}, r.hsv.rgb = function(n) {
  const t = n[0] / 60, r = n[1] / 100;
  let e = n[2] / 100;
  const a = Math.floor(t) % 6, c = t - Math.floor(t), s = 255 * e * (1 - r), o = 255 * e * (1 - r * c), l = 255 * e * (1 - r * (1 - c));
  switch (e *= 255, a) {
   case 0:
    return [ e, l, s ];

   case 1:
    return [ o, e, s ];

   case 2:
    return [ s, e, l ];

   case 3:
    return [ s, o, e ];

   case 4:
    return [ l, s, e ];

   case 5:
    return [ e, s, o ];
  }
}, r.hsv.hsl = function(n) {
  const t = n[0], r = n[1] / 100, e = n[2] / 100, a = Math.max(e, .01);
  let c, s;
  s = (2 - r) * e;
  const o = (2 - r) * a;
  return c = r * a, c /= o <= 1 ? o : 2 - o, c = c || 0, s /= 2, [ t, 100 * c, 100 * s ];
}, r.hwb.rgb = function(n) {
  const t = n[0] / 360;
  let r = n[1] / 100, e = n[2] / 100;
  const a = r + e;
  let c;
  a > 1 && (r /= a, e /= a);
  const s = Math.floor(6 * t), o = 1 - e;
  c = 6 * t - s, 0 != (1 & s) && (c = 1 - c);
  const l = r + c * (o - r);
  let h, u, i;
  switch (s) {
   default:
   case 6:
   case 0:
    h = o, u = l, i = r;
    break;

   case 1:
    h = l, u = o, i = r;
    break;

   case 2:
    h = r, u = o, i = l;
    break;

   case 3:
    h = r, u = l, i = o;
    break;

   case 4:
    h = l, u = r, i = o;
    break;

   case 5:
    h = o, u = r, i = l;
  }
  return [ 255 * h, 255 * u, 255 * i ];
}, r.cmyk.rgb = function(n) {
  const t = n[0] / 100, r = n[1] / 100, e = n[2] / 100, a = n[3] / 100;
  return [ 255 * (1 - Math.min(1, t * (1 - a) + a)), 255 * (1 - Math.min(1, r * (1 - a) + a)), 255 * (1 - Math.min(1, e * (1 - a) + a)) ];
}, r.xyz.rgb = function(n) {
  const t = n[0] / 100, r = n[1] / 100, e = n[2] / 100;
  let a, c, s;
  return a = 3.2406 * t + -1.5372 * r + -.4986 * e, c = -.9689 * t + 1.8758 * r + .0415 * e, 
  s = .0557 * t + -.204 * r + 1.057 * e, a = a > .0031308 ? 1.055 * a ** (1 / 2.4) - .055 : 12.92 * a, 
  c = c > .0031308 ? 1.055 * c ** (1 / 2.4) - .055 : 12.92 * c, s = s > .0031308 ? 1.055 * s ** (1 / 2.4) - .055 : 12.92 * s, 
  a = Math.min(Math.max(0, a), 1), c = Math.min(Math.max(0, c), 1), s = Math.min(Math.max(0, s), 1), 
  [ 255 * a, 255 * c, 255 * s ];
}, r.xyz.lab = function(n) {
  let t = n[0], r = n[1], e = n[2];
  t /= 95.047, r /= 100, e /= 108.883, t = t > .008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116, 
  r = r > .008856 ? r ** (1 / 3) : 7.787 * r + 16 / 116, e = e > .008856 ? e ** (1 / 3) : 7.787 * e + 16 / 116;
  return [ 116 * r - 16, 500 * (t - r), 200 * (r - e) ];
}, r.lab.xyz = function(n) {
  let t, r, e;
  r = (n[0] + 16) / 116, t = n[1] / 500 + r, e = r - n[2] / 200;
  const a = r ** 3, c = t ** 3, s = e ** 3;
  return r = a > .008856 ? a : (r - 16 / 116) / 7.787, t = c > .008856 ? c : (t - 16 / 116) / 7.787, 
  e = s > .008856 ? s : (e - 16 / 116) / 7.787, t *= 95.047, r *= 100, e *= 108.883, 
  [ t, r, e ];
}, r.lab.lch = function(n) {
  const t = n[0], r = n[1], e = n[2];
  let a;
  a = 360 * Math.atan2(e, r) / 2 / Math.PI, a < 0 && (a += 360);
  return [ t, Math.sqrt(r * r + e * e), a ];
}, r.lch.lab = function(n) {
  const t = n[0], r = n[1], e = n[2] / 360 * 2 * Math.PI;
  return [ t, r * Math.cos(e), r * Math.sin(e) ];
}, r.rgb.ansi16 = function(n, t = null) {
  const [e, a, c] = n;
  let s = null === t ? r.rgb.hsv(n)[2] : t;
  if (s = Math.round(s / 50), 0 === s) return 30;
  let o = 30 + (Math.round(c / 255) << 2 | Math.round(a / 255) << 1 | Math.round(e / 255));
  return 2 === s && (o += 60), o;
}, r.hsv.ansi16 = function(n) {
  return r.rgb.ansi16(r.hsv.rgb(n), n[2]);
}, r.rgb.ansi256 = function(n) {
  const t = n[0], r = n[1], e = n[2];
  if (t === r && r === e) return t < 8 ? 16 : t > 248 ? 231 : Math.round((t - 8) / 247 * 24) + 232;
  return 16 + 36 * Math.round(t / 255 * 5) + 6 * Math.round(r / 255 * 5) + Math.round(e / 255 * 5);
}, r.ansi16.rgb = function(n) {
  let t = n % 10;
  if (0 === t || 7 === t) return n > 50 && (t += 3.5), t = t / 10.5 * 255, [ t, t, t ];
  const r = .5 * (1 + ~~(n > 50));
  return [ (1 & t) * r * 255, (t >> 1 & 1) * r * 255, (t >> 2 & 1) * r * 255 ];
}, r.ansi256.rgb = function(n) {
  if (n >= 232) {
    const t = 10 * (n - 232) + 8;
    return [ t, t, t ];
  }
  let t;
  n -= 16;
  return [ Math.floor(n / 36) / 5 * 255, Math.floor((t = n % 36) / 6) / 5 * 255, t % 6 / 5 * 255 ];
}, r.rgb.hex = function(n) {
  const t = (((255 & Math.round(n[0])) << 16) + ((255 & Math.round(n[1])) << 8) + (255 & Math.round(n[2]))).toString(16).toUpperCase();
  return "000000".substring(t.length) + t;
}, r.hex.rgb = function(n) {
  const t = n.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
  if (!t) return [ 0, 0, 0 ];
  let r = t[0];
  3 === t[0].length && (r = r.split("").map((n => n + n)).join(""));
  const e = parseInt(r, 16);
  return [ e >> 16 & 255, e >> 8 & 255, 255 & e ];
}, r.rgb.hcg = function(n) {
  const t = n[0] / 255, r = n[1] / 255, e = n[2] / 255, a = Math.max(Math.max(t, r), e), c = Math.min(Math.min(t, r), e), s = a - c;
  let o, l;
  return o = s < 1 ? c / (1 - s) : 0, l = s <= 0 ? 0 : a === t ? (r - e) / s % 6 : a === r ? 2 + (e - t) / s : 4 + (t - r) / s, 
  l /= 6, l %= 1, [ 360 * l, 100 * s, 100 * o ];
}, r.hsl.hcg = function(n) {
  const t = n[1] / 100, r = n[2] / 100, e = r < .5 ? 2 * t * r : 2 * t * (1 - r);
  let a = 0;
  return e < 1 && (a = (r - .5 * e) / (1 - e)), [ n[0], 100 * e, 100 * a ];
}, r.hsv.hcg = function(n) {
  const t = n[1] / 100, r = n[2] / 100, e = t * r;
  let a = 0;
  return e < 1 && (a = (r - e) / (1 - e)), [ n[0], 100 * e, 100 * a ];
}, r.hcg.rgb = function(n) {
  const t = n[0] / 360, r = n[1] / 100, e = n[2] / 100;
  if (0 === r) return [ 255 * e, 255 * e, 255 * e ];
  const a = [ 0, 0, 0 ], c = t % 1 * 6, s = c % 1, o = 1 - s;
  let l = 0;
  switch (Math.floor(c)) {
   case 0:
    a[0] = 1, a[1] = s, a[2] = 0;
    break;

   case 1:
    a[0] = o, a[1] = 1, a[2] = 0;
    break;

   case 2:
    a[0] = 0, a[1] = 1, a[2] = s;
    break;

   case 3:
    a[0] = 0, a[1] = o, a[2] = 1;
    break;

   case 4:
    a[0] = s, a[1] = 0, a[2] = 1;
    break;

   default:
    a[0] = 1, a[1] = 0, a[2] = o;
  }
  return l = (1 - r) * e, [ 255 * (r * a[0] + l), 255 * (r * a[1] + l), 255 * (r * a[2] + l) ];
}, r.hcg.hsv = function(n) {
  const t = n[1] / 100, r = t + n[2] / 100 * (1 - t);
  let e = 0;
  return r > 0 && (e = t / r), [ n[0], 100 * e, 100 * r ];
}, r.hcg.hsl = function(n) {
  const t = n[1] / 100, r = n[2] / 100 * (1 - t) + .5 * t;
  let e = 0;
  return r > 0 && r < .5 ? e = t / (2 * r) : r >= .5 && r < 1 && (e = t / (2 * (1 - r))), 
  [ n[0], 100 * e, 100 * r ];
}, r.hcg.hwb = function(n) {
  const t = n[1] / 100, r = t + n[2] / 100 * (1 - t);
  return [ n[0], 100 * (r - t), 100 * (1 - r) ];
}, r.hwb.hcg = function(n) {
  const t = n[1] / 100, r = 1 - n[2] / 100, e = r - t;
  let a = 0;
  return e < 1 && (a = (r - e) / (1 - e)), [ n[0], 100 * e, 100 * a ];
}, r.apple.rgb = function(n) {
  return [ n[0] / 65535 * 255, n[1] / 65535 * 255, n[2] / 65535 * 255 ];
}, r.rgb.apple = function(n) {
  return [ n[0] / 255 * 65535, n[1] / 255 * 65535, n[2] / 255 * 65535 ];
}, r.gray.rgb = function(n) {
  return [ n[0] / 100 * 255, n[0] / 100 * 255, n[0] / 100 * 255 ];
}, r.gray.hsl = function(n) {
  return [ 0, 0, n[0] ];
}, r.gray.hsv = r.gray.hsl, r.gray.hwb = function(n) {
  return [ 0, 100, n[0] ];
}, r.gray.cmyk = function(n) {
  return [ 0, 0, 0, n[0] ];
}, r.gray.lab = function(n) {
  return [ n[0], 0, 0 ];
}, r.gray.hex = function(n) {
  const t = 255 & Math.round(n[0] / 100 * 255), r = ((t << 16) + (t << 8) + t).toString(16).toUpperCase();
  return "000000".substring(r.length) + r;
}, r.rgb.gray = function(n) {
  return [ (n[0] + n[1] + n[2]) / 3 / 255 * 100 ];
};

},{"color-name":23}],21:[function(require,module,exports){
const n = require("./conversions"), e = require("./route"), o = {}, r = Object.keys(n);

function t(n) {
  const e = function(...e) {
    const o = e[0];
    return null == o ? o : (o.length > 1 && (e = o), n(e));
  };
  return "conversion" in n && (e.conversion = n.conversion), e;
}

function c(n) {
  const e = function(...e) {
    const o = e[0];
    if (null == o) return o;
    o.length > 1 && (e = o);
    const r = n(e);
    if ("object" == typeof r) for (let n = r.length, e = 0; e < n; e++) r[e] = Math.round(r[e]);
    return r;
  };
  return "conversion" in n && (e.conversion = n.conversion), e;
}

r.forEach((r => {
  o[r] = {}, Object.defineProperty(o[r], "channels", {
    value: n[r].channels
  }), Object.defineProperty(o[r], "labels", {
    value: n[r].labels
  });
  const s = e(r);
  Object.keys(s).forEach((n => {
    const e = s[n];
    o[r][n] = c(e), o[r][n].raw = t(e);
  }));
})), module.exports = o;

},{"./conversions":20,"./route":22}],22:[function(require,module,exports){
const n = require("./conversions");

function t() {
  const t = {}, e = Object.keys(n);
  for (let n = e.length, r = 0; r < n; r++) t[e[r]] = {
    distance: -1,
    parent: null
  };
  return t;
}

function e(e) {
  const r = t(), o = [ e ];
  for (r[e].distance = 0; o.length; ) {
    const t = o.pop(), e = Object.keys(n[t]);
    for (let n = e.length, c = 0; c < n; c++) {
      const n = e[c], s = r[n];
      -1 === s.distance && (s.distance = r[t].distance + 1, s.parent = t, o.unshift(n));
    }
  }
  return r;
}

function r(n, t) {
  return function(e) {
    return t(n(e));
  };
}

function o(t, e) {
  const o = [ e[t].parent, t ];
  let c = n[e[t].parent][t], s = e[t].parent;
  for (;e[s].parent; ) o.unshift(e[s].parent), c = r(n[e[s].parent][s], c), s = e[s].parent;
  return c.conversion = o, c;
}

module.exports = function(n) {
  const t = e(n), r = {}, c = Object.keys(t);
  for (let n = c.length, e = 0; e < n; e++) {
    const n = c[e];
    null !== t[n].parent && (r[n] = o(n, t));
  }
  return r;
};

},{"./conversions":20}],23:[function(require,module,exports){
"use strict";

module.exports = {
  aliceblue: [ 240, 248, 255 ],
  antiquewhite: [ 250, 235, 215 ],
  aqua: [ 0, 255, 255 ],
  aquamarine: [ 127, 255, 212 ],
  azure: [ 240, 255, 255 ],
  beige: [ 245, 245, 220 ],
  bisque: [ 255, 228, 196 ],
  black: [ 0, 0, 0 ],
  blanchedalmond: [ 255, 235, 205 ],
  blue: [ 0, 0, 255 ],
  blueviolet: [ 138, 43, 226 ],
  brown: [ 165, 42, 42 ],
  burlywood: [ 222, 184, 135 ],
  cadetblue: [ 95, 158, 160 ],
  chartreuse: [ 127, 255, 0 ],
  chocolate: [ 210, 105, 30 ],
  coral: [ 255, 127, 80 ],
  cornflowerblue: [ 100, 149, 237 ],
  cornsilk: [ 255, 248, 220 ],
  crimson: [ 220, 20, 60 ],
  cyan: [ 0, 255, 255 ],
  darkblue: [ 0, 0, 139 ],
  darkcyan: [ 0, 139, 139 ],
  darkgoldenrod: [ 184, 134, 11 ],
  darkgray: [ 169, 169, 169 ],
  darkgreen: [ 0, 100, 0 ],
  darkgrey: [ 169, 169, 169 ],
  darkkhaki: [ 189, 183, 107 ],
  darkmagenta: [ 139, 0, 139 ],
  darkolivegreen: [ 85, 107, 47 ],
  darkorange: [ 255, 140, 0 ],
  darkorchid: [ 153, 50, 204 ],
  darkred: [ 139, 0, 0 ],
  darksalmon: [ 233, 150, 122 ],
  darkseagreen: [ 143, 188, 143 ],
  darkslateblue: [ 72, 61, 139 ],
  darkslategray: [ 47, 79, 79 ],
  darkslategrey: [ 47, 79, 79 ],
  darkturquoise: [ 0, 206, 209 ],
  darkviolet: [ 148, 0, 211 ],
  deeppink: [ 255, 20, 147 ],
  deepskyblue: [ 0, 191, 255 ],
  dimgray: [ 105, 105, 105 ],
  dimgrey: [ 105, 105, 105 ],
  dodgerblue: [ 30, 144, 255 ],
  firebrick: [ 178, 34, 34 ],
  floralwhite: [ 255, 250, 240 ],
  forestgreen: [ 34, 139, 34 ],
  fuchsia: [ 255, 0, 255 ],
  gainsboro: [ 220, 220, 220 ],
  ghostwhite: [ 248, 248, 255 ],
  gold: [ 255, 215, 0 ],
  goldenrod: [ 218, 165, 32 ],
  gray: [ 128, 128, 128 ],
  green: [ 0, 128, 0 ],
  greenyellow: [ 173, 255, 47 ],
  grey: [ 128, 128, 128 ],
  honeydew: [ 240, 255, 240 ],
  hotpink: [ 255, 105, 180 ],
  indianred: [ 205, 92, 92 ],
  indigo: [ 75, 0, 130 ],
  ivory: [ 255, 255, 240 ],
  khaki: [ 240, 230, 140 ],
  lavender: [ 230, 230, 250 ],
  lavenderblush: [ 255, 240, 245 ],
  lawngreen: [ 124, 252, 0 ],
  lemonchiffon: [ 255, 250, 205 ],
  lightblue: [ 173, 216, 230 ],
  lightcoral: [ 240, 128, 128 ],
  lightcyan: [ 224, 255, 255 ],
  lightgoldenrodyellow: [ 250, 250, 210 ],
  lightgray: [ 211, 211, 211 ],
  lightgreen: [ 144, 238, 144 ],
  lightgrey: [ 211, 211, 211 ],
  lightpink: [ 255, 182, 193 ],
  lightsalmon: [ 255, 160, 122 ],
  lightseagreen: [ 32, 178, 170 ],
  lightskyblue: [ 135, 206, 250 ],
  lightslategray: [ 119, 136, 153 ],
  lightslategrey: [ 119, 136, 153 ],
  lightsteelblue: [ 176, 196, 222 ],
  lightyellow: [ 255, 255, 224 ],
  lime: [ 0, 255, 0 ],
  limegreen: [ 50, 205, 50 ],
  linen: [ 250, 240, 230 ],
  magenta: [ 255, 0, 255 ],
  maroon: [ 128, 0, 0 ],
  mediumaquamarine: [ 102, 205, 170 ],
  mediumblue: [ 0, 0, 205 ],
  mediumorchid: [ 186, 85, 211 ],
  mediumpurple: [ 147, 112, 219 ],
  mediumseagreen: [ 60, 179, 113 ],
  mediumslateblue: [ 123, 104, 238 ],
  mediumspringgreen: [ 0, 250, 154 ],
  mediumturquoise: [ 72, 209, 204 ],
  mediumvioletred: [ 199, 21, 133 ],
  midnightblue: [ 25, 25, 112 ],
  mintcream: [ 245, 255, 250 ],
  mistyrose: [ 255, 228, 225 ],
  moccasin: [ 255, 228, 181 ],
  navajowhite: [ 255, 222, 173 ],
  navy: [ 0, 0, 128 ],
  oldlace: [ 253, 245, 230 ],
  olive: [ 128, 128, 0 ],
  olivedrab: [ 107, 142, 35 ],
  orange: [ 255, 165, 0 ],
  orangered: [ 255, 69, 0 ],
  orchid: [ 218, 112, 214 ],
  palegoldenrod: [ 238, 232, 170 ],
  palegreen: [ 152, 251, 152 ],
  paleturquoise: [ 175, 238, 238 ],
  palevioletred: [ 219, 112, 147 ],
  papayawhip: [ 255, 239, 213 ],
  peachpuff: [ 255, 218, 185 ],
  peru: [ 205, 133, 63 ],
  pink: [ 255, 192, 203 ],
  plum: [ 221, 160, 221 ],
  powderblue: [ 176, 224, 230 ],
  purple: [ 128, 0, 128 ],
  rebeccapurple: [ 102, 51, 153 ],
  red: [ 255, 0, 0 ],
  rosybrown: [ 188, 143, 143 ],
  royalblue: [ 65, 105, 225 ],
  saddlebrown: [ 139, 69, 19 ],
  salmon: [ 250, 128, 114 ],
  sandybrown: [ 244, 164, 96 ],
  seagreen: [ 46, 139, 87 ],
  seashell: [ 255, 245, 238 ],
  sienna: [ 160, 82, 45 ],
  silver: [ 192, 192, 192 ],
  skyblue: [ 135, 206, 235 ],
  slateblue: [ 106, 90, 205 ],
  slategray: [ 112, 128, 144 ],
  slategrey: [ 112, 128, 144 ],
  snow: [ 255, 250, 250 ],
  springgreen: [ 0, 255, 127 ],
  steelblue: [ 70, 130, 180 ],
  tan: [ 210, 180, 140 ],
  teal: [ 0, 128, 128 ],
  thistle: [ 216, 191, 216 ],
  tomato: [ 255, 99, 71 ],
  turquoise: [ 64, 224, 208 ],
  violet: [ 238, 130, 238 ],
  wheat: [ 245, 222, 179 ],
  white: [ 255, 255, 255 ],
  whitesmoke: [ 245, 245, 245 ],
  yellow: [ 255, 255, 0 ],
  yellowgreen: [ 154, 205, 50 ]
};

},{}],24:[function(require,module,exports){
const s = {
  level: 3,
  hasBasic: !0,
  has256: !0,
  has16m: !0
};

function o(o) {
  return s;
}

module.exports = {
  supportsColor: o,
  stdout: s,
  stderr: s
};

},{}],25:[function(require,module,exports){
const {pageSize: e, pointerSize: s} = Process;

class t {
  constructor(s) {
    this.sliceSize = s, this.slicesPerPage = e / s, this.pages = [], this.free = [];
  }
  allocateSlice(s, t) {
    const i = void 0 === s.near, r = 1 === t;
    if (i && r) {
      const e = this.free.pop();
      if (void 0 !== e) return e;
    } else if (t < e) {
      const {free: e} = this, c = e.length, n = r ? null : ptr(t - 1);
      for (let t = 0; t !== c; t++) {
        const c = e[t], o = i || this._isSliceNear(c, s), l = r || c.and(n).isNull();
        if (o && l) return e.splice(t, 1)[0];
      }
    }
    return this._allocatePage(s);
  }
  _allocatePage(s) {
    const t = Memory.alloc(e, s), {sliceSize: i, slicesPerPage: r} = this;
    for (let e = 1; e !== r; e++) {
      const s = t.add(e * i);
      this.free.push(s);
    }
    return this.pages.push(t), t;
  }
  _isSliceNear(e, s) {
    const t = e.add(this.sliceSize), {near: r, maxDistance: c} = s, n = i(r.sub(e)), o = i(r.sub(t));
    return n.compare(c) <= 0 && o.compare(c) <= 0;
  }
  freeSlice(e) {
    this.free.push(e);
  }
}

function i(e) {
  const t = 4 === s ? 31 : 63, i = ptr(1).shl(t).not();
  return e.and(i);
}

function r(e) {
  return new t(e);
}

module.exports = r;

},{}],26:[function(require,module,exports){
(function (global){(function (){
const e = require("./alloc"), {jvmtiVersion: t, jvmtiCapabilities: n, EnvJvmti: r} = require("./jvmti"), {parseInstructionsAt: o} = require("./machine-code"), a = require("./memoize"), {checkJniResult: i, JNI_OK: s} = require("./result"), c = require("./vm"), d = 4, l = Process.pointerSize, {readU32: u, readPointer: p, writeU32: _, writePointer: m} = NativePointer.prototype, h = 1, g = 8, f = 16, b = 256, v = 524288, k = 2097152, S = 1073741824, E = 524288, N = 134217728, R = 1048576, w = 2097152, P = 268435456, x = 268435456, M = 0, C = 3, A = 5, y = ptr(1).not(), I = 2147467263, L = 4294963200, T = 17 * l, j = 18 * l, O = 12, z = 112, D = 116, F = 0, V = 56, Z = 4, J = 8, U = 10, G = 12, B = 14, q = 28, W = 36, H = 0, K = 1, Q = 2, $ = 3, X = 4, Y = 5, ee = 6, te = 7, ne = 2147483648, re = 28, oe = 3 * l, ae = 3 * l, ie = 1, se = 1, ce = a(Ze), de = a(Xe), le = a(nt), ue = a(ot), pe = a(at), _e = a(vt), me = a(pt), he = a(_t), ge = a(mt), fe = a(At), be = "ia32" === Process.arch ? Vn : Fn, ve = {
  exceptions: "propagate"
}, ke = {};

let Se = null, Ee = null, Ne = null, Re = null;

const we = [], Pe = new Map, xe = [];

let Me = null, Ce = 0, Ae = !1, ye = !1, Ie = null;

const Le = [];

let Te = null, je = null;

function Oe() {
  return null === Se && (Se = ze()), Se;
}

function ze() {
  const e = Process.enumerateModules().filter((e => /^lib(art|dvm).so$/.test(e.name))).filter((e => !/\/system\/fake-libs/.test(e.path)));
  if (0 === e.length) return null;
  const t = e[0], n = -1 !== t.name.indexOf("art") ? "art" : "dalvik", r = "art" === n, o = {
    module: t,
    flavor: n,
    addLocalReference: null
  }, a = r ? [ {
    module: t.path,
    functions: {
      JNI_GetCreatedJavaVMs: [ "JNI_GetCreatedJavaVMs", "int", [ "pointer", "int", "pointer" ] ],
      artInterpreterToCompiledCodeBridge: function(e) {
        this.artInterpreterToCompiledCodeBridge = e;
      },
      _ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadENS_6ObjPtrINS_6mirror6ObjectEEE: [ "art::JavaVMExt::AddGlobalRef", "pointer", [ "pointer", "pointer", "pointer" ] ],
      _ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadEPNS_6mirror6ObjectE: [ "art::JavaVMExt::AddGlobalRef", "pointer", [ "pointer", "pointer", "pointer" ] ],
      _ZN3art17ReaderWriterMutex13ExclusiveLockEPNS_6ThreadE: [ "art::ReaderWriterMutex::ExclusiveLock", "void", [ "pointer", "pointer" ] ],
      _ZN3art17ReaderWriterMutex15ExclusiveUnlockEPNS_6ThreadE: [ "art::ReaderWriterMutex::ExclusiveUnlock", "void", [ "pointer", "pointer" ] ],
      _ZN3art22IndirectReferenceTable3AddEjPNS_6mirror6ObjectE: function(e) {
        this["art::IndirectReferenceTable::Add"] = new NativeFunction(e, "pointer", [ "pointer", "uint", "pointer" ], ve);
      },
      _ZN3art22IndirectReferenceTable3AddENS_15IRTSegmentStateENS_6ObjPtrINS_6mirror6ObjectEEE: function(e) {
        this["art::IndirectReferenceTable::Add"] = new NativeFunction(e, "pointer", [ "pointer", "uint", "pointer" ], ve);
      },
      _ZN3art9JavaVMExt12DecodeGlobalEPv: function(e) {
        let t;
        t = ge() >= 26 ? be(e, [ "pointer", "pointer" ]) : new NativeFunction(e, "pointer", [ "pointer", "pointer" ], ve), 
        this["art::JavaVMExt::DecodeGlobal"] = function(e, n, r) {
          return t(e, r);
        };
      },
      _ZN3art9JavaVMExt12DecodeGlobalEPNS_6ThreadEPv: [ "art::JavaVMExt::DecodeGlobal", "pointer", [ "pointer", "pointer", "pointer" ] ],
      _ZNK3art6Thread13DecodeJObjectEP8_jobject: [ "art::Thread::DecodeJObject", "pointer", [ "pointer", "pointer" ] ],
      _ZN3art10ThreadList10SuspendAllEPKcb: [ "art::ThreadList::SuspendAll", "void", [ "pointer", "pointer", "bool" ] ],
      _ZN3art10ThreadList10SuspendAllEv: function(e) {
        const t = new NativeFunction(e, "void", [ "pointer" ], ve);
        this["art::ThreadList::SuspendAll"] = function(e, n, r) {
          return t(e);
        };
      },
      _ZN3art10ThreadList9ResumeAllEv: [ "art::ThreadList::ResumeAll", "void", [ "pointer" ] ],
      _ZN3art11ClassLinker12VisitClassesEPNS_12ClassVisitorE: [ "art::ClassLinker::VisitClasses", "void", [ "pointer", "pointer" ] ],
      _ZN3art11ClassLinker12VisitClassesEPFbPNS_6mirror5ClassEPvES4_: function(e) {
        const t = new NativeFunction(e, "void", [ "pointer", "pointer", "pointer" ], ve);
        this["art::ClassLinker::VisitClasses"] = function(e, n) {
          t(e, n, NULL);
        };
      },
      _ZNK3art11ClassLinker17VisitClassLoadersEPNS_18ClassLoaderVisitorE: [ "art::ClassLinker::VisitClassLoaders", "void", [ "pointer", "pointer" ] ],
      _ZN3art2gc4Heap12VisitObjectsEPFvPNS_6mirror6ObjectEPvES5_: [ "art::gc::Heap::VisitObjects", "void", [ "pointer", "pointer", "pointer" ] ],
      _ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE: [ "art::gc::Heap::GetInstances", "void", [ "pointer", "pointer", "pointer", "int", "pointer" ] ],
      _ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEbiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE: function(e) {
        const t = new NativeFunction(e, "void", [ "pointer", "pointer", "pointer", "bool", "int", "pointer" ], ve);
        this["art::gc::Heap::GetInstances"] = function(e, n, r, o, a) {
          t(e, n, r, 0, o, a);
        };
      },
      _ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEjb: [ "art::StackVisitor::StackVisitor", "void", [ "pointer", "pointer", "pointer", "uint", "uint", "bool" ] ],
      _ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEmb: [ "art::StackVisitor::StackVisitor", "void", [ "pointer", "pointer", "pointer", "uint", "size_t", "bool" ] ],
      _ZN3art12StackVisitor9WalkStackILNS0_16CountTransitionsE0EEEvb: [ "art::StackVisitor::WalkStack", "void", [ "pointer", "bool" ] ],
      _ZNK3art12StackVisitor9GetMethodEv: [ "art::StackVisitor::GetMethod", "pointer", [ "pointer" ] ],
      _ZNK3art12StackVisitor16DescribeLocationEv: function(e) {
        this["art::StackVisitor::DescribeLocation"] = Zn(e, [ "pointer" ]);
      },
      _ZNK3art12StackVisitor24GetCurrentQuickFrameInfoEv: function(e) {
        this["art::StackVisitor::GetCurrentQuickFrameInfo"] = Ct(e);
      },
      _ZN3art6Thread18GetLongJumpContextEv: [ "art::Thread::GetLongJumpContext", "pointer", [ "pointer" ] ],
      _ZN3art6mirror5Class13GetDescriptorEPNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEE: function(e) {
        this["art::mirror::Class::GetDescriptor"] = e;
      },
      _ZN3art6mirror5Class11GetLocationEv: function(e) {
        this["art::mirror::Class::GetLocation"] = Zn(e, [ "pointer" ]);
      },
      _ZN3art9ArtMethod12PrettyMethodEb: function(e) {
        this["art::ArtMethod::PrettyMethod"] = Zn(e, [ "pointer", "bool" ]);
      },
      _ZN3art12PrettyMethodEPNS_9ArtMethodEb: function(e) {
        this["art::ArtMethod::PrettyMethodNullSafe"] = Zn(e, [ "pointer", "bool" ]);
      },
      _ZN3art6Thread14CurrentFromGdbEv: [ "art::Thread::CurrentFromGdb", "pointer", [] ],
      _ZN3art6mirror6Object5CloneEPNS_6ThreadE: function(e) {
        this["art::mirror::Object::Clone"] = new NativeFunction(e, "pointer", [ "pointer", "pointer" ], ve);
      },
      _ZN3art6mirror6Object5CloneEPNS_6ThreadEm: function(e) {
        const t = new NativeFunction(e, "pointer", [ "pointer", "pointer", "pointer" ], ve);
        this["art::mirror::Object::Clone"] = function(e, n) {
          const r = NULL;
          return t(e, n, r);
        };
      },
      _ZN3art6mirror6Object5CloneEPNS_6ThreadEj: function(e) {
        const t = new NativeFunction(e, "pointer", [ "pointer", "pointer", "uint" ], ve);
        this["art::mirror::Object::Clone"] = function(e, n) {
          return t(e, n, 0);
        };
      },
      _ZN3art3Dbg14SetJdwpAllowedEb: [ "art::Dbg::SetJdwpAllowed", "void", [ "bool" ] ],
      _ZN3art3Dbg13ConfigureJdwpERKNS_4JDWP11JdwpOptionsE: [ "art::Dbg::ConfigureJdwp", "void", [ "pointer" ] ],
      _ZN3art31InternalDebuggerControlCallback13StartDebuggerEv: [ "art::InternalDebuggerControlCallback::StartDebugger", "void", [ "pointer" ] ],
      _ZN3art3Dbg9StartJdwpEv: [ "art::Dbg::StartJdwp", "void", [] ],
      _ZN3art3Dbg8GoActiveEv: [ "art::Dbg::GoActive", "void", [] ],
      _ZN3art3Dbg21RequestDeoptimizationERKNS_21DeoptimizationRequestE: [ "art::Dbg::RequestDeoptimization", "void", [ "pointer" ] ],
      _ZN3art3Dbg20ManageDeoptimizationEv: [ "art::Dbg::ManageDeoptimization", "void", [] ],
      _ZN3art15instrumentation15Instrumentation20EnableDeoptimizationEv: [ "art::Instrumentation::EnableDeoptimization", "void", [ "pointer" ] ],
      _ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEPKc: [ "art::Instrumentation::DeoptimizeEverything", "void", [ "pointer", "pointer" ] ],
      _ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEv: function(e) {
        const t = new NativeFunction(e, "void", [ "pointer" ], ve);
        this["art::Instrumentation::DeoptimizeEverything"] = function(e, n) {
          t(e);
        };
      },
      _ZN3art7Runtime19DeoptimizeBootImageEv: [ "art::Runtime::DeoptimizeBootImage", "void", [ "pointer" ] ],
      _ZN3art15instrumentation15Instrumentation10DeoptimizeEPNS_9ArtMethodE: [ "art::Instrumentation::Deoptimize", "void", [ "pointer", "pointer" ] ],
      _ZN3art3jni12JniIdManager14DecodeMethodIdEP10_jmethodID: [ "art::jni::JniIdManager::DecodeMethodId", "pointer", [ "pointer", "pointer" ] ],
      _ZN3art11interpreter18GetNterpEntryPointEv: [ "art::interpreter::GetNterpEntryPoint", "pointer", [] ],
      _ZN3art7Monitor17TranslateLocationEPNS_9ArtMethodEjPPKcPi: [ "art::Monitor::TranslateLocation", "void", [ "pointer", "uint32", "pointer", "pointer" ] ]
    },
    variables: {
      _ZN3art3Dbg9gRegistryE: function(e) {
        this.isJdwpStarted = () => !e.readPointer().isNull();
      },
      _ZN3art3Dbg15gDebuggerActiveE: function(e) {
        this.isDebuggerActive = () => !!e.readU8();
      }
    },
    optionals: [ "artInterpreterToCompiledCodeBridge", "_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadENS_6ObjPtrINS_6mirror6ObjectEEE", "_ZN3art9JavaVMExt12AddGlobalRefEPNS_6ThreadEPNS_6mirror6ObjectE", "_ZN3art9JavaVMExt12DecodeGlobalEPv", "_ZN3art9JavaVMExt12DecodeGlobalEPNS_6ThreadEPv", "_ZN3art10ThreadList10SuspendAllEPKcb", "_ZN3art10ThreadList10SuspendAllEv", "_ZN3art11ClassLinker12VisitClassesEPNS_12ClassVisitorE", "_ZN3art11ClassLinker12VisitClassesEPFbPNS_6mirror5ClassEPvES4_", "_ZNK3art11ClassLinker17VisitClassLoadersEPNS_18ClassLoaderVisitorE", "_ZN3art6mirror6Object5CloneEPNS_6ThreadE", "_ZN3art6mirror6Object5CloneEPNS_6ThreadEm", "_ZN3art6mirror6Object5CloneEPNS_6ThreadEj", "_ZN3art22IndirectReferenceTable3AddEjPNS_6mirror6ObjectE", "_ZN3art22IndirectReferenceTable3AddENS_15IRTSegmentStateENS_6ObjPtrINS_6mirror6ObjectEEE", "_ZN3art2gc4Heap12VisitObjectsEPFvPNS_6mirror6ObjectEPvES5_", "_ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE", "_ZN3art2gc4Heap12GetInstancesERNS_24VariableSizedHandleScopeENS_6HandleINS_6mirror5ClassEEEbiRNSt3__16vectorINS4_INS5_6ObjectEEENS8_9allocatorISB_EEEE", "_ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEjb", "_ZN3art12StackVisitorC2EPNS_6ThreadEPNS_7ContextENS0_13StackWalkKindEmb", "_ZN3art12StackVisitor9WalkStackILNS0_16CountTransitionsE0EEEvb", "_ZNK3art12StackVisitor9GetMethodEv", "_ZNK3art12StackVisitor16DescribeLocationEv", "_ZNK3art12StackVisitor24GetCurrentQuickFrameInfoEv", "_ZN3art6Thread18GetLongJumpContextEv", "_ZN3art6mirror5Class13GetDescriptorEPNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEE", "_ZN3art6mirror5Class11GetLocationEv", "_ZN3art9ArtMethod12PrettyMethodEb", "_ZN3art12PrettyMethodEPNS_9ArtMethodEb", "_ZN3art3Dbg13ConfigureJdwpERKNS_4JDWP11JdwpOptionsE", "_ZN3art31InternalDebuggerControlCallback13StartDebuggerEv", "_ZN3art3Dbg15gDebuggerActiveE", "_ZN3art15instrumentation15Instrumentation20EnableDeoptimizationEv", "_ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEPKc", "_ZN3art15instrumentation15Instrumentation20DeoptimizeEverythingEv", "_ZN3art7Runtime19DeoptimizeBootImageEv", "_ZN3art15instrumentation15Instrumentation10DeoptimizeEPNS_9ArtMethodE", "_ZN3art3Dbg9StartJdwpEv", "_ZN3art3Dbg8GoActiveEv", "_ZN3art3Dbg21RequestDeoptimizationERKNS_21DeoptimizationRequestE", "_ZN3art3Dbg20ManageDeoptimizationEv", "_ZN3art3Dbg9gRegistryE", "_ZN3art3jni12JniIdManager14DecodeMethodIdEP10_jmethodID", "_ZN3art11interpreter18GetNterpEntryPointEv", "_ZN3art7Monitor17TranslateLocationEPNS_9ArtMethodEjPPKcPi" ]
  } ] : [ {
    module: t.path,
    functions: {
      _Z20dvmDecodeIndirectRefP6ThreadP8_jobject: [ "dvmDecodeIndirectRef", "pointer", [ "pointer", "pointer" ] ],
      _Z15dvmUseJNIBridgeP6MethodPv: [ "dvmUseJNIBridge", "void", [ "pointer", "pointer" ] ],
      _Z20dvmHeapSourceGetBasev: [ "dvmHeapSourceGetBase", "pointer", [] ],
      _Z21dvmHeapSourceGetLimitv: [ "dvmHeapSourceGetLimit", "pointer", [] ],
      _Z16dvmIsValidObjectPK6Object: [ "dvmIsValidObject", "uint8", [ "pointer" ] ],
      JNI_GetCreatedJavaVMs: [ "JNI_GetCreatedJavaVMs", "int", [ "pointer", "int", "pointer" ] ]
    },
    variables: {
      gDvmJni: function(e) {
        this.gDvmJni = e;
      },
      gDvm: function(e) {
        this.gDvm = e;
      }
    }
  } ], s = [];
  if (a.forEach((function(e) {
    const t = e.functions || {}, n = e.variables || {}, r = new Set(e.optionals || []), a = Module.enumerateExports(e.module).reduce((function(e, t) {
      return e[t.name] = t, e;
    }), {});
    Object.keys(t).forEach((function(e) {
      const n = a[e];
      if (void 0 !== n && "function" === n.type) {
        const r = t[e];
        "function" == typeof r ? r.call(o, n.address) : o[r[0]] = new NativeFunction(n.address, r[1], r[2], ve);
      } else r.has(e) || s.push(e);
    })), Object.keys(n).forEach((function(e) {
      const t = a[e];
      if (void 0 !== t && "variable" === t.type) {
        n[e].call(o, t.address);
      } else r.has(e) || s.push(e);
    }));
  })), s.length > 0) throw new Error("Java API only partially available; please file a bug. Missing: " + s.join(", "));
  const u = Memory.alloc(l), p = Memory.alloc(d);
  if (i("JNI_GetCreatedJavaVMs", o.JNI_GetCreatedJavaVMs(u, 1, p)), 0 === p.readInt()) return null;
  if (o.vm = u.readPointer(), r) {
    const e = ge();
    let t;
    t = e >= 27 ? 33554432 : e >= 24 ? 16777216 : 0, o.kAccCompileDontBother = t;
    const n = o.vm.add(l).readPointer();
    o.artRuntime = n;
    const r = ce(o), a = r.offset, i = a.instrumentation;
    o.artInstrumentation = null !== i ? n.add(i) : null, o.artHeap = n.add(a.heap).readPointer(), 
    o.artThreadList = n.add(a.threadList).readPointer();
    const s = n.add(a.classLinker).readPointer(), d = Ye(n, r).offset, u = s.add(d.quickResolutionTrampoline).readPointer(), p = s.add(d.quickImtConflictTrampoline).readPointer(), _ = s.add(d.quickGenericJniTrampoline).readPointer(), m = s.add(d.quickToInterpreterBridgeTrampoline).readPointer();
    o.artClassLinker = {
      address: s,
      quickResolutionTrampoline: u,
      quickImtConflictTrampoline: p,
      quickGenericJniTrampoline: _,
      quickToInterpreterBridgeTrampoline: m
    };
    const h = new c(o);
    o.artQuickGenericJniTrampoline = st(_, h), o.artQuickToInterpreterBridge = st(m, h), 
    void 0 === o["art::JavaVMExt::AddGlobalRef"] && (o["art::JavaVMExt::AddGlobalRef"] = Cn(o)), 
    void 0 === o["art::JavaVMExt::DecodeGlobal"] && (o["art::JavaVMExt::DecodeGlobal"] = An(o)), 
    void 0 === o["art::ArtMethod::PrettyMethod"] && (o["art::ArtMethod::PrettyMethod"] = o["art::ArtMethod::PrettyMethodNullSafe"]), 
    void 0 !== o["art::interpreter::GetNterpEntryPoint"] && (o.artNterpEntryPoint = o["art::interpreter::GetNterpEntryPoint"]()), 
    Re = jt(h), zn(o);
    let g = null;
    Object.defineProperty(o, "jvmti", {
      get() {
        return null === g && (g = [ De(h, this.artRuntime) ]), g[0];
      }
    });
  }
  const _ = Module.enumerateImports(t.path).filter((e => 0 === e.name.indexOf("_Z"))).reduce(((e, t) => (e[t.name] = t.address, 
  e)), {});
  return o.$new = new NativeFunction(_._Znwm || _._Znwj, "pointer", [ "ulong" ], ve), 
  o.$delete = new NativeFunction(_._ZdlPv, "void", [ "pointer" ], ve), Ne = r ? mn : bn, 
  o;
}

function De(e, o) {
  let a = null;
  return e.perform((() => {
    const i = new NativeFunction(Module.getExportByName("libart.so", "_ZN3art7Runtime18EnsurePluginLoadedEPKcPNSt3__112basic_stringIcNS3_11char_traitsIcEENS3_9allocatorIcEEEE"), "bool", [ "pointer", "pointer", "pointer" ]), c = Memory.alloc(l);
    if (!i(o, Memory.allocUtf8String("libopenjdkjvmti.so"), c)) return;
    const d = 1073741824 | t.v1_2, u = e.tryGetEnvHandle(d);
    if (null === u) return;
    a = new r(u, e);
    const p = Memory.alloc(8);
    p.writeU64(n.canTagObjects);
    a.addCapabilities(p) !== s && (a = null);
  })), a;
}

function Fe(e, t) {
  "art" === Oe().flavor && (e.getFieldId(t, "x", "Z"), e.exceptionClear());
}

function Ve(e) {
  return {
    offset: 4 === l ? {
      globalsLock: 32,
      globals: 72
    } : {
      globalsLock: 64,
      globals: 112
    }
  };
}

function Ze(e) {
  const t = e.vm, n = e.artRuntime, r = 4 === l ? 200 : 384, o = r + 100 * l, a = ge(), i = he();
  let s = null;
  for (let e = r; e !== o; e += l) {
    if (n.add(e).readPointer().equals(t)) {
      let t, r = null;
      a >= 33 || "Tiramisu" === i ? (t = [ e - 4 * l ], r = e - l) : a >= 30 || "R" === i ? (t = [ e - 3 * l, e - 4 * l ], 
      r = e - l) : t = a >= 29 ? [ e - 2 * l ] : a >= 27 ? [ e - oe - 3 * l ] : [ e - oe - 2 * l ];
      for (const e of t) {
        const t = e - l, o = t - l;
        let i;
        i = a >= 24 ? o - 8 * l : a >= 23 ? o - 7 * l : o - 4 * l;
        const c = {
          offset: {
            heap: i,
            threadList: o,
            internTable: t,
            classLinker: e,
            jniIdManager: r
          }
        };
        if (null !== et(n, c)) {
          s = c;
          break;
        }
      }
      break;
    }
  }
  if (null === s) throw new Error("Unable to determine Runtime field offsets");
  return s.offset.instrumentation = Ue(e), s.offset.jniIdsIndirection = He(), s;
}

const Je = {
  ia32: Ge,
  x64: Ge,
  arm: Be,
  arm64: qe
};

function Ue(e) {
  const t = e["art::Runtime::DeoptimizeBootImage"];
  return void 0 === t ? null : o(t, Je[Process.arch], {
    limit: 30
  });
}

function Ge(e) {
  if ("lea" !== e.mnemonic) return null;
  const t = e.operands[1].value.disp;
  return t < 256 || t > 1024 ? null : t;
}

function Be(e) {
  if ("add.w" !== e.mnemonic) return null;
  const t = e.operands;
  if (3 !== t.length) return null;
  const n = t[2];
  return "imm" !== n.type ? null : n.value;
}

function qe(e) {
  if ("add" !== e.mnemonic) return null;
  const t = e.operands;
  if (3 !== t.length) return null;
  if ("sp" === t[0].value || "sp" === t[1].value) return null;
  const n = t[2];
  if ("imm" !== n.type) return null;
  const r = n.value.valueOf();
  return r < 256 || r > 1024 ? null : r;
}

const We = {
  ia32: Ke,
  x64: Ke,
  arm: Qe,
  arm64: $e
};

function He() {
  const e = Module.findExportByName("libart.so", "_ZN3art7Runtime12SetJniIdTypeENS_9JniIdTypeE");
  if (null === e) return null;
  const t = o(e, We[Process.arch], {
    limit: 20
  });
  if (null === t) throw new Error("Unable to determine Runtime.jni_ids_indirection_ offset");
  return t;
}

function Ke(e) {
  return "cmp" === e.mnemonic ? e.operands[0].value.disp : null;
}

function Qe(e) {
  return "ldr.w" === e.mnemonic ? e.operands[1].value.disp : null;
}

function $e(e, t) {
  if (null === t) return null;
  const {mnemonic: n} = e, {mnemonic: r} = t;
  return "cmp" === n && "ldr" === r || "bl" === n && "str" === r ? t.operands[1].value.disp : null;
}

function Xe() {
  const e = {
    "4-21": 136,
    "4-22": 136,
    "4-23": 172,
    "4-24": 196,
    "4-25": 196,
    "4-26": 196,
    "4-27": 196,
    "4-28": 212,
    "4-29": 172,
    "4-30": 180,
    "8-21": 224,
    "8-22": 224,
    "8-23": 296,
    "8-24": 344,
    "8-25": 344,
    "8-26": 352,
    "8-27": 352,
    "8-28": 392,
    "8-29": 328,
    "8-30": 336
  }[`${l}-${ge()}`];
  if (void 0 === e) throw new Error("Unable to determine Instrumentation field offsets");
  return {
    offset: {
      forcedInterpretOnly: 4,
      deoptimizationEnabled: e
    }
  };
}

function Ye(e, t) {
  const n = et(e, t);
  if (null === n) throw new Error("Unable to determine ClassLinker field offsets");
  return n;
}

function et(e, t) {
  if (null !== Ee) return Ee;
  const {classLinker: n, internTable: r} = t.offset, o = e.add(n).readPointer(), a = e.add(r).readPointer(), i = 4 === l ? 100 : 200, s = i + 100 * l, c = ge();
  let d = null;
  for (let e = i; e !== s; e += l) {
    if (o.add(e).readPointer().equals(a)) {
      let t;
      t = c >= 30 || "R" === he() ? 6 : c >= 29 ? 4 : c >= 23 ? 3 : 5;
      const n = e + t * l;
      let r;
      r = c >= 23 ? n - 2 * l : n - 3 * l, d = {
        offset: {
          quickResolutionTrampoline: r,
          quickImtConflictTrampoline: n - l,
          quickGenericJniTrampoline: n,
          quickToInterpreterBridgeTrampoline: n + l
        }
      };
      break;
    }
  }
  return null !== d && (Ee = d), d;
}

function tt(e) {
  let t, n, r;
  try {
    t = ge();
  } catch (e) {
    return null;
  }
  return t < 24 ? null : (t >= 26 ? (n = 40, r = 116) : (n = 56, r = 124), {
    offset: {
      ifields: n,
      methods: n + 8,
      sfields: n + 16,
      copiedMethodsOffset: r
    }
  });
}

function nt(e) {
  const t = Oe();
  let n;
  return e.perform((e => {
    const r = e.findClass("android/os/Process"), o = en(e.getStaticMethodId(r, "getElapsedCpuTime", "()J"));
    e.deleteLocalRef(r);
    const a = Process.getModuleByName("libandroid_runtime.so"), i = a.base, s = i.add(a.size), c = ge(), d = c <= 21 ? 8 : l;
    let u = null, p = null, _ = 2;
    for (let e = 0; 64 !== e && 0 !== _; e += 4) {
      const t = o.add(e);
      if (null === u) {
        const n = t.readPointer();
        n.compare(i) >= 0 && n.compare(s) < 0 && (u = e, _--);
      }
      if (null === p) {
        281 == (2950692863 & t.readU32()) && (p = e, _--);
      }
    }
    if (0 !== _) throw new Error("Unable to determine ArtMethod field offsets");
    const m = u + d;
    n = {
      size: c <= 21 ? m + 32 : m + l,
      offset: {
        jniCode: u,
        quickCode: m,
        accessFlags: p
      }
    }, "artInterpreterToCompiledCodeBridge" in t && (n.offset.interpreterCode = u - d);
  })), n;
}

function rt(e) {
  const t = ge();
  return t >= 23 ? {
    size: 16,
    offset: {
      accessFlags: 4
    }
  } : t >= 21 ? {
    size: 24,
    offset: {
      accessFlags: 12
    }
  } : null;
}

function ot(e) {
  const t = ge();
  let n;
  return e.perform((e => {
    const r = ut(e), o = e.handle;
    let a = null, i = null, s = null, c = null, d = null, u = null;
    for (let e = 144; 256 !== e; e += l) {
      if (r.add(e).readPointer().equals(o)) {
        i = e - 6 * l, d = e - 4 * l, u = e + 2 * l, t <= 22 && (i -= l, a = i - l - 72 - 12, 
        s = e + 6 * l, d -= l, u -= l), c = e + 9 * l, t <= 22 && (c += 2 * l + 4, 8 === l && (c += 4)), 
        t >= 23 && (c += l);
        break;
      }
    }
    if (null === c) throw new Error("Unable to determine ArtThread field offsets");
    n = {
      offset: {
        isExceptionReportedToInstrumentation: a,
        exception: i,
        throwLocation: s,
        topHandleScope: c,
        managedStack: d,
        self: u
      }
    };
  })), n;
}

function at() {
  return ge() >= 23 ? {
    offset: {
      topQuickFrame: 0,
      link: l
    }
  } : {
    offset: {
      topQuickFrame: 2 * l,
      link: 0
    }
  };
}

const it = {
  ia32: ct,
  x64: ct,
  arm: dt,
  arm64: lt
};

function st(e, t) {
  let n;
  return t.perform((t => {
    const r = ut(t), o = (0, it[Process.arch])(Instruction.parse(e));
    n = null !== o ? r.add(o).readPointer() : e;
  })), n;
}

function ct(e) {
  return "jmp" === e.mnemonic ? e.operands[0].value.disp : null;
}

function dt(e) {
  return "ldr.w" === e.mnemonic ? e.operands[1].value.disp : null;
}

function lt(e) {
  return "ldr" === e.mnemonic ? e.operands[1].value.disp : null;
}

function ut(e) {
  return e.handle.add(l).readPointer();
}

function pt() {
  return ft("ro.build.version.release");
}

function _t() {
  return ft("ro.build.version.codename");
}

function mt() {
  return parseInt(ft("ro.build.version.sdk"), 10);
}

let ht = null;

const gt = 92;

function ft(e) {
  null === ht && (ht = new NativeFunction(Module.getExportByName("libc.so", "__system_property_get"), "int", [ "pointer", "pointer" ], ve));
  const t = Memory.alloc(gt);
  return ht(Memory.allocUtf8String(e), t), t.readUtf8String();
}

function bt(e, t, n) {
  const r = _e(e, t), o = ut(t).toString();
  if (ke[o] = n, r(t.handle), void 0 !== ke[o]) throw delete ke[o], new Error("Unable to perform state transition; please file a bug");
}

function vt(e, t) {
  return In(e, t, new NativeCallback(kt, "void", [ "pointer" ]));
}

function kt(e) {
  const t = e.toString(), n = ke[t];
  delete ke[t], n(e);
}

function St(e) {
  const t = Oe(), n = t.artThreadList;
  t["art::ThreadList::SuspendAll"](n, Memory.allocUtf8String("frida"), 0);
  try {
    e();
  } finally {
    t["art::ThreadList::ResumeAll"](n);
  }
}

class Et {
  constructor(e) {
    const t = Memory.alloc(4 * l), n = t.add(l);
    t.writePointer(n);
    const r = new NativeCallback(((t, n) => !0 === e(n) ? 1 : 0), "bool", [ "pointer", "pointer" ]);
    n.add(2 * l).writePointer(r), this.handle = t, this._onVisit = r;
  }
}

function Nt(e) {
  return Oe()["art::ClassLinker::VisitClasses"] instanceof NativeFunction ? new Et(e) : new NativeCallback((t => !0 === e(t) ? 1 : 0), "bool", [ "pointer", "pointer" ]);
}

class Rt {
  constructor(e) {
    const t = Memory.alloc(4 * l), n = t.add(l);
    t.writePointer(n);
    const r = new NativeCallback(((t, n) => {
      e(n);
    }), "void", [ "pointer", "pointer" ]);
    n.add(2 * l).writePointer(r), this.handle = t, this._onVisit = r;
  }
}

function wt(e) {
  return new Rt(e);
}

const Pt = {
  "include-inlined-frames": 0,
  "skip-inlined-frames": 1
};

class xt {
  constructor(e, t, n, r = 0, o = !0) {
    const a = Oe(), i = 3 * l, s = Memory.alloc(512 + i);
    a["art::StackVisitor::StackVisitor"](s, e, t, Pt[n], r, o ? 1 : 0);
    const c = s.add(512);
    s.writePointer(c);
    const d = new NativeCallback(this._visitFrame.bind(this), "bool", [ "pointer" ]);
    c.add(2 * l).writePointer(d), this.handle = s, this._onVisitFrame = d;
    const u = s.add(4 === l ? 12 : 24);
    this._curShadowFrame = u, this._curQuickFrame = u.add(l), this._curQuickFramePc = u.add(2 * l), 
    this._curOatQuickMethodHeader = u.add(3 * l), this._getMethodImpl = a["art::StackVisitor::GetMethod"], 
    this._descLocImpl = a["art::StackVisitor::DescribeLocation"], this._getCQFIImpl = a["art::StackVisitor::GetCurrentQuickFrameInfo"];
  }
  walkStack(e = !1) {
    Oe()["art::StackVisitor::WalkStack"](this.handle, e ? 1 : 0);
  }
  _visitFrame() {
    return this.visitFrame() ? 1 : 0;
  }
  visitFrame() {
    throw new Error("Subclass must implement visitFrame");
  }
  getMethod() {
    const e = this._getMethodImpl(this.handle);
    return e.isNull() ? null : new Mt(e);
  }
  getCurrentQuickFramePc() {
    return this._curQuickFramePc.readPointer();
  }
  getCurrentQuickFrame() {
    return this._curQuickFrame.readPointer();
  }
  getCurrentShadowFrame() {
    return this._curShadowFrame.readPointer();
  }
  describeLocation() {
    const e = new Jn;
    return this._descLocImpl(e, this.handle), e.disposeToString();
  }
  getCurrentOatQuickMethodHeader() {
    return this._curOatQuickMethodHeader.readPointer();
  }
  getCurrentQuickFrameInfo() {
    return this._getCQFIImpl(this.handle);
  }
}

class Mt {
  constructor(e) {
    this.handle = e;
  }
  prettyMethod(e = !0) {
    const t = new Jn;
    return Oe()["art::ArtMethod::PrettyMethod"](t, this.handle, e ? 1 : 0), t.disposeToString();
  }
  toString() {
    return `ArtMethod(handle=${this.handle})`;
  }
}

function Ct(e) {
  return function(t) {
    const n = Memory.alloc(12);
    return fe(e)(n, t), {
      frameSizeInBytes: n.readU32(),
      coreSpillMask: n.add(4).readU32(),
      fpSpillMask: n.add(8).readU32()
    };
  };
}

function At(e) {
  let t = NULL;
  switch (Process.arch) {
   case "ia32":
    t = Lt(32, (t => {
      t.putMovRegRegOffsetPtr("ecx", "esp", 4), t.putMovRegRegOffsetPtr("edx", "esp", 8), 
      t.putCallAddressWithArguments(e, [ "ecx", "edx" ]), t.putMovRegReg("esp", "ebp"), 
      t.putPopReg("ebp"), t.putRet();
    }));
    break;

   case "x64":
    t = Lt(32, (t => {
      t.putPushReg("rdi"), t.putCallAddressWithArguments(e, [ "rsi" ]), t.putPopReg("rdi"), 
      t.putMovRegPtrReg("rdi", "rax"), t.putMovRegOffsetPtrReg("rdi", 8, "edx"), t.putRet();
    }));
    break;

   case "arm":
    t = Lt(16, (t => {
      t.putCallAddressWithArguments(e, [ "r0", "r1" ]), t.putPopRegs([ "r0", "lr" ]), 
      t.putMovRegReg("pc", "lr");
    }));
    break;

   case "arm64":
    t = Lt(64, (t => {
      t.putPushRegReg("x0", "lr"), t.putCallAddressWithArguments(e, [ "x1" ]), t.putPopRegReg("x2", "lr"), 
      t.putStrRegRegOffset("x0", "x2", 0), t.putStrRegRegOffset("w1", "x2", 8), t.putRet();
    }));
  }
  return new NativeFunction(t, "void", [ "pointer", "pointer" ], ve);
}

const yt = {
  ia32: global.X86Relocator,
  x64: global.X86Relocator,
  arm: global.ThumbRelocator,
  arm64: global.Arm64Relocator
}, It = {
  ia32: global.X86Writer,
  x64: global.X86Writer,
  arm: global.ThumbWriter,
  arm64: global.Arm64Writer
};

function Lt(e, t) {
  null === Me && (Me = Memory.alloc(Process.pageSize));
  const n = Me.add(Ce), r = Process.arch, o = It[r];
  return Memory.patchCode(n, e, (r => {
    const a = new o(r, {
      pc: n
    });
    if (t(a), a.flush(), a.offset > e) throw new Error(`Wrote ${a.offset}, exceeding maximum of ${e}`);
  })), Ce += e, "arm" === r ? n.or(1) : n;
}

function Tt(e, t) {
  Ot(t), Ft(t);
}

function jt(e) {
  const t = ue(e).offset, n = pe().offset, r = `\n#include <gum/guminterceptor.h>\n\nextern GMutex lock;\nextern GHashTable * methods;\nextern GHashTable * replacements;\nextern gpointer last_seen_art_method;\n\nextern gpointer get_oat_quick_method_header_impl (gpointer method, gpointer pc);\n\nvoid\ninit (void)\n{\n  g_mutex_init (&lock);\n  methods = g_hash_table_new_full (NULL, NULL, NULL, NULL);\n  replacements = g_hash_table_new_full (NULL, NULL, NULL, NULL);\n}\n\nvoid\nfinalize (void)\n{\n  g_hash_table_unref (replacements);\n  g_hash_table_unref (methods);\n  g_mutex_clear (&lock);\n}\n\ngboolean\nis_replacement_method (gpointer method)\n{\n  gboolean is_replacement;\n\n  g_mutex_lock (&lock);\n\n  is_replacement = g_hash_table_contains (replacements, method);\n\n  g_mutex_unlock (&lock);\n\n  return is_replacement;\n}\n\ngpointer\nget_replacement_method (gpointer original_method)\n{\n  gpointer replacement_method;\n\n  g_mutex_lock (&lock);\n\n  replacement_method = g_hash_table_lookup (methods, original_method);\n\n  g_mutex_unlock (&lock);\n\n  return replacement_method;\n}\n\nvoid\nset_replacement_method (gpointer original_method,\n                        gpointer replacement_method)\n{\n  g_mutex_lock (&lock);\n\n  g_hash_table_insert (methods, original_method, replacement_method);\n  g_hash_table_insert (replacements, replacement_method, original_method);\n\n  g_mutex_unlock (&lock);\n}\n\nvoid\ndelete_replacement_method (gpointer original_method)\n{\n  gpointer replacement_method;\n\n  g_mutex_lock (&lock);\n\n  replacement_method = g_hash_table_lookup (methods, original_method);\n  if (replacement_method != NULL)\n  {\n    g_hash_table_remove (methods, original_method);\n    g_hash_table_remove (replacements, replacement_method);\n  }\n\n  g_mutex_unlock (&lock);\n}\n\ngpointer\ntranslate_method (gpointer method)\n{\n  gpointer translated_method;\n\n  g_mutex_lock (&lock);\n\n  translated_method = g_hash_table_lookup (replacements, method);\n\n  g_mutex_unlock (&lock);\n\n  return (translated_method != NULL) ? translated_method : method;\n}\n\ngpointer\nfind_replacement_method_from_quick_code (gpointer method,\n                                         gpointer thread)\n{\n  gpointer replacement_method;\n  gpointer managed_stack;\n  gpointer top_quick_frame;\n  gpointer link_managed_stack;\n  gpointer * link_top_quick_frame;\n\n  replacement_method = get_replacement_method (method);\n  if (replacement_method == NULL)\n    return NULL;\n\n  /*\n   * Stack check.\n   *\n   * Return NULL to indicate that the original method should be invoked, otherwise\n   * return a pointer to the replacement ArtMethod.\n   *\n   * If the caller is our own JNI replacement stub, then a stack transition must\n   * have been pushed onto the current thread's linked list.\n   *\n   * Therefore, we invoke the original method if the following conditions are met:\n   *   1- The current managed stack is empty.\n   *   2- The ArtMethod * inside the linked managed stack's top quick frame is the\n   *      same as our replacement.\n   */\n  managed_stack = thread + ${t.managedStack};\n  top_quick_frame = *((gpointer *) (managed_stack + ${n.topQuickFrame}));\n  if (top_quick_frame != NULL)\n    return replacement_method;\n\n  link_managed_stack = *((gpointer *) (managed_stack + ${n.link}));\n  if (link_managed_stack == NULL)\n    return replacement_method;\n\n  link_top_quick_frame = GSIZE_TO_POINTER (*((gsize *) (link_managed_stack + ${n.topQuickFrame})) & ~((gsize) 1));\n  if (link_top_quick_frame == NULL || *link_top_quick_frame != replacement_method)\n    return replacement_method;\n\n  return NULL;\n}\n\nvoid\non_interpreter_do_call (GumInvocationContext * ic)\n{\n  gpointer method, replacement_method;\n\n  method = gum_invocation_context_get_nth_argument (ic, 0);\n\n  replacement_method = get_replacement_method (method);\n  if (replacement_method != NULL)\n    gum_invocation_context_replace_nth_argument (ic, 0, replacement_method);\n}\n\ngpointer\non_art_method_get_oat_quick_method_header (gpointer method,\n                                           gpointer pc)\n{\n  if (is_replacement_method (method))\n    return NULL;\n\n  return get_oat_quick_method_header_impl (method, pc);\n}\n\nvoid\non_art_method_pretty_method (GumInvocationContext * ic)\n{\n  const guint this_arg_index = ${"arm64" === Process.arch ? 0 : 1};\n  gpointer method;\n\n  method = gum_invocation_context_get_nth_argument (ic, this_arg_index);\n  if (method == NULL)\n    gum_invocation_context_replace_nth_argument (ic, this_arg_index, last_seen_art_method);\n  else\n    last_seen_art_method = method;\n}\n\nvoid\non_leave_gc_concurrent_copying_copying_phase (GumInvocationContext * ic)\n{\n  GHashTableIter iter;\n  gpointer hooked_method, replacement_method;\n\n  g_mutex_lock (&lock);\n\n  g_hash_table_iter_init (&iter, methods);\n  while (g_hash_table_iter_next (&iter, &hooked_method, &replacement_method))\n    *((uint32_t *) replacement_method) = *((uint32_t *) hooked_method);\n\n  g_mutex_unlock (&lock);\n}\n`, o = l, a = l, i = l, s = Memory.alloc(8 + o + a + i), c = s.add(8), d = c.add(o), u = d.add(a), p = Module.findExportByName("libart.so", 4 === l ? "_ZN3art9ArtMethod23GetOatQuickMethodHeaderEj" : "_ZN3art9ArtMethod23GetOatQuickMethodHeaderEm"), _ = new CModule(r, {
    lock: s,
    methods: c,
    replacements: d,
    last_seen_art_method: u,
    get_oat_quick_method_header_impl: p ?? ptr("0xdeadbeef")
  }), m = {
    exceptions: "propagate",
    scheduling: "exclusive"
  };
  return {
    handle: _,
    replacedMethods: {
      isReplacement: new NativeFunction(_.is_replacement_method, "bool", [ "pointer" ], m),
      get: new NativeFunction(_.get_replacement_method, "pointer", [ "pointer" ], m),
      set: new NativeFunction(_.set_replacement_method, "void", [ "pointer", "pointer" ], m),
      delete: new NativeFunction(_.delete_replacement_method, "void", [ "pointer" ], m),
      translate: new NativeFunction(_.translate_method, "pointer", [ "pointer" ], m),
      findReplacementFromQuickCode: _.find_replacement_method_from_quick_code
    },
    getOatQuickMethodHeaderImpl: p,
    hooks: {
      Interpreter: {
        doCall: _.on_interpreter_do_call
      },
      ArtMethod: {
        getOatQuickMethodHeader: _.on_art_method_get_oat_quick_method_header,
        prettyMethod: _.on_art_method_pretty_method
      },
      Gc: {
        copyingPhase: {
          onLeave: _.on_leave_gc_concurrent_copying_copying_phase
        }
      }
    }
  };
}

function Ot(e) {
  ye || (ye = !0, zt(e), Dt());
}

function zt(e) {
  const t = Oe();
  [ t.artQuickGenericJniTrampoline, t.artQuickToInterpreterBridge ].forEach((t => {
    Memory.protect(t, 32, "rwx");
    const n = new pn(t);
    n.activate(e), xe.push(n);
  }));
}

function Dt() {
  const e = ge();
  let t;
  t = e <= 22 ? /^_ZN3art11interpreter6DoCallILb[0-1]ELb[0-1]EEEbPNS_6mirror9ArtMethodEPNS_6ThreadERNS_11ShadowFrameEPKNS_11InstructionEtPNS_6JValueE$/ : /^_ZN3art11interpreter6DoCallILb[0-1]ELb[0-1]EEEbPNS_9ArtMethodEPNS_6ThreadERNS_11ShadowFrameEPKNS_11InstructionEtPNS_6JValueE$/;
  for (const e of Module.enumerateExports("libart.so").filter((e => t.test(e.name)))) Interceptor.attach(e.address, Re.hooks.Interpreter.doCall);
}

function Ft(e) {
  if (Ae) return;
  if (Ae = !0, !Ut()) {
    const {getOatQuickMethodHeaderImpl: e} = Re;
    if (null === e) return;
    try {
      Interceptor.replace(e, Re.hooks.ArtMethod.getOatQuickMethodHeader);
    } catch (e) {}
  }
  const t = ge();
  let n = null;
  t > 28 ? n = "_ZN3art2gc9collector17ConcurrentCopying12CopyingPhaseEv" : t > 22 && (n = "_ZN3art2gc9collector17ConcurrentCopying12MarkingPhaseEv"), 
  null !== n && Interceptor.attach(Module.getExportByName("libart.so", n), Re.hooks.Gc.copyingPhase);
}

const Vt = {
  arm: {
    signatures: [ {
      pattern: [ "b0 68", "01 30", "0c d0", "1b 98", ":", "c0 ff", "c0 ff", "00 ff", "00 2f" ],
      validateMatch: Zt
    }, {
      pattern: [ "d8 f8 08 00", "01 30", "0c d0", "1b 98", ":", "f0 ff ff 0f", "ff ff", "00 ff", "00 2f" ],
      validateMatch: Zt
    }, {
      pattern: [ "b0 68", "01 30", "40 f0 c3 80", "00 25", ":", "c0 ff", "c0 ff", "c0 fb 00 d0", "ff f8" ],
      validateMatch: Zt
    } ],
    instrument: qt
  },
  arm64: {
    signatures: [ {
      pattern: [ "0a 40 b9", "1f 05 00 31", "40 01 00 54", "88 39 00 f0", ":", "fc ff ff", "1f fc ff ff", "1f 00 00 ff", "00 00 00 9f" ],
      offset: 1,
      validateMatch: Jt
    }, {
      pattern: [ "0a 40 b9", "1f 05 00 31", "01 34 00 54", "e0 03 1f aa", ":", "fc ff ff", "1f fc ff ff", "1f 00 00 ff", "e0 ff ff ff" ],
      offset: 1,
      validateMatch: Jt
    } ],
    instrument: Wt
  }
};

function Zt({address: e, size: t}) {
  const n = Instruction.parse(e.or(1)), [r, a] = n.operands, i = a.value.base, s = r.value, c = Instruction.parse(n.next.add(2)), d = ptr(c.operands[0].value), l = c.address.add(c.size);
  let u, p;
  return "beq" === c.mnemonic ? (u = l, p = d) : (u = d, p = l), o(u.or(1), (function(e) {
    const {mnemonic: t} = e;
    if ("ldr" !== t && "ldr.w" !== t) return null;
    const {base: n, disp: r} = e.operands[1].value;
    if (n !== i || 20 !== r) return null;
    return {
      methodReg: i,
      scratchReg: s,
      target: {
        whenTrue: d,
        whenRegularMethod: u,
        whenRuntimeMethod: p
      }
    };
  }), {
    limit: 3
  });
}

function Jt({address: e, size: t}) {
  const [n, r] = Instruction.parse(e).operands, a = r.value.base, i = "x" + n.value.substring(1), s = Instruction.parse(e.add(8)), c = ptr(s.operands[0].value), d = e.add(12);
  let l, u;
  return "b.eq" === s.mnemonic ? (l = d, u = c) : (l = c, u = d), o(l, (function(e) {
    if ("ldr" !== e.mnemonic) return null;
    const {base: t, disp: n} = e.operands[1].value;
    if (t !== a || 24 !== n) return null;
    return {
      methodReg: a,
      scratchReg: i,
      target: {
        whenTrue: c,
        whenRegularMethod: l,
        whenRuntimeMethod: u
      }
    };
  }), {
    limit: 3
  });
}

function Ut() {
  if (ge() < 31) return !1;
  const e = Vt[Process.arch];
  if (void 0 === e) return !1;
  const t = e.signatures.map((({pattern: e, offset: t = 0, validateMatch: n = Gt}) => ({
    pattern: new MatchPattern(e.join("")),
    offset: t,
    validateMatch: n
  }))), n = [];
  for (const {base: e, size: r} of Oe().module.enumerateRanges("--x")) for (const {pattern: o, offset: a, validateMatch: i} of t) {
    const t = Memory.scanSync(e, r, o).map((({address: e, size: t}) => ({
      address: e.sub(a),
      size: t + a
    }))).filter((e => {
      const t = i(e);
      return null !== t && (e.validationResult = t, !0);
    }));
    n.push(...t);
  }
  return 0 !== n.length && (n.forEach(e.instrument), !0);
}

function Gt() {
  return {};
}

class Bt {
  constructor(e, t, n) {
    this.address = e, this.size = t, this.originalCode = e.readByteArray(t), this.trampoline = n;
  }
  revert() {
    Memory.patchCode(this.address, this.size, (e => {
      e.writeByteArray(this.originalCode);
    }));
  }
}

function qt({address: e, size: t, validationResult: n}) {
  const {methodReg: r, target: o} = n, a = Memory.alloc(Process.pageSize);
  let i = t;
  Memory.patchCode(a, 256, (t => {
    const n = new ThumbWriter(t, {
      pc: a
    }), s = new ThumbRelocator(e, n);
    for (let e = 0; 2 !== e; e++) s.readOne();
    s.writeAll(), s.readOne(), s.skipOne(), n.putBCondLabel("eq", "runtime_or_replacement_method");
    n.putBytes([ 45, 237, 16, 10 ]);
    const c = [ "r0", "r1", "r2", "r3" ];
    n.putPushRegs(c), n.putCallAddressWithArguments(Re.replacedMethods.isReplacement, [ r ]), 
    n.putCmpRegImm("r0", 0), n.putPopRegs(c);
    n.putBytes([ 189, 236, 16, 10 ]), n.putBCondLabel("ne", "runtime_or_replacement_method"), 
    n.putBLabel("regular_method"), s.readOne();
    const d = s.input.address.equals(o.whenRegularMethod);
    for (n.putLabel(d ? "regular_method" : "runtime_or_replacement_method"), s.writeOne(); i < 10; ) {
      const e = s.readOne();
      if (0 === e) {
        i = 10;
        break;
      }
      i = e;
    }
    s.writeAll(), n.putBranchAddress(e.add(i + 1)), n.putLabel(d ? "runtime_or_replacement_method" : "regular_method"), 
    n.putBranchAddress(o.whenTrue), n.flush();
  })), we.push(new Bt(e, i, a)), Memory.patchCode(e, i, (t => {
    const n = new ThumbWriter(t, {
      pc: e
    });
    n.putLdrRegAddress("pc", a.or(1)), n.flush();
  }));
}

function Wt({address: e, size: t, validationResult: n}) {
  const {methodReg: r, scratchReg: o, target: a} = n, i = Memory.alloc(Process.pageSize);
  Memory.patchCode(i, 256, (t => {
    const n = new Arm64Writer(t, {
      pc: i
    }), o = new Arm64Relocator(e, n);
    for (let e = 0; 2 !== e; e++) o.readOne();
    o.writeAll(), o.readOne(), o.skipOne(), n.putBCondLabel("eq", "runtime_or_replacement_method");
    const s = [ "d0", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8", "x9", "x10", "x11", "x12", "x13", "x14", "x15", "x16", "x17" ], c = s.length;
    for (let e = 0; e !== c; e += 2) n.putPushRegReg(s[e], s[e + 1]);
    n.putCallAddressWithArguments(Re.replacedMethods.isReplacement, [ r ]), n.putCmpRegReg("x0", "xzr");
    for (let e = c - 2; e >= 0; e -= 2) n.putPopRegReg(s[e], s[e + 1]);
    n.putBCondLabel("ne", "runtime_or_replacement_method"), n.putBLabel("regular_method"), 
    o.readOne();
    const d = o.input, l = d.address.equals(a.whenRegularMethod);
    n.putLabel(l ? "regular_method" : "runtime_or_replacement_method"), o.writeOne(), 
    n.putBranchAddress(d.next), n.putLabel(l ? "runtime_or_replacement_method" : "regular_method"), 
    n.putBranchAddress(a.whenTrue), n.flush();
  })), we.push(new Bt(e, t, i)), Memory.patchCode(e, t, (t => {
    const n = new Arm64Writer(t, {
      pc: e
    });
    n.putLdrRegAddress(o, i), n.putBrReg(o), n.flush();
  }));
}

function Ht(e) {
  return new Ne(e);
}

function Kt(e) {
  return Re.replacedMethods.translate(e);
}

function Qt(e, t = {}) {
  const {limit: n = 16} = t, r = e.getEnv();
  return null === Ie && (Ie = $t(e, r)), Ie.backtrace(r, n);
}

function $t(e, t) {
  const n = Oe(), r = Memory.alloc(Process.pointerSize), o = new CModule("\n#include <glib.h>\n#include <stdbool.h>\n#include <string.h>\n#include <gum/gumtls.h>\n#include <json-glib/json-glib.h>\n\ntypedef struct _ArtBacktrace ArtBacktrace;\ntypedef struct _ArtStackFrame ArtStackFrame;\n\ntypedef struct _ArtStackVisitor ArtStackVisitor;\ntypedef struct _ArtStackVisitorVTable ArtStackVisitorVTable;\n\ntypedef struct _ArtClass ArtClass;\ntypedef struct _ArtMethod ArtMethod;\ntypedef struct _ArtThread ArtThread;\ntypedef struct _ArtContext ArtContext;\n\ntypedef struct _JNIEnv JNIEnv;\n\ntypedef struct _StdString StdString;\ntypedef struct _StdTinyString StdTinyString;\ntypedef struct _StdLargeString StdLargeString;\n\ntypedef enum {\n  STACK_WALK_INCLUDE_INLINED_FRAMES,\n  STACK_WALK_SKIP_INLINED_FRAMES,\n} StackWalkKind;\n\nstruct _StdTinyString\n{\n  guint8 unused;\n  gchar data[(3 * sizeof (gpointer)) - 1];\n};\n\nstruct _StdLargeString\n{\n  gsize capacity;\n  gsize size;\n  gchar * data;\n};\n\nstruct _StdString\n{\n  union\n  {\n    guint8 flags;\n    StdTinyString tiny;\n    StdLargeString large;\n  };\n};\n\nstruct _ArtBacktrace\n{\n  GChecksum * id;\n  GArray * frames;\n  gchar * frames_json;\n};\n\nstruct _ArtStackFrame\n{\n  ArtMethod * method;\n  gsize dexpc;\n  StdString description;\n};\n\nstruct _ArtStackVisitorVTable\n{\n  void (* unused1) (void);\n  void (* unused2) (void);\n  bool (* visit) (ArtStackVisitor * visitor);\n};\n\nstruct _ArtStackVisitor\n{\n  ArtStackVisitorVTable * vtable;\n\n  guint8 padding[512];\n\n  ArtStackVisitorVTable vtable_storage;\n\n  ArtBacktrace * backtrace;\n};\n\nstruct _ArtMethod\n{\n  guint32 declaring_class;\n  guint32 access_flags;\n};\n\nextern GumTlsKey current_backtrace;\n\nextern void (* perform_art_thread_state_transition) (JNIEnv * env);\n\nextern ArtContext * art_thread_get_long_jump_context (ArtThread * thread);\n\nextern void art_stack_visitor_init (ArtStackVisitor * visitor, ArtThread * thread, void * context, StackWalkKind walk_kind,\n    size_t num_frames, bool check_suspended);\nextern void art_stack_visitor_walk_stack (ArtStackVisitor * visitor, bool include_transitions);\nextern ArtMethod * art_stack_visitor_get_method (ArtStackVisitor * visitor);\nextern void art_stack_visitor_describe_location (StdString * description, ArtStackVisitor * visitor);\nextern ArtMethod * translate_method (ArtMethod * method);\nextern void translate_location (ArtMethod * method, guint32 pc, const gchar ** source_file, gint32 * line_number);\nextern void get_class_location (StdString * result, ArtClass * klass);\nextern void cxx_delete (void * mem);\nextern unsigned long strtoul (const char * str, char ** endptr, int base);\n\nstatic bool visit_frame (ArtStackVisitor * visitor);\nstatic void art_stack_frame_destroy (ArtStackFrame * frame);\n\nstatic void append_jni_type_name (GString * s, const gchar * name, gsize length);\n\nstatic void std_string_destroy (StdString * str);\nstatic gchar * std_string_get_data (StdString * str);\n\nvoid\ninit (void)\n{\n  current_backtrace = gum_tls_key_new ();\n}\n\nvoid\nfinalize (void)\n{\n  gum_tls_key_free (current_backtrace);\n}\n\nArtBacktrace *\n_create (JNIEnv * env,\n         guint limit)\n{\n  ArtBacktrace * bt;\n\n  bt = g_new (ArtBacktrace, 1);\n  bt->id = g_checksum_new (G_CHECKSUM_SHA1);\n  bt->frames = (limit != 0)\n      ? g_array_sized_new (FALSE, FALSE, sizeof (ArtStackFrame), limit)\n      : g_array_new (FALSE, FALSE, sizeof (ArtStackFrame));\n  g_array_set_clear_func (bt->frames, (GDestroyNotify) art_stack_frame_destroy);\n  bt->frames_json = NULL;\n\n  gum_tls_key_set_value (current_backtrace, bt);\n\n  perform_art_thread_state_transition (env);\n\n  gum_tls_key_set_value (current_backtrace, NULL);\n\n  return bt;\n}\n\nvoid\n_on_thread_state_transition_complete (ArtThread * thread)\n{\n  ArtContext * context;\n  ArtStackVisitor visitor = {\n    .vtable_storage = {\n      .visit = visit_frame,\n    },\n  };\n\n  context = art_thread_get_long_jump_context (thread);\n\n  art_stack_visitor_init (&visitor, thread, context, STACK_WALK_SKIP_INLINED_FRAMES, 0, true);\n  visitor.vtable = &visitor.vtable_storage;\n  visitor.backtrace = gum_tls_key_get_value (current_backtrace);\n\n  art_stack_visitor_walk_stack (&visitor, false);\n\n  cxx_delete (context);\n}\n\nstatic bool\nvisit_frame (ArtStackVisitor * visitor)\n{\n  ArtBacktrace * bt = visitor->backtrace;\n  ArtStackFrame frame;\n  const gchar * description, * dexpc_part;\n\n  frame.method = art_stack_visitor_get_method (visitor);\n\n  art_stack_visitor_describe_location (&frame.description, visitor);\n\n  description = std_string_get_data (&frame.description);\n  if (strstr (description, \" '<\") != NULL)\n    goto skip;\n\n  dexpc_part = strstr (description, \" at dex PC 0x\");\n  if (dexpc_part == NULL)\n    goto skip;\n  frame.dexpc = strtoul (dexpc_part + 13, NULL, 16);\n\n  g_array_append_val (bt->frames, frame);\n\n  g_checksum_update (bt->id, (guchar *) &frame.method, sizeof (frame.method));\n  g_checksum_update (bt->id, (guchar *) &frame.dexpc, sizeof (frame.dexpc));\n\n  return true;\n\nskip:\n  std_string_destroy (&frame.description);\n  return true;\n}\n\nstatic void\nart_stack_frame_destroy (ArtStackFrame * frame)\n{\n  std_string_destroy (&frame->description);\n}\n\nvoid\n_destroy (ArtBacktrace * backtrace)\n{\n  g_free (backtrace->frames_json);\n  g_array_free (backtrace->frames, TRUE);\n  g_checksum_free (backtrace->id);\n  g_free (backtrace);\n}\n\nconst gchar *\n_get_id (ArtBacktrace * backtrace)\n{\n  return g_checksum_get_string (backtrace->id);\n}\n\nconst gchar *\n_get_frames (ArtBacktrace * backtrace)\n{\n  GArray * frames = backtrace->frames;\n  JsonBuilder * b;\n  guint i;\n  JsonNode * root;\n\n  if (backtrace->frames_json != NULL)\n    return backtrace->frames_json;\n\n  b = json_builder_new_immutable ();\n\n  json_builder_begin_array (b);\n\n  for (i = 0; i != frames->len; i++)\n  {\n    ArtStackFrame * frame = &g_array_index (frames, ArtStackFrame, i);\n    gchar * description, * ret_type, * paren_open, * paren_close, * arg_types, * token, * method_name, * class_name;\n    GString * signature;\n    gchar * cursor;\n    ArtMethod * translated_method;\n    StdString location;\n    gsize dexpc;\n    const gchar * source_file;\n    gint32 line_number;\n\n    description = std_string_get_data (&frame->description);\n\n    ret_type = strchr (description, '\\'') + 1;\n\n    paren_open = strchr (ret_type, '(');\n    paren_close = strchr (paren_open, ')');\n    *paren_open = '\\0';\n    *paren_close = '\\0';\n\n    arg_types = paren_open + 1;\n\n    token = strrchr (ret_type, '.');\n    *token = '\\0';\n\n    method_name = token + 1;\n\n    token = strrchr (ret_type, ' ');\n    *token = '\\0';\n\n    class_name = token + 1;\n\n    signature = g_string_sized_new (128);\n\n    append_jni_type_name (signature, class_name, method_name - class_name - 1);\n    g_string_append_c (signature, ',');\n    g_string_append (signature, method_name);\n    g_string_append (signature, \",(\");\n\n    if (arg_types != paren_close)\n    {\n      for (cursor = arg_types; cursor != NULL;)\n      {\n        gsize length;\n        gchar * next;\n\n        token = strstr (cursor, \", \");\n        if (token != NULL)\n        {\n          length = token - cursor;\n          next = token + 2;\n        }\n        else\n        {\n          length = paren_close - cursor;\n          next = NULL;\n        }\n\n        append_jni_type_name (signature, cursor, length);\n\n        cursor = next;\n      }\n    }\n\n    g_string_append_c (signature, ')');\n\n    append_jni_type_name (signature, ret_type, class_name - ret_type - 1);\n\n    translated_method = translate_method (frame->method);\n    dexpc = (translated_method == frame->method) ? frame->dexpc : 0;\n\n    get_class_location (&location, GSIZE_TO_POINTER (translated_method->declaring_class));\n\n    translate_location (translated_method, dexpc, &source_file, &line_number);\n\n    json_builder_begin_object (b);\n\n    json_builder_set_member_name (b, \"signature\");\n    json_builder_add_string_value (b, signature->str);\n\n    json_builder_set_member_name (b, \"origin\");\n    json_builder_add_string_value (b, std_string_get_data (&location));\n\n    json_builder_set_member_name (b, \"className\");\n    json_builder_add_string_value (b, class_name);\n\n    json_builder_set_member_name (b, \"methodName\");\n    json_builder_add_string_value (b, method_name);\n\n    json_builder_set_member_name (b, \"methodFlags\");\n    json_builder_add_int_value (b, translated_method->access_flags);\n\n    json_builder_set_member_name (b, \"fileName\");\n    json_builder_add_string_value (b, source_file);\n\n    json_builder_set_member_name (b, \"lineNumber\");\n    json_builder_add_int_value (b, line_number);\n\n    json_builder_end_object (b);\n\n    std_string_destroy (&location);\n    g_string_free (signature, TRUE);\n  }\n\n  json_builder_end_array (b);\n\n  root = json_builder_get_root (b);\n  backtrace->frames_json = json_to_string (root, FALSE);\n  json_node_unref (root);\n\n  return backtrace->frames_json;\n}\n\nstatic void\nappend_jni_type_name (GString * s,\n                      const gchar * name,\n                      gsize length)\n{\n  gchar shorty = '\\0';\n  gsize i;\n\n  switch (name[0])\n  {\n    case 'b':\n      if (strncmp (name, \"boolean\", length) == 0)\n        shorty = 'Z';\n      else if (strncmp (name, \"byte\", length) == 0)\n        shorty = 'B';\n      break;\n    case 'c':\n      if (strncmp (name, \"char\", length) == 0)\n        shorty = 'C';\n      break;\n    case 'd':\n      if (strncmp (name, \"double\", length) == 0)\n        shorty = 'D';\n      break;\n    case 'f':\n      if (strncmp (name, \"float\", length) == 0)\n        shorty = 'F';\n      break;\n    case 'i':\n      if (strncmp (name, \"int\", length) == 0)\n        shorty = 'I';\n      break;\n    case 'l':\n      if (strncmp (name, \"long\", length) == 0)\n        shorty = 'J';\n      break;\n    case 's':\n      if (strncmp (name, \"short\", length) == 0)\n        shorty = 'S';\n      break;\n    case 'v':\n      if (strncmp (name, \"void\", length) == 0)\n        shorty = 'V';\n      break;\n  }\n\n  if (shorty != '\\0')\n  {\n    g_string_append_c (s, shorty);\n\n    return;\n  }\n\n  if (length > 2 && name[length - 2] == '[' && name[length - 1] == ']')\n  {\n    g_string_append_c (s, '[');\n    append_jni_type_name (s, name, length - 2);\n\n    return;\n  }\n\n  g_string_append_c (s, 'L');\n\n  for (i = 0; i != length; i++)\n  {\n    gchar ch = name[i];\n    if (ch != '.')\n      g_string_append_c (s, ch);\n    else\n      g_string_append_c (s, '/');\n  }\n\n  g_string_append_c (s, ';');\n}\n\nstatic void\nstd_string_destroy (StdString * str)\n{\n  bool is_large = (str->flags & 1) != 0;\n  if (is_large)\n    cxx_delete (str->large.data);\n}\n\nstatic gchar *\nstd_string_get_data (StdString * str)\n{\n  bool is_large = (str->flags & 1) != 0;\n  return is_large ? str->large.data : str->tiny.data;\n}\n", {
    current_backtrace: Memory.alloc(Process.pointerSize),
    perform_art_thread_state_transition: r,
    art_thread_get_long_jump_context: n["art::Thread::GetLongJumpContext"],
    art_stack_visitor_init: n["art::StackVisitor::StackVisitor"],
    art_stack_visitor_walk_stack: n["art::StackVisitor::WalkStack"],
    art_stack_visitor_get_method: n["art::StackVisitor::GetMethod"],
    art_stack_visitor_describe_location: n["art::StackVisitor::DescribeLocation"],
    translate_method: Re.replacedMethods.translate,
    translate_location: n["art::Monitor::TranslateLocation"],
    get_class_location: n["art::mirror::Class::GetLocation"],
    cxx_delete: n.$delete,
    strtoul: Module.getExportByName("libc.so", "strtoul")
  }), a = new NativeFunction(o._create, "pointer", [ "pointer", "uint" ], ve), i = new NativeFunction(o._destroy, "void", [ "pointer" ], ve), s = {
    exceptions: "propagate",
    scheduling: "exclusive"
  }, c = new NativeFunction(o._get_id, "pointer", [ "pointer" ], s), d = new NativeFunction(o._get_frames, "pointer", [ "pointer" ], s), l = In(e, t, o._on_thread_state_transition_complete);
  function u(e) {
    i(e);
  }
  return o._performData = l, r.writePointer(l), o.backtrace = (e, t) => {
    const n = a(e, t), r = new Xt(n);
    return Script.bindWeak(r, u.bind(null, n)), r;
  }, o.getId = e => c(e).readUtf8String(), o.getFrames = e => JSON.parse(d(e).readUtf8String()), 
  o;
}

class Xt {
  constructor(e) {
    this.handle = e;
  }
  get id() {
    return Ie.getId(this.handle);
  }
  get frames() {
    return Ie.getFrames(this.handle);
  }
}

function Yt() {
  Pe.forEach((e => {
    e.vtablePtr.writePointer(e.vtable), e.vtableCountPtr.writeS32(e.vtableCount);
  })), Pe.clear();
  for (const e of xe.splice(0)) e.deactivate();
  for (const e of we.splice(0)) e.revert();
}

function en(e) {
  const t = Oe(), n = ce(t).offset, r = n.jniIdManager, o = n.jniIdsIndirection;
  if (null !== r && null !== o) {
    const n = t.artRuntime;
    if (n.add(o).readInt() !== M) {
      const o = n.add(r).readPointer();
      return t["art::jni::JniIdManager::DecodeMethodId"](o, e);
    }
  }
  return e;
}

const tn = {
  ia32: nn,
  x64: rn,
  arm: on,
  arm64: an
};

function nn(e, t, n, r, o) {
  const a = ue(o).offset, i = le(o).offset;
  let s;
  return Memory.patchCode(e, 128, (r => {
    const o = new X86Writer(r, {
      pc: e
    }), c = new X86Relocator(t, o);
    o.putPushax(), o.putMovRegReg("ebp", "esp"), o.putAndRegU32("esp", 4294967280), 
    o.putSubRegImm("esp", 512), o.putBytes([ 15, 174, 4, 36 ]), o.putMovRegFsU32Ptr("ebx", a.self), 
    o.putCallAddressWithAlignedArguments(Re.replacedMethods.findReplacementFromQuickCode, [ "eax", "ebx" ]), 
    o.putTestRegReg("eax", "eax"), o.putJccShortLabel("je", "restore_registers", "no-hint"), 
    o.putMovRegOffsetPtrReg("ebp", 28, "eax"), o.putLabel("restore_registers"), o.putBytes([ 15, 174, 12, 36 ]), 
    o.putMovRegReg("esp", "ebp"), o.putPopax(), o.putJccShortLabel("jne", "invoke_replacement", "no-hint");
    do {
      s = c.readOne();
    } while (s < n && !c.eoi);
    c.writeAll(), c.eoi || o.putJmpAddress(t.add(s)), o.putLabel("invoke_replacement"), 
    o.putJmpRegOffsetPtr("eax", i.quickCode), o.flush();
  })), s;
}

function rn(e, t, n, r, o) {
  const a = ue(o).offset, i = le(o).offset;
  let s;
  return Memory.patchCode(e, 256, (r => {
    const o = new X86Writer(r, {
      pc: e
    }), c = new X86Relocator(t, o);
    o.putPushax(), o.putMovRegReg("rbp", "rsp"), o.putAndRegU32("rsp", 4294967280), 
    o.putSubRegImm("rsp", 512), o.putBytes([ 15, 174, 4, 36 ]), o.putMovRegGsU32Ptr("rbx", a.self), 
    o.putCallAddressWithAlignedArguments(Re.replacedMethods.findReplacementFromQuickCode, [ "rdi", "rbx" ]), 
    o.putTestRegReg("rax", "rax"), o.putJccShortLabel("je", "restore_registers", "no-hint"), 
    o.putMovRegOffsetPtrReg("rbp", 64, "rax"), o.putLabel("restore_registers"), o.putBytes([ 15, 174, 12, 36 ]), 
    o.putMovRegReg("rsp", "rbp"), o.putPopax(), o.putJccShortLabel("jne", "invoke_replacement", "no-hint");
    do {
      s = c.readOne();
    } while (s < n && !c.eoi);
    c.writeAll(), c.eoi || o.putJmpAddress(t.add(s)), o.putLabel("invoke_replacement"), 
    o.putJmpRegOffsetPtr("rdi", i.quickCode), o.flush();
  })), s;
}

function on(e, t, n, r, o) {
  const a = le(o).offset, i = t.and(y);
  let s;
  return Memory.patchCode(e, 128, (r => {
    const o = new ThumbWriter(r, {
      pc: e
    }), c = new ThumbRelocator(i, o);
    o.putPushRegs([ "r1", "r2", "r3", "r5", "r6", "r7", "r8", "r10", "r11", "lr" ]), 
    o.putBytes([ 45, 237, 16, 10 ]), o.putSubRegRegImm("sp", "sp", 8), o.putStrRegRegOffset("r0", "sp", 0), 
    o.putCallAddressWithArguments(Re.replacedMethods.findReplacementFromQuickCode, [ "r0", "r9" ]), 
    o.putCmpRegImm("r0", 0), o.putBCondLabel("eq", "restore_registers"), o.putStrRegRegOffset("r0", "sp", 0), 
    o.putLabel("restore_registers"), o.putLdrRegRegOffset("r0", "sp", 0), o.putAddRegRegImm("sp", "sp", 8), 
    o.putBytes([ 189, 236, 16, 10 ]), o.putPopRegs([ "lr", "r11", "r10", "r8", "r7", "r6", "r5", "r3", "r2", "r1" ]), 
    o.putBCondLabel("ne", "invoke_replacement");
    do {
      s = c.readOne();
    } while (s < n && !c.eoi);
    c.writeAll(), c.eoi || o.putLdrRegAddress("pc", t.add(s)), o.putLabel("invoke_replacement"), 
    o.putLdrRegRegOffset("pc", "r0", a.quickCode), o.flush();
  })), s;
}

function an(e, t, n, {availableScratchRegs: r}, o) {
  const a = le(o).offset;
  let i;
  return Memory.patchCode(e, 256, (o => {
    const s = new Arm64Writer(o, {
      pc: e
    }), c = new Arm64Relocator(t, s);
    s.putPushRegReg("d0", "d1"), s.putPushRegReg("d2", "d3"), s.putPushRegReg("d4", "d5"), 
    s.putPushRegReg("d6", "d7"), s.putPushRegReg("x1", "x2"), s.putPushRegReg("x3", "x4"), 
    s.putPushRegReg("x5", "x6"), s.putPushRegReg("x7", "x20"), s.putPushRegReg("x21", "x22"), 
    s.putPushRegReg("x23", "x24"), s.putPushRegReg("x25", "x26"), s.putPushRegReg("x27", "x28"), 
    s.putPushRegReg("x29", "lr"), s.putSubRegRegImm("sp", "sp", 16), s.putStrRegRegOffset("x0", "sp", 0), 
    s.putCallAddressWithArguments(Re.replacedMethods.findReplacementFromQuickCode, [ "x0", "x19" ]), 
    s.putCmpRegReg("x0", "xzr"), s.putBCondLabel("eq", "restore_registers"), s.putStrRegRegOffset("x0", "sp", 0), 
    s.putLabel("restore_registers"), s.putLdrRegRegOffset("x0", "sp", 0), s.putAddRegRegImm("sp", "sp", 16), 
    s.putPopRegReg("x29", "lr"), s.putPopRegReg("x27", "x28"), s.putPopRegReg("x25", "x26"), 
    s.putPopRegReg("x23", "x24"), s.putPopRegReg("x21", "x22"), s.putPopRegReg("x7", "x20"), 
    s.putPopRegReg("x5", "x6"), s.putPopRegReg("x3", "x4"), s.putPopRegReg("x1", "x2"), 
    s.putPopRegReg("d6", "d7"), s.putPopRegReg("d4", "d5"), s.putPopRegReg("d2", "d3"), 
    s.putPopRegReg("d0", "d1"), s.putBCondLabel("ne", "invoke_replacement");
    do {
      i = c.readOne();
    } while (i < n && !c.eoi);
    if (c.writeAll(), !c.eoi) {
      const e = Array.from(r)[0];
      s.putLdrRegAddress(e, t.add(i)), s.putBrReg(e);
    }
    s.putLabel("invoke_replacement"), s.putLdrRegRegOffset("x16", "x0", a.quickCode), 
    s.putBrReg("x16"), s.flush();
  })), i;
}

const sn = {
  ia32: cn,
  x64: cn,
  arm: dn,
  arm64: ln
};

function cn(e, t, n) {
  Memory.patchCode(e, 16, (n => {
    const r = new X86Writer(n, {
      pc: e
    });
    r.putJmpAddress(t), r.flush();
  }));
}

function dn(e, t, n) {
  const r = e.and(y);
  Memory.patchCode(r, 16, (e => {
    const n = new ThumbWriter(e, {
      pc: r
    });
    n.putLdrRegAddress("pc", t.or(1)), n.flush();
  }));
}

function ln(e, t, n) {
  Memory.patchCode(e, 16, (r => {
    const o = new Arm64Writer(r, {
      pc: e
    });
    16 === n ? o.putLdrRegAddress("x16", t) : o.putAdrpRegAddress("x16", t), o.putBrReg("x16"), 
    o.flush();
  }));
}

const un = {
  ia32: 5,
  x64: 16,
  arm: 8,
  arm64: 16
};

class pn {
  constructor(e) {
    this.quickCode = e, this.quickCodeAddress = "arm" === Process.arch ? e.and(y) : e, 
    this.redirectSize = 0, this.trampoline = null, this.overwrittenPrologue = null, 
    this.overwrittenPrologueLength = 0;
  }
  _canRelocateCode(e, t) {
    const n = It[Process.arch], r = yt[Process.arch], {quickCodeAddress: o} = this, a = new r(o, new n(o));
    let i;
    if ("arm64" === Process.arch) {
      let n = new Set([ "x16", "x17" ]);
      do {
        const e = a.readOne(), t = new Set(n), {read: r, written: o} = a.input.regsAccessed;
        for (const e of [ r, o ]) for (const n of e) {
          let e;
          e = n.startsWith("w") ? "x" + n.substring(1) : n, t.delete(e);
        }
        if (0 === t.size) break;
        i = e, n = t;
      } while (i < e && !a.eoi);
      t.availableScratchRegs = n;
    } else do {
      i = a.readOne();
    } while (i < e && !a.eoi);
    return i >= e;
  }
  _allocateTrampoline() {
    if (null === je) {
      je = e(4 === l ? 128 : 256);
    }
    const t = un[Process.arch];
    let n, r, o = 1;
    const a = {};
    if (4 === l || this._canRelocateCode(t, a)) n = t, r = {}; else {
      let e;
      "x64" === Process.arch ? (n = 5, e = I) : "arm64" === Process.arch && (n = 8, e = L, 
      o = 4096), r = {
        near: this.quickCodeAddress,
        maxDistance: e
      };
    }
    return this.redirectSize = n, this.trampoline = je.allocateSlice(r, o), a;
  }
  _destroyTrampoline() {
    je.freeSlice(this.trampoline);
  }
  activate(e) {
    const t = this._allocateTrampoline(), {trampoline: n, quickCode: r, redirectSize: o} = this, a = (0, 
    tn[Process.arch])(n, r, o, t, e);
    this.overwrittenPrologueLength = a, this.overwrittenPrologue = Memory.dup(this.quickCodeAddress, a);
    (0, sn[Process.arch])(r, n, o);
  }
  deactivate() {
    const {quickCodeAddress: e, overwrittenPrologueLength: t} = this, n = It[Process.arch];
    Memory.patchCode(e, t, (r => {
      const o = new n(r, {
        pc: e
      }), {overwrittenPrologue: a} = this;
      o.putBytes(a.readByteArray(t)), o.flush();
    })), this._destroyTrampoline();
  }
}

function _n(e) {
  const t = Oe(), {module: n, artClassLinker: r} = t;
  return e.equals(r.quickGenericJniTrampoline) || e.equals(r.quickToInterpreterBridgeTrampoline) || e.equals(r.quickResolutionTrampoline) || e.equals(r.quickImtConflictTrampoline) || e.compare(n.base) >= 0 && e.compare(n.base.add(n.size)) < 0;
}

class mn {
  constructor(e) {
    const t = en(e);
    this.methodId = t, this.originalMethod = null, this.hookedMethodId = t, this.replacementMethodId = null, 
    this.interceptor = null;
  }
  replace(e, t, n, r, o) {
    const {kAccCompileDontBother: a, artNterpEntryPoint: i} = o;
    this.originalMethod = gn(this.methodId, r);
    const s = this.originalMethod.accessFlags;
    if (0 != (s & x) && hn()) {
      const e = this.originalMethod.jniCode;
      this.hookedMethodId = e.add(2 * l).readPointer(), this.originalMethod = gn(this.hookedMethodId, r);
    }
    const {hookedMethodId: c} = this, d = kn(c, r);
    this.replacementMethodId = d, fn(d, {
      jniCode: e,
      accessFlags: (-3670017 & s | b | a) >>> 0,
      quickCode: o.artClassLinker.quickGenericJniTrampoline,
      interpreterCode: o.artInterpreterToCompiledCodeBridge
    }, r);
    let u = 1209008128;
    0 == (s & b) && (u |= E), fn(c, {
      accessFlags: (s & ~u | a) >>> 0
    }, r);
    const p = this.originalMethod.quickCode;
    if (void 0 !== i && p.equals(i) && fn(c, {
      quickCode: o.artQuickToInterpreterBridge
    }, r), !_n(p)) {
      const e = new pn(p);
      e.activate(r), this.interceptor = e;
    }
    Re.replacedMethods.set(c, d), Tt(c, r);
  }
  revert(e) {
    const {hookedMethodId: t, interceptor: n} = this;
    fn(t, this.originalMethod, e), Re.replacedMethods.delete(t), null !== n && (n.deactivate(), 
    this.interceptor = null);
  }
  resolveTarget(e, t, n, r) {
    return this.hookedMethodId;
  }
}

function hn() {
  return ge() < 28;
}

function gn(e, t) {
  const n = le(t).offset;
  return [ "jniCode", "accessFlags", "quickCode", "interpreterCode" ].reduce(((t, r) => {
    const o = n[r];
    if (void 0 === o) return t;
    const a = e.add(o), i = "accessFlags" === r ? u : p;
    return t[r] = i.call(a), t;
  }), {});
}

function fn(e, t, n) {
  const r = le(n).offset;
  Object.keys(t).forEach((n => {
    const o = r[n];
    if (void 0 === o) return;
    const a = e.add(o);
    ("accessFlags" === n ? _ : m).call(a, t[n]);
  }));
}

class bn {
  constructor(e) {
    this.methodId = e, this.originalMethod = null;
  }
  replace(e, t, n, r, o) {
    const {methodId: a} = this;
    this.originalMethod = Memory.dup(a, V);
    let i = n.reduce(((e, t) => e + t.size), 0);
    t && i++;
    const s = (a.add(4).readU32() | b) >>> 0, c = i, d = i;
    a.add(4).writeU32(s), a.add(U).writeU16(c), a.add(G).writeU16(0), a.add(B).writeU16(d), 
    a.add(W).writeU32(vn(a)), o.dvmUseJNIBridge(a, e);
  }
  revert(e) {
    Memory.copy(this.methodId, this.originalMethod, V);
  }
  resolveTarget(e, t, n, r) {
    const o = n.handle.add(O).readPointer();
    let a, i;
    if (t) a = r.dvmDecodeIndirectRef(o, e.$h); else {
      const t = e.$borrowClassHandle(n);
      a = r.dvmDecodeIndirectRef(o, t.value), t.unref(n);
    }
    i = t ? a.add(0).readPointer() : a;
    const s = i.toString(16);
    let c = Pe.get(s);
    if (void 0 === c) {
      const e = i.add(D), t = i.add(z), n = e.readPointer(), r = t.readS32(), o = r * l, a = Memory.alloc(2 * o);
      Memory.copy(a, n, o), e.writePointer(a), c = {
        classObject: i,
        vtablePtr: e,
        vtableCountPtr: t,
        vtable: n,
        vtableCount: r,
        shadowVtable: a,
        shadowVtableCount: r,
        targetMethods: new Map
      }, Pe.set(s, c);
    }
    const d = this.methodId.toString(16);
    let u = c.targetMethods.get(d);
    if (void 0 === u) {
      u = Memory.dup(this.originalMethod, V);
      const e = c.shadowVtableCount++;
      c.shadowVtable.add(e * l).writePointer(u), u.add(8).writeU16(e), c.vtableCountPtr.writeS32(c.shadowVtableCount), 
      c.targetMethods.set(d, u);
    }
    return u;
  }
}

function vn(e) {
  if ("ia32" !== Process.arch) return ne;
  const t = e.add(q).readPointer().readCString();
  if (null === t || 0 === t.length || t.length > 65535) return ne;
  let n;
  switch (t[0]) {
   case "V":
    n = 0;
    break;

   case "F":
    n = 1;
    break;

   case "D":
    n = 2;
    break;

   case "J":
    n = 3;
    break;

   case "Z":
   case "B":
    n = 7;
    break;

   case "C":
    n = 6;
    break;

   case "S":
    n = 5;
    break;

   default:
    n = 4;
  }
  let r = 0;
  for (let e = t.length - 1; e > 0; e--) {
    const n = t[e];
    r += "D" === n || "J" === n ? 2 : 1;
  }
  return n << re | r;
}

function kn(e, t) {
  const n = Oe();
  if (ge() < 23) {
    const t = n["art::Thread::CurrentFromGdb"]();
    return n["art::mirror::Object::Clone"](e, t);
  }
  return Memory.dup(e, le(t).size);
}

function Sn(e, t, n) {
  Rn(e, t, A, n);
}

function En(e, t) {
  Rn(e, t, C);
}

function Nn(e, t) {
  const n = Oe();
  if (ge() < 26) throw new Error("This API is only available on Android >= 8.0");
  bt(e, t, (e => {
    n["art::Runtime::DeoptimizeBootImage"](n.artRuntime);
  }));
}

function Rn(e, t, n, r) {
  const o = Oe();
  if (ge() < 24) throw new Error("This API is only available on Android >= 7.0");
  bt(e, t, (e => {
    if (ge() < 30) {
      if (!o.isJdwpStarted()) {
        const e = Pn(o);
        Le.push(e);
      }
      o.isDebuggerActive() || o["art::Dbg::GoActive"]();
      const e = Memory.alloc(8 + l);
      switch (e.writeU32(n), n) {
       case C:
        break;

       case A:
        e.add(8).writePointer(r);
        break;

       default:
        throw new Error("Unsupported deoptimization kind");
      }
      o["art::Dbg::RequestDeoptimization"](e), o["art::Dbg::ManageDeoptimization"]();
    } else {
      const e = o.artInstrumentation;
      if (null === e) throw new Error("Unable to find Instrumentation class in ART; please file a bug");
      const t = o["art::Instrumentation::EnableDeoptimization"];
      if (void 0 !== t) {
        !!e.add(de().offset.deoptimizationEnabled).readU8() || t(e);
      }
      switch (n) {
       case C:
        o["art::Instrumentation::DeoptimizeEverything"](e, Memory.allocUtf8String("frida"));
        break;

       case A:
        o["art::Instrumentation::Deoptimize"](e, r);
        break;

       default:
        throw new Error("Unsupported deoptimization kind");
      }
    }
  }));
}

class wn {
  constructor() {
    const e = Module.getExportByName("libart.so", "_ZN3art4JDWP12JdwpAdbState6AcceptEv"), t = Module.getExportByName("libart.so", "_ZN3art4JDWP12JdwpAdbState15ReceiveClientFdEv"), n = Mn(), r = Mn();
    this._controlFd = n[0], this._clientFd = r[0];
    let o = null;
    o = Interceptor.attach(e, (function(e) {
      const t = e[0];
      Memory.scanSync(t.add(8252), 256, "00 ff ff ff ff 00")[0].address.add(1).writeS32(n[1]), 
      o.detach();
    })), Interceptor.replace(t, new NativeCallback((function(e) {
      return Interceptor.revert(t), r[1];
    }), "int", [ "pointer" ])), Interceptor.flush(), this._handshakeRequest = this._performHandshake();
  }
  async _performHandshake() {
    const e = new UnixInputStream(this._clientFd, {
      autoClose: !1
    }), t = new UnixOutputStream(this._clientFd, {
      autoClose: !1
    }), n = [ 74, 68, 87, 80, 45, 72, 97, 110, 100, 115, 104, 97, 107, 101 ];
    try {
      await t.writeAll(n), await e.readAll(n.length);
    } catch (e) {}
  }
}

function Pn(e) {
  const t = new wn;
  e["art::Dbg::SetJdwpAllowed"](1);
  const n = xn();
  e["art::Dbg::ConfigureJdwp"](n);
  const r = e["art::InternalDebuggerControlCallback::StartDebugger"];
  return void 0 !== r ? r(NULL) : e["art::Dbg::StartJdwp"](), t;
}

function xn() {
  const e = ge() < 28 ? 2 : 3, t = 8 + oe + 2, n = Memory.alloc(t);
  return n.writeU32(e).add(4).writeU8(1).add(1).writeU8(0).add(1).add(oe).writeU16(0), 
  n;
}

function Mn() {
  null === Te && (Te = new NativeFunction(Module.getExportByName("libc.so", "socketpair"), "int", [ "int", "int", "int", "pointer" ]));
  const e = Memory.alloc(8);
  if (-1 === Te(1, 1, 0, e)) throw new Error("Unable to create socketpair for JDWP");
  return [ e.readS32(), e.add(4).readS32() ];
}

function Cn(e) {
  const t = Ve().offset, n = e.vm.add(t.globalsLock), r = e.vm.add(t.globals), o = e["art::IndirectReferenceTable::Add"], a = e["art::ReaderWriterMutex::ExclusiveLock"], i = e["art::ReaderWriterMutex::ExclusiveUnlock"];
  return function(e, t, s) {
    a(n, t);
    try {
      return o(r, 0, s);
    } finally {
      i(n, t);
    }
  };
}

function An(e) {
  const t = e["art::Thread::DecodeJObject"];
  return function(e, n, r) {
    return t(n, r);
  };
}

const yn = {
  ia32: Ln,
  x64: Ln,
  arm: Tn,
  arm64: jn
};

function In(e, t, n) {
  const r = t.handle.readPointer(), o = r.add(T).readPointer(), a = r.add(j).readPointer(), i = yn[Process.arch];
  if (void 0 === i) throw new Error("Not yet implemented for " + Process.arch);
  let s = null;
  const c = ue(e).offset, d = c.exception, u = new Set, p = c.isExceptionReportedToInstrumentation;
  null !== p && u.add(p);
  const _ = c.throwLocation;
  null !== _ && (u.add(_), u.add(_ + l), u.add(_ + 2 * l));
  const m = Memory.alloc(65536);
  return Memory.patchCode(m, 65536, (e => {
    s = i(e, m, o, a, d, u, n);
  })), s._code = m, s._callback = n, s;
}

function Ln(e, t, n, r, o, a, i) {
  const s = {}, c = new Set, d = [ n ];
  for (;d.length > 0; ) {
    let e = d.shift();
    if (Object.values(s).some((({begin: t, end: n}) => e.compare(t) >= 0 && e.compare(n) < 0))) continue;
    const t = e.toString();
    let n = {
      begin: e
    }, o = null, a = !1;
    do {
      if (e.equals(r)) {
        a = !0;
        break;
      }
      const i = Instruction.parse(e);
      o = i;
      const l = s[i.address.toString()];
      if (void 0 !== l) {
        delete s[l.begin.toString()], s[t] = l, l.begin = n.begin, n = null;
        break;
      }
      let u = null;
      switch (i.mnemonic) {
       case "jmp":
        u = ptr(i.operands[0].value), a = !0;
        break;

       case "je":
       case "jg":
       case "jle":
       case "jne":
       case "js":
        u = ptr(i.operands[0].value);
        break;

       case "ret":
        a = !0;
      }
      null !== u && (c.add(u.toString()), d.push(u), d.sort(((e, t) => e.compare(t)))), 
      e = i.next;
    } while (!a);
    null !== n && (n.end = o.address.add(o.size), s[t] = n);
  }
  const u = Object.keys(s).map((e => s[e]));
  u.sort(((e, t) => e.begin.compare(t.begin)));
  const p = s[n.toString()];
  u.splice(u.indexOf(p), 1), u.unshift(p);
  const _ = new X86Writer(e, {
    pc: t
  });
  let m = !1, h = null;
  return u.forEach((e => {
    const t = e.end.sub(e.begin).toInt32(), n = new X86Relocator(e.begin, _);
    let r;
    for (;0 !== (r = n.readOne()); ) {
      const e = n.input, {mnemonic: s} = e, d = e.address.toString();
      c.has(d) && _.putLabel(d);
      let u = !0;
      switch (s) {
       case "jmp":
        _.putJmpNearLabel(Dn(e.operands[0])), u = !1;
        break;

       case "je":
       case "jg":
       case "jle":
       case "jne":
       case "js":
        _.putJccNearLabel(s, Dn(e.operands[0]), "no-hint"), u = !1;
        break;

       case "mov":
        {
          const [t, n] = e.operands;
          if ("mem" === t.type && "imm" === n.type) {
            const e = t.value, r = e.disp;
            if (r === o && 0 === n.value.valueOf()) {
              if (h = e.base, _.putPushfx(), _.putPushax(), _.putMovRegReg("xbp", "xsp"), 4 === l) _.putAndRegU32("esp", 4294967280); else {
                const e = "rdi" !== h ? "rdi" : "rsi";
                _.putMovRegU64(e, uint64("0xfffffffffffffff0")), _.putAndRegReg("rsp", e);
              }
              _.putCallAddressWithAlignedArguments(i, [ h ]), _.putMovRegReg("xsp", "xbp"), _.putPopax(), 
              _.putPopfx(), m = !0, u = !1;
            } else a.has(r) && e.base === h && (u = !1);
          }
          break;
        }

       case "call":
        {
          const t = e.operands[0];
          "mem" === t.type && t.value.disp === T && (4 === l ? (_.putPopReg("eax"), _.putMovRegRegOffsetPtr("eax", "eax", 4), 
          _.putPushReg("eax")) : _.putMovRegRegOffsetPtr("rdi", "rdi", 8), _.putCallAddressWithArguments(i, []), 
          m = !0, u = !1);
          break;
        }
      }
      if (u ? n.writeAll() : n.skipOne(), r === t) break;
    }
    n.dispose();
  })), _.dispose(), m || On(), new NativeFunction(t, "void", [ "pointer" ], ve);
}

function Tn(e, t, n, r, o, a, i) {
  const s = {}, c = new Set, d = ptr(1).not(), l = [ n ];
  for (;l.length > 0; ) {
    let e = l.shift();
    const t = Object.values(s).some((({begin: t, end: n}) => e.compare(t) >= 0 && e.compare(n) < 0));
    if (t) continue;
    const n = e.and(d), o = n.toString(), a = e.and(1);
    let i = {
      begin: n
    }, u = null, p = !1, _ = 0;
    do {
      if (e.equals(r)) {
        p = !0;
        break;
      }
      const t = Instruction.parse(e), {mnemonic: n} = t;
      u = t;
      const m = e.and(d).toString(), h = s[m];
      if (void 0 !== h) {
        delete s[h.begin.toString()], s[o] = h, h.begin = i.begin, i = null;
        break;
      }
      const g = 0 === _;
      let f = null;
      switch (n) {
       case "b":
        f = ptr(t.operands[0].value), p = g;
        break;

       case "beq.w":
       case "beq":
       case "bne":
       case "bgt":
        f = ptr(t.operands[0].value);
        break;

       case "cbz":
       case "cbnz":
        f = ptr(t.operands[1].value);
        break;

       case "pop.w":
        g && (p = 1 === t.operands.filter((e => "pc" === e.value)).length);
      }
      switch (n) {
       case "it":
        _ = 1;
        break;

       case "itt":
        _ = 2;
        break;

       case "ittt":
        _ = 3;
        break;

       case "itttt":
        _ = 4;
        break;

       default:
        _ > 0 && _--;
      }
      null !== f && (c.add(f.toString()), l.push(f.or(a)), l.sort(((e, t) => e.compare(t)))), 
      e = t.next;
    } while (!p);
    null !== i && (i.end = u.address.add(u.size), s[o] = i);
  }
  const u = Object.keys(s).map((e => s[e]));
  u.sort(((e, t) => e.begin.compare(t.begin)));
  const p = s[n.and(d).toString()];
  u.splice(u.indexOf(p), 1), u.unshift(p);
  const _ = new ThumbWriter(e, {
    pc: t
  });
  let m = !1, h = null, g = null;
  return u.forEach((e => {
    const t = new ThumbRelocator(e.begin, _);
    let n = e.begin;
    const r = e.end;
    let s = 0;
    do {
      if (0 === t.readOne()) throw new Error("Unexpected end of block");
      const e = t.input;
      n = e.address, s = e.size;
      const {mnemonic: r} = e, d = n.toString();
      c.has(d) && _.putLabel(d);
      let l = !0;
      switch (r) {
       case "b":
        _.putBLabel(Dn(e.operands[0])), l = !1;
        break;

       case "beq.w":
        _.putBCondLabelWide("eq", Dn(e.operands[0])), l = !1;
        break;

       case "beq":
       case "bne":
       case "bgt":
        _.putBCondLabelWide(r.substr(1), Dn(e.operands[0])), l = !1;
        break;

       case "cbz":
        {
          const t = e.operands;
          _.putCbzRegLabel(t[0].value, Dn(t[1])), l = !1;
          break;
        }

       case "cbnz":
        {
          const t = e.operands;
          _.putCbnzRegLabel(t[0].value, Dn(t[1])), l = !1;
          break;
        }

       case "str":
       case "str.w":
        {
          const t = e.operands[1].value, n = t.disp;
          if (n === o) {
            h = t.base;
            const e = "r4" !== h ? "r4" : "r5", n = [ "r0", "r1", "r2", "r3", e, "r9", "r12", "lr" ];
            _.putPushRegs(n), _.putMrsRegReg(e, "apsr-nzcvq"), _.putCallAddressWithArguments(i, [ h ]), 
            _.putMsrRegReg("apsr-nzcvq", e), _.putPopRegs(n), m = !0, l = !1;
          } else a.has(n) && t.base === h && (l = !1);
          break;
        }

       case "ldr":
        {
          const [t, n] = e.operands;
          if ("mem" === n.type) {
            const e = n.value;
            "r" === e.base[0] && e.disp === T && (g = t.value);
          }
          break;
        }

       case "blx":
        e.operands[0].value === g && (_.putLdrRegRegOffset("r0", "r0", 4), _.putCallAddressWithArguments(i, [ "r0" ]), 
        m = !0, g = null, l = !1);
      }
      l ? t.writeAll() : t.skipOne();
    } while (!n.add(s).equals(r));
    t.dispose();
  })), _.dispose(), m || On(), new NativeFunction(t.or(1), "void", [ "pointer" ], ve);
}

function jn(e, t, n, r, o, a, i) {
  const s = {}, c = new Set, d = [ n ];
  for (;d.length > 0; ) {
    let e = d.shift();
    if (Object.values(s).some((({begin: t, end: n}) => e.compare(t) >= 0 && e.compare(n) < 0))) continue;
    const t = e.toString();
    let n = {
      begin: e
    }, o = null, a = !1;
    do {
      if (e.equals(r)) {
        a = !0;
        break;
      }
      let i;
      try {
        i = Instruction.parse(e);
      } catch (t) {
        if (0 === e.readU32()) {
          a = !0;
          break;
        }
        throw t;
      }
      o = i;
      const l = s[i.address.toString()];
      if (void 0 !== l) {
        delete s[l.begin.toString()], s[t] = l, l.begin = n.begin, n = null;
        break;
      }
      let u = null;
      switch (i.mnemonic) {
       case "b":
        u = ptr(i.operands[0].value), a = !0;
        break;

       case "b.eq":
       case "b.ne":
       case "b.le":
       case "b.gt":
        u = ptr(i.operands[0].value);
        break;

       case "cbz":
       case "cbnz":
        u = ptr(i.operands[1].value);
        break;

       case "tbz":
       case "tbnz":
        u = ptr(i.operands[2].value);
        break;

       case "ret":
        a = !0;
      }
      null !== u && (c.add(u.toString()), d.push(u), d.sort(((e, t) => e.compare(t)))), 
      e = i.next;
    } while (!a);
    null !== n && (n.end = o.address.add(o.size), s[t] = n);
  }
  const l = Object.keys(s).map((e => s[e]));
  l.sort(((e, t) => e.begin.compare(t.begin)));
  const u = s[n.toString()];
  l.splice(l.indexOf(u), 1), l.unshift(u);
  const p = new Arm64Writer(e, {
    pc: t
  });
  p.putBLabel("performTransition");
  const _ = t.add(p.offset);
  p.putPushAllXRegisters(), p.putCallAddressWithArguments(i, [ "x0" ]), p.putPopAllXRegisters(), 
  p.putRet(), p.putLabel("performTransition");
  let m = !1, h = null, g = null;
  return l.forEach((e => {
    const t = e.end.sub(e.begin).toInt32(), n = new Arm64Relocator(e.begin, p);
    let r;
    for (;0 !== (r = n.readOne()); ) {
      const e = n.input, {mnemonic: s} = e, d = e.address.toString();
      c.has(d) && p.putLabel(d);
      let l = !0;
      switch (s) {
       case "b":
        p.putBLabel(Dn(e.operands[0])), l = !1;
        break;

       case "b.eq":
       case "b.ne":
       case "b.le":
       case "b.gt":
        p.putBCondLabel(s.substr(2), Dn(e.operands[0])), l = !1;
        break;

       case "cbz":
        {
          const t = e.operands;
          p.putCbzRegLabel(t[0].value, Dn(t[1])), l = !1;
          break;
        }

       case "cbnz":
        {
          const t = e.operands;
          p.putCbnzRegLabel(t[0].value, Dn(t[1])), l = !1;
          break;
        }

       case "tbz":
        {
          const t = e.operands;
          p.putTbzRegImmLabel(t[0].value, t[1].value.valueOf(), Dn(t[2])), l = !1;
          break;
        }

       case "tbnz":
        {
          const t = e.operands;
          p.putTbnzRegImmLabel(t[0].value, t[1].value.valueOf(), Dn(t[2])), l = !1;
          break;
        }

       case "str":
        {
          const t = e.operands, n = t[0].value, r = t[1].value, i = r.disp;
          "xzr" === n && i === o ? (h = r.base, p.putPushRegReg("x0", "lr"), p.putMovRegReg("x0", h), 
          p.putBlImm(_), p.putPopRegReg("x0", "lr"), m = !0, l = !1) : a.has(i) && r.base === h && (l = !1);
          break;
        }

       case "ldr":
        {
          const t = e.operands, n = t[1].value;
          "x" === n.base[0] && n.disp === T && (g = t[0].value);
          break;
        }

       case "blr":
        e.operands[0].value === g && (p.putLdrRegRegOffset("x0", "x0", 8), p.putCallAddressWithArguments(i, [ "x0" ]), 
        m = !0, g = null, l = !1);
      }
      if (l ? n.writeAll() : n.skipOne(), r === t) break;
    }
    n.dispose();
  })), p.dispose(), m || On(), new NativeFunction(t, "void", [ "pointer" ], ve);
}

function On() {
  throw new Error("Unable to parse ART internals; please file a bug");
}

function zn(e) {
  const t = e["art::ArtMethod::PrettyMethod"];
  void 0 !== t && (Interceptor.attach(t.impl, Re.hooks.ArtMethod.prettyMethod), Interceptor.flush());
}

function Dn(e) {
  return ptr(e.value).toString();
}

function Fn(e, t) {
  return new NativeFunction(e, "pointer", t, ve);
}

function Vn(e, t) {
  const n = new NativeFunction(e, "void", [ "pointer" ].concat(t), ve);
  return function() {
    const e = Memory.alloc(l);
    return n(e, ...arguments), e.readPointer();
  };
}

function Zn(e, t) {
  const {arch: n} = Process;
  switch (n) {
   case "ia32":
   case "arm64":
    {
      let r;
      r = "ia32" === n ? Lt(64, (n => {
        const r = 1 + t.length, o = 4 * r;
        n.putSubRegImm("esp", o);
        for (let e = 0; e !== r; e++) {
          const t = 4 * e;
          n.putMovRegRegOffsetPtr("eax", "esp", o + 4 + t), n.putMovRegOffsetPtrReg("esp", t, "eax");
        }
        n.putCallAddress(e), n.putAddRegImm("esp", o - 4), n.putRet();
      })) : Lt(32, (n => {
        n.putMovRegReg("x8", "x0"), t.forEach(((e, t) => {
          n.putMovRegReg("x" + t, "x" + (t + 1));
        })), n.putLdrRegAddress("x7", e), n.putBrReg("x7");
      }));
      const o = new NativeFunction(r, "void", [ "pointer" ].concat(t), ve), a = function(...e) {
        o(...e);
      };
      return a.handle = r, a.impl = e, a;
    }

   default:
    {
      const n = new NativeFunction(e, "void", [ "pointer" ].concat(t), ve);
      return n.impl = e, n;
    }
  }
}

class Jn {
  constructor() {
    this.handle = Memory.alloc(oe);
  }
  dispose() {
    const [e, t] = this._getData();
    t || Oe().$delete(e);
  }
  disposeToString() {
    const e = this.toString();
    return this.dispose(), e;
  }
  toString() {
    const [e] = this._getData();
    return e.readUtf8String();
  }
  _getData() {
    const e = this.handle, t = 0 == (1 & e.readU8());
    return [ t ? e.add(1) : e.add(2 * l).readPointer(), t ];
  }
}

class Un {
  $delete() {
    this.dispose(), Oe().$delete(this);
  }
  constructor(e, t) {
    this.handle = e, this._begin = e, this._end = e.add(l), this._storage = e.add(2 * l), 
    this._elementSize = t;
  }
  init() {
    this.begin = NULL, this.end = NULL, this.storage = NULL;
  }
  dispose() {
    Oe().$delete(this.begin);
  }
  get begin() {
    return this._begin.readPointer();
  }
  set begin(e) {
    this._begin.writePointer(e);
  }
  get end() {
    return this._end.readPointer();
  }
  set end(e) {
    this._end.writePointer(e);
  }
  get storage() {
    return this._storage.readPointer();
  }
  set storage(e) {
    this._storage.writePointer(e);
  }
  get size() {
    return this.end.sub(this.begin).toInt32() / this._elementSize;
  }
}

class Gn extends Un {
  static $new() {
    const e = new Gn(Oe().$new(ae));
    return e.init(), e;
  }
  constructor(e) {
    super(e, l);
  }
  get handles() {
    const e = [];
    let t = this.begin;
    const n = this.end;
    for (;!t.equals(n); ) e.push(t.readPointer()), t = t.add(l);
    return e;
  }
}

const Bn = 0, qn = l, Wn = qn + 4, Hn = -1;

class Kn {
  $delete() {
    this.dispose(), Oe().$delete(this);
  }
  constructor(e) {
    this.handle = e, this._link = e.add(0), this._numberOfReferences = e.add(qn);
  }
  init(e, t) {
    this.link = e, this.numberOfReferences = t;
  }
  dispose() {}
  get link() {
    return new Kn(this._link.readPointer());
  }
  set link(e) {
    this._link.writePointer(e);
  }
  get numberOfReferences() {
    return this._numberOfReferences.readS32();
  }
  set numberOfReferences(e) {
    this._numberOfReferences.writeS32(e);
  }
}

const Qn = or(Wn), $n = Qn + l, Xn = $n + l;

class Yn extends Kn {
  static $new(e, t) {
    const n = new Yn(Oe().$new(Xn));
    return n.init(e, t), n;
  }
  constructor(e) {
    super(e), this._self = e.add(Qn), this._currentScope = e.add($n);
    const t = (64 - l - 4 - 4) / 4;
    this._scopeLayout = er.layoutForCapacity(t), this._topHandleScopePtr = null;
  }
  init(e, t) {
    const n = e.add(ue(t).offset.topHandleScope);
    this._topHandleScopePtr = n, super.init(n.readPointer(), Hn), this.self = e, this.currentScope = er.$new(this._scopeLayout), 
    n.writePointer(this);
  }
  dispose() {
    let e;
    for (this._topHandleScopePtr.writePointer(this.link); null !== (e = this.currentScope); ) {
      const t = e.link;
      e.$delete(), this.currentScope = t;
    }
  }
  get self() {
    return this._self.readPointer();
  }
  set self(e) {
    this._self.writePointer(e);
  }
  get currentScope() {
    const e = this._currentScope.readPointer();
    return e.isNull() ? null : new er(e, this._scopeLayout);
  }
  set currentScope(e) {
    this._currentScope.writePointer(e);
  }
  newHandle(e) {
    return this.currentScope.newHandle(e);
  }
}

class er extends Kn {
  static $new(e) {
    const t = new er(Oe().$new(e.size), e);
    return t.init(), t;
  }
  constructor(e, t) {
    super(e);
    const {offset: n} = t;
    this._refsStorage = e.add(n.refsStorage), this._pos = e.add(n.pos), this._layout = t;
  }
  init() {
    super.init(NULL, this._layout.numberOfReferences), this.pos = 0;
  }
  get pos() {
    return this._pos.readU32();
  }
  set pos(e) {
    this._pos.writeU32(e);
  }
  newHandle(e) {
    const t = this.pos, n = this._refsStorage.add(4 * t);
    return n.writeS32(e.toInt32()), this.pos = t + 1, n;
  }
  static layoutForCapacity(e) {
    const t = Wn + 4 * e;
    return {
      size: t + 4,
      numberOfReferences: e,
      offset: {
        refsStorage: Wn,
        pos: t
      }
    };
  }
}

const tr = {
  arm: function(e, t) {
    const n = Process.pageSize, r = Memory.alloc(n);
    Memory.protect(r, n, "rwx");
    const o = new NativeCallback(t, "void", [ "pointer" ]);
    r._onMatchCallback = o;
    const a = [ 26625, 18947, 17041, 53505, 19202, 18200, 18288, 48896 ], i = 2 * a.length, s = i + 4, c = s + 4;
    return Memory.patchCode(r, c, (function(t) {
      a.forEach(((e, n) => {
        t.add(2 * n).writeU16(e);
      })), t.add(i).writeS32(e), t.add(s).writePointer(o);
    })), r.or(1);
  },
  arm64: function(e, t) {
    const n = Process.pageSize, r = Memory.alloc(n);
    Memory.protect(r, n, "rwx");
    const o = new NativeCallback(t, "void", [ "pointer" ]);
    r._onMatchCallback = o;
    const a = [ 3107979265, 402653378, 1795293247, 1409286241, 1476395139, 3592355936, 3596551104 ], i = 4 * a.length, s = i + 4, c = s + 8;
    return Memory.patchCode(r, c, (function(t) {
      a.forEach(((e, n) => {
        t.add(4 * n).writeU32(e);
      })), t.add(i).writeS32(e), t.add(s).writePointer(o);
    })), r;
  }
};

function nr(e, t) {
  return (tr[Process.arch] || rr)(e, t);
}

function rr(e, t) {
  return new NativeCallback((n => {
    n.readS32() === e && t(n);
  }), "void", [ "pointer", "pointer" ]);
}

function or(e) {
  const t = e % l;
  return 0 !== t ? e + l - t : e;
}

module.exports = {
  getApi: Oe,
  ensureClassInitialized: Fe,
  getAndroidVersion: me,
  getAndroidApiLevel: ge,
  getArtClassSpec: tt,
  getArtMethodSpec: le,
  getArtFieldSpec: rt,
  getArtThreadSpec: ue,
  getArtThreadFromEnv: ut,
  withRunnableArtThread: bt,
  withAllArtThreadsSuspended: St,
  makeArtClassVisitor: Nt,
  makeArtClassLoaderVisitor: wt,
  ArtStackVisitor: xt,
  ArtMethod: Mt,
  makeMethodMangler: Ht,
  translateMethod: Kt,
  backtrace: Qt,
  revertGlobalPatches: Yt,
  deoptimizeEverything: En,
  deoptimizeBootImage: Nn,
  deoptimizeMethod: Sn,
  HandleVector: Gn,
  VariableSizedHandleScope: Yn,
  makeObjectVisitorPredicate: nr,
  DVM_JNI_ENV_OFFSET_SELF: O
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./alloc":25,"./jvmti":28,"./machine-code":29,"./memoize":30,"./result":31,"./vm":32}],27:[function(require,module,exports){
function t(t, e) {
  this.handle = t, this.vm = e;
}

const e = Process.pointerSize, n = 2, r = 28, i = 34, o = 37, a = 40, p = 43, l = 46, s = 49, c = 52, h = 55, u = 58, d = 61, f = 64, y = 67, g = 70, v = 73, L = 76, m = 79, j = 82, T = 85, R = 88, A = 91, w = 114, b = 117, C = 120, S = 123, N = 126, M = 129, E = 132, G = 135, I = 138, U = 141, F = 95, O = 96, P = 97, B = 98, x = 99, D = 100, V = 101, z = 102, W = 103, J = 104, Z = 105, k = 106, $ = 107, q = 108, H = 109, K = 110, Q = 111, X = 112, Y = 145, _ = 146, tt = 147, et = 148, nt = 149, rt = 150, it = 151, ot = 152, at = 153, pt = 154, lt = 155, st = 156, ct = 157, ht = 158, ut = 159, dt = 160, ft = 161, yt = 162, gt = {
  pointer: i,
  uint8: o,
  int8: a,
  uint16: p,
  int16: l,
  int32: s,
  int64: c,
  float: h,
  double: u,
  void: d
}, vt = {
  pointer: f,
  uint8: y,
  int8: g,
  uint16: v,
  int16: L,
  int32: m,
  int64: j,
  float: T,
  double: R,
  void: A
}, Lt = {
  pointer: w,
  uint8: b,
  int8: C,
  uint16: S,
  int16: N,
  int32: M,
  int64: E,
  float: G,
  double: I,
  void: U
}, mt = {
  pointer: F,
  uint8: O,
  int8: P,
  uint16: B,
  int16: x,
  int32: D,
  int64: V,
  float: z,
  double: W
}, jt = {
  pointer: J,
  uint8: Z,
  int8: k,
  uint16: $,
  int16: q,
  int32: H,
  int64: K,
  float: Q,
  double: X
}, Tt = {
  pointer: Y,
  uint8: _,
  int8: tt,
  uint16: et,
  int16: nt,
  int32: rt,
  int64: it,
  float: ot,
  double: at
}, Rt = {
  pointer: pt,
  uint8: lt,
  int8: st,
  uint16: ct,
  int16: ht,
  int32: ut,
  int64: dt,
  float: ft,
  double: yt
}, At = {
  exceptions: "propagate"
};

let wt = null, bt = [];

function Ct(t) {
  return bt.push(t), t;
}

function St(t) {
  return null === wt && (wt = t.handle.readPointer()), wt;
}

function Nt(t, n, r, i) {
  let o = null;
  return function() {
    null === o && (o = new NativeFunction(St(this).add(t * e).readPointer(), n, r, At));
    let a = [ o ];
    return a = a.concat.apply(a, arguments), i.apply(this, a);
  };
}

function Mt(t, e) {
  return function() {
    t.perform((t => {
      t.deleteGlobalRef(e);
    }));
  };
}

t.dispose = function(t) {
  bt.forEach(t.deleteGlobalRef, t), bt = [];
}, t.prototype.getVersion = Nt(4, "int32", [ "pointer" ], (function(t) {
  return t(this.handle);
})), t.prototype.findClass = Nt(6, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  const n = t(this.handle, Memory.allocUtf8String(e));
  return this.throwIfExceptionPending(), n;
})), t.prototype.throwIfExceptionPending = function() {
  const t = this.exceptionOccurred();
  if (t.isNull()) return;
  this.exceptionClear();
  const e = this.newGlobalRef(t);
  this.deleteLocalRef(t);
  const n = this.vaMethod("pointer", [])(this.handle, e, this.javaLangObject().toString), r = this.stringFromJni(n);
  this.deleteLocalRef(n);
  const i = new Error(r);
  throw i.$h = e, Script.bindWeak(i, Mt(this.vm, e)), i;
}, t.prototype.fromReflectedMethod = Nt(7, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.fromReflectedField = Nt(8, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.toReflectedMethod = Nt(9, "pointer", [ "pointer", "pointer", "pointer", "uint8" ], (function(t, e, n, r) {
  return t(this.handle, e, n, r);
})), t.prototype.getSuperclass = Nt(10, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.isAssignableFrom = Nt(11, "uint8", [ "pointer", "pointer", "pointer" ], (function(t, e, n) {
  return !!t(this.handle, e, n);
})), t.prototype.toReflectedField = Nt(12, "pointer", [ "pointer", "pointer", "pointer", "uint8" ], (function(t, e, n, r) {
  return t(this.handle, e, n, r);
})), t.prototype.throw = Nt(13, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.exceptionOccurred = Nt(15, "pointer", [ "pointer" ], (function(t) {
  return t(this.handle);
})), t.prototype.exceptionDescribe = Nt(16, "void", [ "pointer" ], (function(t) {
  t(this.handle);
})), t.prototype.exceptionClear = Nt(17, "void", [ "pointer" ], (function(t) {
  t(this.handle);
})), t.prototype.pushLocalFrame = Nt(19, "int32", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.popLocalFrame = Nt(20, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newGlobalRef = Nt(21, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.deleteGlobalRef = Nt(22, "void", [ "pointer", "pointer" ], (function(t, e) {
  t(this.handle, e);
})), t.prototype.deleteLocalRef = Nt(23, "void", [ "pointer", "pointer" ], (function(t, e) {
  t(this.handle, e);
})), t.prototype.isSameObject = Nt(24, "uint8", [ "pointer", "pointer", "pointer" ], (function(t, e, n) {
  return !!t(this.handle, e, n);
})), t.prototype.newLocalRef = Nt(25, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.allocObject = Nt(27, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.getObjectClass = Nt(31, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.isInstanceOf = Nt(32, "uint8", [ "pointer", "pointer", "pointer" ], (function(t, e, n) {
  return !!t(this.handle, e, n);
})), t.prototype.getMethodId = Nt(33, "pointer", [ "pointer", "pointer", "pointer", "pointer" ], (function(t, e, n, r) {
  return t(this.handle, e, Memory.allocUtf8String(n), Memory.allocUtf8String(r));
})), t.prototype.getFieldId = Nt(94, "pointer", [ "pointer", "pointer", "pointer", "pointer" ], (function(t, e, n, r) {
  return t(this.handle, e, Memory.allocUtf8String(n), Memory.allocUtf8String(r));
})), t.prototype.getIntField = Nt(100, "int32", [ "pointer", "pointer", "pointer" ], (function(t, e, n) {
  return t(this.handle, e, n);
})), t.prototype.getStaticMethodId = Nt(113, "pointer", [ "pointer", "pointer", "pointer", "pointer" ], (function(t, e, n, r) {
  return t(this.handle, e, Memory.allocUtf8String(n), Memory.allocUtf8String(r));
})), t.prototype.getStaticFieldId = Nt(144, "pointer", [ "pointer", "pointer", "pointer", "pointer" ], (function(t, e, n, r) {
  return t(this.handle, e, Memory.allocUtf8String(n), Memory.allocUtf8String(r));
})), t.prototype.getStaticIntField = Nt(150, "int32", [ "pointer", "pointer", "pointer" ], (function(t, e, n) {
  return t(this.handle, e, n);
})), t.prototype.getStringLength = Nt(164, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.getStringChars = Nt(165, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.releaseStringChars = Nt(166, "void", [ "pointer", "pointer", "pointer" ], (function(t, e, n) {
  t(this.handle, e, n);
})), t.prototype.newStringUtf = Nt(167, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  const n = Memory.allocUtf8String(e);
  return t(this.handle, n);
})), t.prototype.getStringUtfChars = Nt(169, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.releaseStringUtfChars = Nt(170, "void", [ "pointer", "pointer", "pointer" ], (function(t, e, n) {
  t(this.handle, e, n);
})), t.prototype.getArrayLength = Nt(171, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newObjectArray = Nt(172, "pointer", [ "pointer", "int32", "pointer", "pointer" ], (function(t, e, n, r) {
  return t(this.handle, e, n, r);
})), t.prototype.getObjectArrayElement = Nt(173, "pointer", [ "pointer", "pointer", "int32" ], (function(t, e, n) {
  return t(this.handle, e, n);
})), t.prototype.setObjectArrayElement = Nt(174, "void", [ "pointer", "pointer", "int32", "pointer" ], (function(t, e, n, r) {
  t(this.handle, e, n, r);
})), t.prototype.newBooleanArray = Nt(175, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newByteArray = Nt(176, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newCharArray = Nt(177, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newShortArray = Nt(178, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newIntArray = Nt(179, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newLongArray = Nt(180, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newFloatArray = Nt(181, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.newDoubleArray = Nt(182, "pointer", [ "pointer", "int32" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.getBooleanArrayElements = Nt(183, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.getByteArrayElements = Nt(184, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.getCharArrayElements = Nt(185, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.getShortArrayElements = Nt(186, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.getIntArrayElements = Nt(187, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.getLongArrayElements = Nt(188, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.getFloatArrayElements = Nt(189, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.getDoubleArrayElements = Nt(190, "pointer", [ "pointer", "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e, NULL);
})), t.prototype.releaseBooleanArrayElements = Nt(191, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.releaseByteArrayElements = Nt(192, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.releaseCharArrayElements = Nt(193, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.releaseShortArrayElements = Nt(194, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.releaseIntArrayElements = Nt(195, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.releaseLongArrayElements = Nt(196, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.releaseFloatArrayElements = Nt(197, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.releaseDoubleArrayElements = Nt(198, "pointer", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n) {
  t(this.handle, e, n, 2);
})), t.prototype.getByteArrayRegion = Nt(200, "void", [ "pointer", "pointer", "int", "int", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setBooleanArrayRegion = Nt(207, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setByteArrayRegion = Nt(208, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setCharArrayRegion = Nt(209, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setShortArrayRegion = Nt(210, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setIntArrayRegion = Nt(211, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setLongArrayRegion = Nt(212, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setFloatArrayRegion = Nt(213, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.setDoubleArrayRegion = Nt(214, "void", [ "pointer", "pointer", "int32", "int32", "pointer" ], (function(t, e, n, r, i) {
  t(this.handle, e, n, r, i);
})), t.prototype.registerNatives = Nt(215, "int32", [ "pointer", "pointer", "pointer", "int32" ], (function(t, e, n, r) {
  return t(this.handle, e, n, r);
})), t.prototype.monitorEnter = Nt(217, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.monitorExit = Nt(218, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.getDirectBufferAddress = Nt(230, "pointer", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), t.prototype.getObjectRefType = Nt(232, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
}));

const Et = new Map;

function Gt(t, e, n, r) {
  return Ft(this, "p", Ot, t, e, n, r);
}

function It(t, e, n, r) {
  return Ft(this, "v", Pt, t, e, n, r);
}

function Ut(t, e, n, r) {
  return Ft(this, "n", Bt, t, e, n, r);
}

function Ft(t, e, n, r, i, o, a) {
  if (void 0 !== a) return n(t, r, i, o, a);
  const p = [ r, e, i ].concat(o).join("|");
  let l = Et.get(p);
  return void 0 === l && (l = n(t, r, i, o, At), Et.set(p, l)), l;
}

function Ot(t, n, r, i, o) {
  return new NativeFunction(St(t).add(n * e).readPointer(), r, [ "pointer", "pointer", "pointer" ].concat(i), o);
}

function Pt(t, n, r, i, o) {
  return new NativeFunction(St(t).add(n * e).readPointer(), r, [ "pointer", "pointer", "pointer", "..." ].concat(i), o);
}

function Bt(t, n, r, i, o) {
  return new NativeFunction(St(t).add(n * e).readPointer(), r, [ "pointer", "pointer", "pointer", "pointer", "..." ].concat(i), o);
}

t.prototype.constructor = function(t, e) {
  return It.call(this, r, "pointer", t, e);
}, t.prototype.vaMethod = function(t, e, n) {
  const r = gt[t];
  if (void 0 === r) throw new Error("Unsupported type: " + t);
  return It.call(this, r, t, e, n);
}, t.prototype.nonvirtualVaMethod = function(t, e, n) {
  const r = vt[t];
  if (void 0 === r) throw new Error("Unsupported type: " + t);
  return Ut.call(this, r, t, e, n);
}, t.prototype.staticVaMethod = function(t, e, n) {
  const r = Lt[t];
  if (void 0 === r) throw new Error("Unsupported type: " + t);
  return It.call(this, r, t, e, n);
}, t.prototype.getField = function(t) {
  const e = mt[t];
  if (void 0 === e) throw new Error("Unsupported type: " + t);
  return Gt.call(this, e, t, []);
}, t.prototype.getStaticField = function(t) {
  const e = Tt[t];
  if (void 0 === e) throw new Error("Unsupported type: " + t);
  return Gt.call(this, e, t, []);
}, t.prototype.setField = function(t) {
  const e = jt[t];
  if (void 0 === e) throw new Error("Unsupported type: " + t);
  return Gt.call(this, e, "void", [ t ]);
}, t.prototype.setStaticField = function(t) {
  const e = Rt[t];
  if (void 0 === e) throw new Error("Unsupported type: " + t);
  return Gt.call(this, e, "void", [ t ]);
};

let xt = null;

t.prototype.javaLangClass = function() {
  if (null === xt) {
    const t = this.findClass("java/lang/Class");
    try {
      const e = this.getMethodId.bind(this, t);
      xt = {
        handle: Ct(this.newGlobalRef(t)),
        getName: e("getName", "()Ljava/lang/String;"),
        getSimpleName: e("getSimpleName", "()Ljava/lang/String;"),
        getGenericSuperclass: e("getGenericSuperclass", "()Ljava/lang/reflect/Type;"),
        getDeclaredConstructors: e("getDeclaredConstructors", "()[Ljava/lang/reflect/Constructor;"),
        getDeclaredMethods: e("getDeclaredMethods", "()[Ljava/lang/reflect/Method;"),
        getDeclaredFields: e("getDeclaredFields", "()[Ljava/lang/reflect/Field;"),
        isArray: e("isArray", "()Z"),
        isPrimitive: e("isPrimitive", "()Z"),
        getComponentType: e("getComponentType", "()Ljava/lang/Class;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return xt;
};

let Dt = null;

t.prototype.javaLangObject = function() {
  if (null === Dt) {
    const t = this.findClass("java/lang/Object");
    try {
      const e = this.getMethodId.bind(this, t);
      Dt = {
        toString: e("toString", "()Ljava/lang/String;"),
        getClass: e("getClass", "()Ljava/lang/Class;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return Dt;
};

let Vt = null;

t.prototype.javaLangReflectConstructor = function() {
  if (null === Vt) {
    const t = this.findClass("java/lang/reflect/Constructor");
    try {
      Vt = {
        getGenericParameterTypes: this.getMethodId(t, "getGenericParameterTypes", "()[Ljava/lang/reflect/Type;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return Vt;
};

let zt = null;

t.prototype.javaLangReflectMethod = function() {
  if (null === zt) {
    const t = this.findClass("java/lang/reflect/Method");
    try {
      const e = this.getMethodId.bind(this, t);
      zt = {
        getName: e("getName", "()Ljava/lang/String;"),
        getGenericParameterTypes: e("getGenericParameterTypes", "()[Ljava/lang/reflect/Type;"),
        getParameterTypes: e("getParameterTypes", "()[Ljava/lang/Class;"),
        getGenericReturnType: e("getGenericReturnType", "()Ljava/lang/reflect/Type;"),
        getGenericExceptionTypes: e("getGenericExceptionTypes", "()[Ljava/lang/reflect/Type;"),
        getModifiers: e("getModifiers", "()I"),
        isVarArgs: e("isVarArgs", "()Z")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return zt;
};

let Wt = null;

t.prototype.javaLangReflectField = function() {
  if (null === Wt) {
    const t = this.findClass("java/lang/reflect/Field");
    try {
      const e = this.getMethodId.bind(this, t);
      Wt = {
        getName: e("getName", "()Ljava/lang/String;"),
        getType: e("getType", "()Ljava/lang/Class;"),
        getGenericType: e("getGenericType", "()Ljava/lang/reflect/Type;"),
        getModifiers: e("getModifiers", "()I"),
        toString: e("toString", "()Ljava/lang/String;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return Wt;
};

let Jt = null;

t.prototype.javaLangReflectTypeVariable = function() {
  if (null === Jt) {
    const t = this.findClass("java/lang/reflect/TypeVariable");
    try {
      const e = this.getMethodId.bind(this, t);
      Jt = {
        handle: Ct(this.newGlobalRef(t)),
        getName: e("getName", "()Ljava/lang/String;"),
        getBounds: e("getBounds", "()[Ljava/lang/reflect/Type;"),
        getGenericDeclaration: e("getGenericDeclaration", "()Ljava/lang/reflect/GenericDeclaration;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return Jt;
};

let Zt = null;

t.prototype.javaLangReflectWildcardType = function() {
  if (null === Zt) {
    const t = this.findClass("java/lang/reflect/WildcardType");
    try {
      const e = this.getMethodId.bind(this, t);
      Zt = {
        handle: Ct(this.newGlobalRef(t)),
        getLowerBounds: e("getLowerBounds", "()[Ljava/lang/reflect/Type;"),
        getUpperBounds: e("getUpperBounds", "()[Ljava/lang/reflect/Type;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return Zt;
};

let kt = null;

t.prototype.javaLangReflectGenericArrayType = function() {
  if (null === kt) {
    const t = this.findClass("java/lang/reflect/GenericArrayType");
    try {
      kt = {
        handle: Ct(this.newGlobalRef(t)),
        getGenericComponentType: this.getMethodId(t, "getGenericComponentType", "()Ljava/lang/reflect/Type;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return kt;
};

let $t = null;

t.prototype.javaLangReflectParameterizedType = function() {
  if (null === $t) {
    const t = this.findClass("java/lang/reflect/ParameterizedType");
    try {
      const e = this.getMethodId.bind(this, t);
      $t = {
        handle: Ct(this.newGlobalRef(t)),
        getActualTypeArguments: e("getActualTypeArguments", "()[Ljava/lang/reflect/Type;"),
        getRawType: e("getRawType", "()Ljava/lang/reflect/Type;"),
        getOwnerType: e("getOwnerType", "()Ljava/lang/reflect/Type;")
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return $t;
};

let qt = null;

t.prototype.javaLangString = function() {
  if (null === qt) {
    const t = this.findClass("java/lang/String");
    try {
      qt = {
        handle: Ct(this.newGlobalRef(t))
      };
    } finally {
      this.deleteLocalRef(t);
    }
  }
  return qt;
}, t.prototype.getClassName = function(t) {
  const e = this.vaMethod("pointer", [])(this.handle, t, this.javaLangClass().getName);
  try {
    return this.stringFromJni(e);
  } finally {
    this.deleteLocalRef(e);
  }
}, t.prototype.getObjectClassName = function(t) {
  const e = this.getObjectClass(t);
  try {
    return this.getClassName(e);
  } finally {
    this.deleteLocalRef(e);
  }
}, t.prototype.getActualTypeArgument = function(t) {
  const e = this.vaMethod("pointer", [])(this.handle, t, this.javaLangReflectParameterizedType().getActualTypeArguments);
  if (this.throwIfExceptionPending(), !e.isNull()) try {
    return this.getTypeNameFromFirstTypeElement(e);
  } finally {
    this.deleteLocalRef(e);
  }
}, t.prototype.getTypeNameFromFirstTypeElement = function(t) {
  if (!(this.getArrayLength(t) > 0)) return "java.lang.Object";
  {
    const e = this.getObjectArrayElement(t, 0);
    try {
      return this.getTypeName(e);
    } finally {
      this.deleteLocalRef(e);
    }
  }
}, t.prototype.getTypeName = function(t, e) {
  const n = this.vaMethod("pointer", []);
  if (this.isInstanceOf(t, this.javaLangClass().handle)) return this.getClassName(t);
  if (this.isInstanceOf(t, this.javaLangReflectGenericArrayType().handle)) return this.getArrayTypeName(t);
  if (this.isInstanceOf(t, this.javaLangReflectParameterizedType().handle)) {
    const r = n(this.handle, t, this.javaLangReflectParameterizedType().getRawType);
    let i;
    this.throwIfExceptionPending();
    try {
      i = this.getTypeName(r);
    } finally {
      this.deleteLocalRef(r);
    }
    return e && (i += "<" + this.getActualTypeArgument(t) + ">"), i;
  }
  return this.isInstanceOf(t, this.javaLangReflectTypeVariable().handle) || this.isInstanceOf(t, this.javaLangReflectWildcardType().handle), 
  "java.lang.Object";
}, t.prototype.getArrayTypeName = function(t) {
  const e = this.vaMethod("pointer", []);
  if (this.isInstanceOf(t, this.javaLangClass().handle)) return this.getClassName(t);
  if (!this.isInstanceOf(t, this.javaLangReflectGenericArrayType().handle)) return "[Ljava.lang.Object;";
  {
    const n = e(this.handle, t, this.javaLangReflectGenericArrayType().getGenericComponentType);
    this.throwIfExceptionPending();
    try {
      return "[L" + this.getTypeName(n) + ";";
    } finally {
      this.deleteLocalRef(n);
    }
  }
}, t.prototype.stringFromJni = function(t) {
  const e = this.getStringChars(t);
  if (e.isNull()) throw new Error("Unable to access string");
  try {
    const n = this.getStringLength(t);
    return e.readUtf16String(n);
  } finally {
    this.releaseStringChars(t, e);
  }
}, module.exports = t;

},{}],28:[function(require,module,exports){
const {checkJniResult: t} = require("./result"), e = {
  v1_0: 805371904,
  v1_2: 805372416
}, n = {
  canTagObjects: 1
}, {pointerSize: i} = Process, o = {
  exceptions: "propagate"
};

function r(t, e) {
  this.handle = t, this.vm = e, this.vtable = t.readPointer();
}

function s(t, e, n, r) {
  let s = null;
  return function() {
    null === s && (s = new NativeFunction(this.vtable.add((t - 1) * i).readPointer(), e, n, o));
    let a = [ s ];
    return a = a.concat.apply(a, arguments), r.apply(this, a);
  };
}

r.prototype.deallocate = s(47, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), r.prototype.getLoadedClasses = s(78, "int32", [ "pointer", "pointer", "pointer" ], (function(e, n, i) {
  const o = e(this.handle, n, i);
  t("EnvJvmti::getLoadedClasses", o);
})), r.prototype.iterateOverInstancesOfClass = s(112, "int32", [ "pointer", "pointer", "int", "pointer", "pointer" ], (function(e, n, i, o, r) {
  const s = e(this.handle, n, i, o, r);
  t("EnvJvmti::iterateOverInstancesOfClass", s);
})), r.prototype.getObjectsWithTags = s(114, "int32", [ "pointer", "int", "pointer", "pointer", "pointer", "pointer" ], (function(e, n, i, o, r, s) {
  const a = e(this.handle, n, i, o, r, s);
  t("EnvJvmti::getObjectsWithTags", a);
})), r.prototype.addCapabilities = s(142, "int32", [ "pointer", "pointer" ], (function(t, e) {
  return t(this.handle, e);
})), module.exports = {
  jvmtiVersion: e,
  jvmtiCapabilities: n,
  EnvJvmti: r
};

},{"./result":31}],29:[function(require,module,exports){
function t(t, n, {limit: l}) {
  let r = t, e = null;
  for (let t = 0; t !== l; t++) {
    const t = Instruction.parse(r), l = n(t, e);
    if (null !== l) return l;
    r = t.next, e = t;
  }
  return null;
}

module.exports = {
  parseInstructionsAt: t
};

},{}],30:[function(require,module,exports){
function n(n) {
  let t = null, u = !1;
  return function(...e) {
    return u || (t = n(...e), u = !0), t;
  };
}

module.exports = n;

},{}],31:[function(require,module,exports){
const e = 0;

function o(e, o) {
  if (0 !== o) throw new Error(e + " failed: " + o);
}

module.exports = {
  checkJniResult: o,
  JNI_OK: 0
};

},{}],32:[function(require,module,exports){
const t = require("./env"), {JNI_OK: e, checkJniResult: n} = require("./result"), r = 65542, i = Process.pointerSize, o = Process.getCurrentThreadId(), s = new Map, a = new Map;

function c(c) {
  const u = c.vm;
  let l = null, h = null, d = null;
  function f(t) {
    const e = a.get(t);
    return void 0 === e ? null : e[0];
  }
  this.handle = u, this.perform = function(t) {
    const e = Process.getCurrentThreadId(), n = f(e);
    if (null !== n) return t(n);
    let r = this._tryGetEnv();
    const i = null !== r;
    i || (r = this.attachCurrentThread(), s.set(e, !0)), this.link(e, r);
    try {
      return t(r);
    } finally {
      const t = e === o;
      if (t || this.unlink(e), !i && !t) {
        const t = s.get(e);
        s.delete(e), t && this.detachCurrentThread();
      }
    }
  }, this.attachCurrentThread = function() {
    const e = Memory.alloc(i);
    return n("VM::AttachCurrentThread", l(u, e, NULL)), new t(e.readPointer(), this);
  }, this.detachCurrentThread = function() {
    n("VM::DetachCurrentThread", h(u));
  }, this.preventDetachDueToClassLoader = function() {
    const t = Process.getCurrentThreadId();
    s.has(t) && s.set(t, !1);
  }, this.getEnv = function() {
    const e = f(Process.getCurrentThreadId());
    if (null !== e) return e;
    const o = Memory.alloc(i), s = d(u, o, r);
    if (-2 === s) throw new Error("Current thread is not attached to the Java VM; please move this code inside a Java.perform() callback");
    return n("VM::GetEnv", s), new t(o.readPointer(), this);
  }, this.tryGetEnv = function() {
    const t = f(Process.getCurrentThreadId());
    return null !== t ? t : this._tryGetEnv();
  }, this._tryGetEnv = function() {
    const e = this.tryGetEnvHandle(r);
    return null === e ? null : new t(e, this);
  }, this.tryGetEnvHandle = function(t) {
    const n = Memory.alloc(i);
    return d(u, n, t) !== e ? null : n.readPointer();
  }, this.makeHandleDestructor = function(t) {
    return () => {
      this.perform((e => {
        e.deleteGlobalRef(t);
      }));
    };
  }, this.link = function(t, e) {
    const n = a.get(t);
    void 0 === n ? a.set(t, [ e, 1 ]) : n[1]++;
  }, this.unlink = function(t) {
    const e = a.get(t);
    1 === e[1] ? a.delete(t) : e[1]--;
  }, function() {
    const t = u.readPointer(), e = {
      exceptions: "propagate"
    };
    l = new NativeFunction(t.add(4 * i).readPointer(), "int32", [ "pointer", "pointer", "pointer" ], e), 
    h = new NativeFunction(t.add(5 * i).readPointer(), "int32", [ "pointer" ], e), d = new NativeFunction(t.add(6 * i).readPointer(), "int32", [ "pointer", "pointer", "int32" ], e);
  }.call(this);
}

c.dispose = function(t) {
  !0 === s.get(o) && (s.delete(o), t.detachCurrentThread());
}, module.exports = c;

},{"./env":27,"./result":31}],33:[function(require,module,exports){
var t, e, n = module.exports = {};

function r() {
  throw new Error("setTimeout has not been defined");
}

function o() {
  throw new Error("clearTimeout has not been defined");
}

function i(e) {
  if (t === setTimeout) return setTimeout(e, 0);
  if ((t === r || !t) && setTimeout) return t = setTimeout, setTimeout(e, 0);
  try {
    return t(e, 0);
  } catch (n) {
    try {
      return t.call(null, e, 0);
    } catch (n) {
      return t.call(this, e, 0);
    }
  }
}

function u(t) {
  if (e === clearTimeout) return clearTimeout(t);
  if ((e === o || !e) && clearTimeout) return e = clearTimeout, clearTimeout(t);
  try {
    return e(t);
  } catch (n) {
    try {
      return e.call(null, t);
    } catch (n) {
      return e.call(this, t);
    }
  }
}

!function() {
  try {
    t = "function" == typeof setTimeout ? setTimeout : r;
  } catch (e) {
    t = r;
  }
  try {
    e = "function" == typeof clearTimeout ? clearTimeout : o;
  } catch (t) {
    e = o;
  }
}();

var c, s = [], l = !1, a = -1;

function f() {
  l && c && (l = !1, c.length ? s = c.concat(s) : a = -1, s.length && h());
}

function h() {
  if (!l) {
    var t = i(f);
    l = !0;
    for (var e = s.length; e; ) {
      for (c = s, s = []; ++a < e; ) c && c[a].run();
      a = -1, e = s.length;
    }
    c = null, l = !1, u(t);
  }
}

function m(t, e) {
  this.fun = t, this.array = e;
}

function p() {}

n.nextTick = function(t) {
  var e = new Array(arguments.length - 1);
  if (arguments.length > 1) for (var n = 1; n < arguments.length; n++) e[n - 1] = arguments[n];
  s.push(new m(t, e)), 1 !== s.length || l || i(h);
}, m.prototype.run = function() {
  this.fun.apply(null, this.array);
}, n.title = "browser", n.browser = !0, n.env = {}, n.argv = [], n.version = "", 
n.versions = {}, n.on = p, n.addListener = p, n.once = p, n.off = p, n.removeListener = p, 
n.removeAllListeners = p, n.emit = p, n.prependListener = p, n.prependOnceListener = p, 
n.listeners = function(t) {
  return [];
}, n.binding = function(t) {
  throw new Error("process.binding is not supported");
}, n.cwd = function() {
  return "/";
}, n.chdir = function(t) {
  throw new Error("process.chdir is not supported");
}, n.umask = function() {
  return 0;
};

},{}],34:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var e = require("process/browser.js").nextTick, t = Function.prototype.apply, o = Array.prototype.slice, i = {}, n = 0;

function r(e, t) {
  this._id = e, this._clearFn = t;
}

exports.setTimeout = function() {
  return new r(t.call(setTimeout, window, arguments), clearTimeout);
}, exports.setInterval = function() {
  return new r(t.call(setInterval, window, arguments), clearInterval);
}, exports.clearTimeout = exports.clearInterval = function(e) {
  e.close();
}, r.prototype.unref = r.prototype.ref = function() {}, r.prototype.close = function() {
  this._clearFn.call(window, this._id);
}, exports.enroll = function(e, t) {
  clearTimeout(e._idleTimeoutId), e._idleTimeout = t;
}, exports.unenroll = function(e) {
  clearTimeout(e._idleTimeoutId), e._idleTimeout = -1;
}, exports._unrefActive = exports.active = function(e) {
  clearTimeout(e._idleTimeoutId);
  var t = e._idleTimeout;
  t >= 0 && (e._idleTimeoutId = setTimeout((function() {
    e._onTimeout && e._onTimeout();
  }), t));
}, exports.setImmediate = "function" == typeof setImmediate ? setImmediate : function(t) {
  var r = n++, l = !(arguments.length < 2) && o.call(arguments, 1);
  return i[r] = !0, e((function() {
    i[r] && (l ? t.apply(null, l) : t.call(null), exports.clearImmediate(r));
  })), r;
}, exports.clearImmediate = "function" == typeof clearImmediate ? clearImmediate : function(e) {
  delete i[e];
};

}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":33,"timers":34}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhc3Npc3QvY2hhbGtfc2VsZWN0b3IudHMiLCJhc3Npc3QvZnV6enlfbWF0Y2hfYXNzaXN0LnRzIiwiYXNzaXN0L21vZHVsZV9hc3Npc3QudHMiLCJpbmRleC50cyIsIm1haW4udHMiLCJtb25pdG9yL2NhbGxfZXZlbnRfbG9nLnRzIiwibW9uaXRvci9pbXBsL2NhbGxfbW9uaXRvci50cyIsIm1vbml0b3IvaW1wbC9tb25pdG9yX3NlbGVjdG9yLnRzIiwibW9uaXRvci9pbXBsL3N2Y19tb25pdG9yLnRzIiwibW9uaXRvci9zdGFsa2VyX21vbml0b3IudHMiLCJtb25pdG9yL3N2Yy9zaWduYWxfbmFtZV9tYXAudHMiLCJtb25pdG9yL3N2Yy9zdmNfbG9nX3RyYW5zbGF0aW9uLnRzIiwibmF0aXZlL2FuZHJvaWRfYXJ0LnRzIiwibmF0aXZlL3NvaW5mby50cyIsIm5hdGl2ZS91bml4X2FuZHJvaWQudHMiLCJub2RlX21vZHVsZXMvYW5zaS1zdHlsZXMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2hhbGsvc291cmNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NoYWxrL3NvdXJjZS90ZW1wbGF0ZXMuanMiLCJub2RlX21vZHVsZXMvY2hhbGsvc291cmNlL3V0aWwuanMiLCJub2RlX21vZHVsZXMvY29sb3ItY29udmVydC9jb252ZXJzaW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9jb2xvci1jb252ZXJ0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NvbG9yLWNvbnZlcnQvcm91dGUuanMiLCJub2RlX21vZHVsZXMvY29sb3ItbmFtZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1jb21waWxlL2xpYi9zdXBwb3J0cy1jb2xvci5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvYWxsb2MuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtamF2YS1icmlkZ2UvbGliL2FuZHJvaWQuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtamF2YS1icmlkZ2UvbGliL2Vudi5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvanZtdGkuanMiLCJub2RlX21vZHVsZXMvZnJpZGEtamF2YS1icmlkZ2UvbGliL21hY2hpbmUtY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvbWVtb2l6ZS5qcyIsIm5vZGVfbW9kdWxlcy9mcmlkYS1qYXZhLWJyaWRnZS9saWIvcmVzdWx0LmpzIiwibm9kZV9tb2R1bGVzL2ZyaWRhLWphdmEtYnJpZGdlL2xpYi92bS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7OztBQ0FBLE1BQUEsSUFBQSxFQUFBLFFBQUE7O0FBRUEsTUFBYTtFQUNULE9BQVMsRUFBQyxFQUFBLFFBQU0sTUFBTSxFQUFBLFFBQU0sTUFBTSxFQUFBLFFBQU0sUUFBUSxFQUFBLFFBQU0sTUFBTSxFQUFBLFFBQU0sT0FBTyxFQUFBLFFBQU07RUFDL0UsU0FBVztFQUVYO0lBQ1EsS0FBSyxZQUFZLEtBQUssT0FBTyxXQUM3QixLQUFLLFdBQVc7SUFFcEIsTUFBTSxJQUFJLEtBQUs7SUFDZixLQUFLO0lBRUwsT0FEYyxLQUFLLE9BQU8sSUFBSSxLQUFLLE9BQU87QUFFOUM7OztBQVpKLFFBQUE7Ozs7O0FDRkEsSUFBaUI7Ozs7Z0NBQWpCLFNBQWlCO0VBRUcsRUFBQSxRQUFoQixTQUFzQixHQUFpQjtJQUNuQyxNQUFNLElBQVUsSUFBSSxFQUFRLFdBQVcsS0FBSztJQUc1QyxPQUZrQixJQUFJLE9BQU8sR0FBUyxLQUVyQixLQUFLO0FBQzFCO0FBRUgsQ0FURCxDQUFpQixJQUFBLFFBQUEsY0FBQSxRQUFBLFlBQVM7OztBQ0ExQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ25CQSxTQUFTLEtBR1Q7Ozs7SUFMQSxRQUFBLFdBT0EsYUFBYTs7Ozs7O0FDUmI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDbkNBLE1BQWE7RUFDVDtFQUNBO0VBRUEsWUFBWSxHQUFxQixJQUFhLFdBQVc7SUFDckQsS0FBSyxTQUFTLEtBQUssU0FBUyxJQUM1QixLQUFLLGFBQWE7QUFDdEI7RUFFUSxTQUFTO0lBQ2IsTUFBTSxJQUFpQixFQUFPLFFBQU8sQ0FBQyxHQUFVLEdBQWMsR0FBYztNQUN4RSxPQUFPLEdBQU0sR0FBVSxHQUFRLEtBQVUsR0FDbkMsSUFBTSxHQUFHLE9BQVk7TUFFM0IsT0FEQSxFQUFTLElBQUksR0FBSyxJQUNYO0FBQVEsUUFDaEIsSUFBSSxNQUVELElBQWlCO0lBQ3ZCLEtBQUssTUFBTSxLQUFLLEVBQWUsVUFDM0IsRUFBZSxLQUFLO0lBRXhCLE9BQU87QUFDWDtFQU9BLGVBQWU7SUFFWCxJQUFJLElBQU07SUFFVixNQUFNLElBQVEsRUFBQyxJQUFJLEVBQVUsR0FBTSxNQUM3QixJQUFVLElBQUk7SUFDcEIsTUFBTyxFQUFNLFNBQVMsS0FBRztNQUNyQixJQUFJLElBQWdCLEVBQU07TUFDMUIsTUFBTSxJQUFNLFlBQVksWUFBWSxJQUFJLEVBQUcsS0FBSztNQUtoRCxJQUZBLElBQU0sR0FBRyxJQURHLEdBQUcsRUFBYSxPQUFPLEVBQUcsVUFBVSxVQUczQyxFQUFRLElBQUksRUFBRyxPQUFPO1FBQ3ZCLEVBQVEsSUFBSSxFQUFHO1FBRWYsS0FBSyxNQUFNLEtBQVMsRUFBRyxLQUFLLFVBQ3hCLEVBQU0sS0FBSyxJQUFJLEVBQVUsR0FBTyxFQUFHLFFBQVE7OztJQUl2RCxPQUFPO0FBQ1g7RUFDQSxTQUFTO0lBQ0wsSUFBSTtJQUVBLElBREEsS0FBSyxjQUFjLFdBQVcsV0FDYixLQUFVLElBRVY7TUFFYixNQUFNLElBQVUsWUFBWSxZQUFZLElBQUk7TUFDNUMsSUFBSSxFQUFRLFNBQXNDLEtBQTlCLEVBQVEsS0FBSyxRQUFRLE1BQVk7UUFFakQsT0FEd0IsRUFBUSxLQUFLLE1BQU0sS0FDcEI7O01BRTNCLE9BQU87QUFBTTtJQUdyQixNQUFNLElBQWEsRUFBcUIsS0FBSyxRQUF1QjtJQUNwRSxLQUFLLE1BQU0sS0FBUSxHQUFZO01BQzNCLE1BQU0sSUFBTSxLQUFLLGVBQWU7TUFDaEMsUUFBUSxJQUFJLEVBQU07O0FBRTFCOzs7QUFJSixTQUFTLEVBQWEsR0FBYTtFQUMvQixJQUFJLElBQU87RUFDWCxLQUFLLElBQUksSUFBUSxHQUFHLElBQVEsR0FBTSxLQUM5QixLQUFRO0VBRVosT0FBTztBQUNYOztBQWxGQSxRQUFBOztBQW1GQSxNQUFNO0VBQ0Y7RUFDQSxTQUE0QjtFQUM1QixjQUFnQixJQUFJO0VBRXBCLFlBQVk7SUFDUixLQUFLLFNBQVM7QUFDbEI7RUFFQSxVQUFVO0lBQ0QsS0FBSyxjQUFjLElBQUksT0FDeEIsS0FBSyxjQUFjLElBQUksSUFDdkIsS0FBSyxTQUFTLEtBQUs7QUFFM0I7OztBQUtKLFNBQVMsRUFBcUIsR0FBcUI7RUFDL0MsTUFBTSxJQUFXLElBQUk7RUFDckIsS0FBSyxNQUFNLEtBQVMsR0FBUTtJQUN4QixPQUFPLEdBQU0sR0FBVSxHQUFRLEtBQVUsR0FFbkMsSUFBWSxFQUFlLElBQzNCLElBQWMsRUFBZTtJQUVuQyxJQUFJLElBQWMsRUFBUyxJQUFJO0lBQzFCLE1BQ0QsSUFBYyxJQUFJLEVBQWMsSUFDaEMsRUFBUyxJQUFJLEdBQVc7SUFHNUIsSUFBSSxJQUFhLEVBQVMsSUFBSTtJQUN6QixNQUNELElBQWEsSUFBSSxFQUFjLElBQy9CLEVBQVMsSUFBSSxHQUFhLEtBRzlCLEVBQVksVUFBVTs7RUFHMUIsTUFBTSxJQUFRO0VBRWQsS0FBSyxNQUFNLEtBQVEsRUFBUyxVQUFVO0lBQ2xDLElBQUksS0FBVTtJQUNkLEtBQUssTUFBTSxLQUFLLEVBQVMsVUFDckIsSUFBSSxFQUFFLGNBQWMsSUFBSSxJQUFPO01BQzNCLEtBQVU7TUFDVjs7SUFHSCxLQUFTLEVBQU0sS0FBSzs7RUFHN0IsT0FBTztBQUNYOztBQUVBLE1BQU07RUFDRjtFQUNBO0VBRUEsWUFBWSxHQUFxQjtJQUM3QixLQUFLLE9BQU8sR0FDWixLQUFLLFFBQVE7QUFDakI7Ozs7Ozs7Ozs7QUMxSkosTUFBQSxJQUFBLFFBQUEsc0JBQ0EsSUFBQSxRQUFBLHVCQUNBLElBQUEsUUFBQTs7QUFFQSxNQUFhLFVBQW9CLEVBQUE7RUFDN0IsY0FBZ0IsSUFBSSxFQUFBO0VBQ3BCLGVBQWU7SUFDWCxNQUFNLElBQVE7SUFJZCxNQUFNLElBQU0sR0FBRyxFQUFNLFNBQVMsRUFBTTtJQUNwQyxPQUFPO01BQ0gsUUFBUTtRQUNKLE1BQUs7O01BRVQsVUFBVTtRQUNOLE1BQU0sSUFBUSxFQUFNLGNBQWM7UUFHbEMsTUFBTSxJQUZtQixRQUFRLE1BQU0sR0FBVztVQUFFLFdBQVU7VUFBTSxZQUFXO1dBRXBCLFFBQVEsS0FBc0MsU0FBWCxFQUFLO1FBQ25HLEtBYm9CLElBYUcsTUFaVixFQUFPLFNBQVMsR0FZTTtVQUMvQixRQUFRLElBQUksRUFBTSxPQUFPLElBQU0sMEJBQTBCLEVBQVU7VUFDbkUsTUFBTSxJQUFhLEVBQVUsUUFBTztZQUNoQyxPQUFPLEdBQU0sR0FBVSxHQUFRLEtBQVMsR0FDbEMsSUFBYSxFQUFBLFdBQVcsS0FBSyxJQUFJLEtBQ2pDLElBQVcsRUFBQSxXQUFXLEtBQUssSUFBSTtZQUNyQyxVQUFNLE1BQWUsS0FBYSxFQUFNLGdCQUFnQixNQUFlLEVBQU0sZ0JBQWdCO0FBR2xGO1VBRUEsSUFBSSxFQUFBLGdCQUFnQixHQUFZLFdBQVcsT0FDbkQsU0FBUzs7UUF6QjVCLElBQTRCO0FBNEJ4Qjs7QUFHUjs7O0FBbkNKLFFBQUE7Ozs7Ozs7OztBQ0hBLE1BQUEsSUFBQSxRQUFBLG1CQUNBLElBQUEsUUFBQTs7QUFFQSxNQUFhO0VBQ1QsV0FBYSxJQUFJO0VBRWpCLFdBQVcsR0FBYTtJQUNwQixLQUFLLFdBQVcsSUFBSSxHQUFLO0FBQzdCO0VBRUE7SUFDSSxLQUFLLFdBQVcsUUFBUSxZQUFjO01BQ2xDLE9BQU8sSUFBSSxFQUFBLGVBQWU7QUFDN0IsTUFBRSxLQUFLLFFBQ1IsS0FBSyxXQUFXLE9BQU8sWUFBYztNQUNqQyxPQUFPLElBQUksRUFBQSxjQUFjO0FBQzVCLE1BQUUsS0FBSztBQUNaOzs7QUFkSixRQUFBOzs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7QUNwS0EsTUFBTSxJQUFVLFFBQVE7O0FBRXhCLElBQWlCOztDQUFqQixTQUFpQjtFQVFiLFNBQVMsRUFBNEIsR0FBcUMsR0FBK0U7SUFDckosTUFBTSxJQUE0QixFQUFBLE1BQU0sbUJBQW1CLFFBQU8sS0FDdkQsRUFBTyxTQUFTLElBQ3hCLEdBQUc7SUFFTixZQUFZLE9BQU8sR0FBMkI7TUFDMUMsUUFBUTtRQUNKLEVBQWUsTUFBTTtBQUN6QjtNQUNBLFFBQVE7UUFDSixFQUFlO0FBQ25COztBQUVSO0VBeUJBLFNBQWdCO0lBQ1osT0FBTyxFQUFRLGlCQUFpQixLQUFLO0FBQ3pDO0VBOUNhLEVBQUEsYUFBYSxLQUViLEVBQUEsUUFBZ0IsUUFBUSxpQkFBaUIsY0FFekMsRUFBQSxpQkFBZ0M7RUFnQjdCLEVBQUEsNkJBQWhCLFNBQTJDLEdBQStFO0lBQ3RILEVBQTRCLHlCQUF5QixHQUFnQjtBQUN6RSxLQUVnQixFQUFBLG9DQUFoQixTQUFrRCxHQUErRTtJQUM3SCxFQUE0QixnQ0FBZ0MsR0FBZ0I7QUFDaEYsS0FFZ0IsRUFBQSxvQ0FBaEI7SUFDSSxNQUFNLElBQVUsRUFBSSxNQUFNLG1CQUFtQixRQUFPLEtBQzFCLCtCQUFmLEVBQU87SUFFbEIsT0FBSSxFQUFRLFNBQVMsSUFDVixFQUFRLEdBQUcsVUFFZjtBQUNYLEtBUWdCLEVBQUEsbUJBQWdCO0FBSW5DLENBbERELENBQWlCLElBQUEsUUFBQSxRQUFBLFFBQUEsTUFBRzs7QUEyRHBCLE1BQWE7RUFDVDtFQUdBLFlBQVk7SUFDUixLQUFLLFNBQVM7QUFDbEI7RUFFQSxhQUFhLEtBQWdCO0lBQ3pCLE1BQU0sSUFBUyxJQUFJO0lBTW5CLE9BREEsRUFBUSxTQUFTLGdDQUFnQyxHQUFRLEtBQUssUUFBUSxJQUFnQixJQUFJLElBQ25GLEVBQU87QUFDbEI7RUFFQTtJQUNJLE1BQU0sSUFBVyxFQUFJO0lBQ3JCLE9BQU8sS0FBSyxPQUFPLElBQUksRUFBUyxPQUFPLGFBQWE7QUFDeEQ7RUFFQTtJQUVJLE9BQXlDLE1BRHJCLEtBQUssZ0JBQ0gsRUFBSTtBQUM5QjtFQUVBO0lBQ0ksTUFBTSxJQUFXLEVBQUk7SUFDckIsT0FBTyxLQUFLLE9BQU8sSUFBSSxFQUFTLE9BQU8sU0FBUztBQUNwRDs7O0FBL0JKLFFBQUE7O0FBbUNBLE1BQU0sSUFBYyxRQUFRLGFBQ3RCLElBQWtCLElBQUk7O0FBQzVCLE1BQU07RUFDRjtFQUNBO0lBQ0ksS0FBSyxTQUFTLE9BQU8sTUFBTTtBQUMvQjtFQUVBO0lBQ0ksT0FBTyxHQUFNLEtBQVUsS0FBSztJQUN2QixLQUNELEVBQVEsU0FBUyxRQUFRO0FBRWpDO0VBRUE7SUFDSSxNQUFNLElBQVMsS0FBSztJQUVwQixPQURBLEtBQUssV0FDRTtBQUNYO0VBRUE7SUFDSSxPQUFPLEtBQVEsS0FBSztJQUNwQixPQUFRLEVBQXVCO0FBQ25DO0VBRUE7SUFDSSxNQUFNLElBQU0sS0FBSyxRQUNYLElBQWdDLE1BQVAsSUFBZixFQUFJO0lBRXBCLE9BQU8sRUFETSxJQUFTLEVBQUksSUFBSSxLQUFLLEVBQUksSUFBSSxJQUFJLEdBQWEsZUFDOUM7QUFDbEI7Ozs7QUMvSEo7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3B4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9sQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiJ9
