const android = require("frida-java-bridge/lib/android")

export namespace art {

    export const kAccNative = 0x0100;

    export const artso: Module = Process.findModuleByName("libart.so")!;

    export type ArtQuickInvokeType = "art_quick_invoke_stub" | "art_quick_invoke_static_stub";
    function _hook_art_quick_invoke_stub(quickInvokeType: ArtQuickInvokeType, enter_callback: (_this: InvocationContext, args: InvocationArguments) => void, leave_callback: (_this: InvocationContext) => void) {
        const art_quick_invoke_stub_ptr = artso.enumerateSymbols().filter(symbol => {
            return symbol.name === quickInvokeType
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
    export function hook_art_quick_invoke_stub(enter_callback: (_this: InvocationContext, args: InvocationArguments) => void, leave_callback: (_this: InvocationContext) => void) {
        _hook_art_quick_invoke_stub("art_quick_invoke_stub", enter_callback, leave_callback);
    }

    export function hook_art_quick_invoke_static_stub(enter_callback: (_this: InvocationContext, args: InvocationArguments) => void, leave_callback: (_this: InvocationContext) => void) {
        _hook_art_quick_invoke_stub("art_quick_invoke_static_stub", enter_callback, leave_callback);
    }

    /**
     * 获取 ArtMethod 常用 属性 偏移
     * 原理 通过 找一个合适的 methodId(ArtMethod) 
     * 遍历内存 0~0x60 之间 。 找到的合适的数据判断数据范围 对应上偏移
     * @returns ArtMethodSpec
     */
    export function getArtMethodSpec(): ArtMethodSpec {
        return android.getArtMethodSpec(Java.vm);
    }

}
export type ArtMethodSpec = {
    size: number,
    offset: {
        jniCode: number,
        quickCode: number,
        accessFlags: number
    }
}
export class ArtMethod {
    handle: NativePointer


    constructor(handle: NativePointer) {
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

    accessFlags(): number {
        const artMSpec = art.getArtMethodSpec();
        return this.handle.add(artMSpec.offset.accessFlags).readU32();
    }

    isNative(): boolean {
        const accessFlags = this.accessFlags();
        return (accessFlags & art.kAccNative) != 0;
    }

    jniCodePtr(): NativePointer {
        const artMSpec = art.getArtMethodSpec();
        return this.handle.add(artMSpec.offset.jniCode).readPointer();
    }

}

const pointerSize = Process.pointerSize;
const STD_STRING_SIZE = 3 * pointerSize;
class StdString implements ObjectWrapper {
    handle: NativePointer
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
        return (data as NativePointer).readUtf8String();
    }

    _getData() {
        const str = this.handle;
        const isTiny = (str.readU8() & 1) === 0;
        const data = isTiny ? str.add(1) : str.add(2 * pointerSize).readPointer();
        return [data, isTiny];
    }
}