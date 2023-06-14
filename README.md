# luckzh_fnative_monitor

写这个项目 本意是想 监控native 下的 svc 调用来协助我分析 anti_frida。
但发现还是多学学 elf结构 和 so修复 才管用。

所以这个项目 由于逆向经验少,和技术 代码质量问题,我并不能完全写完。

**但是弃之可惜,所以我发在github上希望有人指导完善下,能够让我学习学习**

不过目前来说功能还是可以用的,各位可以尝试用用看

个人测试 android 10. 理论上 android9~ 以上都行。
现在只支持 **arm64**

## 观察范围

目前观察范围有 3个 

### jni 观察
  
关于 jni 观察实际原理我不确定是否都通用
目前我所搜索的资料和测试效果来说,所有的 android 方法都走 **libart.so** 中的 **ArtMethod::Invoke**

``` cpp
void ArtMethod::Invoke(Thread* self, uint32_t* args, uint32_t args_size, JValue* result,
                       const char* shorty) {
                       
   if (UNLIKELY(!runtime->IsStarted() ||
               (self->IsForceInterpreter() && !IsNative() && !IsProxyMethod() && IsInvokable()))) {
                //... 非静态方法
     }else{
        //如果 native 是非静态调用 art_quick_invoke_stub
      if (!IsStatic()) {
        (*art_quick_invoke_stub)(this, args, args_size, self, result, shorty);
      } else {
        // 静态方法调用 art_quick_invoke_static_stub
        (*art_quick_invoke_static_stub)(this, args, args_size, self, result, shorty);
      }

     }                                 
}
```
虽然通过 **art_quick_invoke_stub** 和 **art_quick_invoke_static_stub**
能够监控到 **native** 方法调用,但是我发现了两个问题。

1. 部分情况会对 .dex 文件 被 jit 编译成 oat 二进制文件,导致第一次观察堆栈情况不完整,但是调用第二次 又可以成功观察到 jni 调用。

下面是观察 **oat**文件的堆栈
```
|0x7443ab7338 libart.so!art_quick_invoke_stub+0x228
   |0x74386a51e0 base.odex!0x1f1e0 
```

2. 在注册native 方法时，进行校验 