export interface ThreadObserver {
    /**
     * 观察main线程
     * 由于main线程执行过多
     * 所以只观察 jni 调用
     */
    watchMain(): void;

    /**
     * 在 java 中 new Thread().. 等大多数创建线程采用的是
     * pthread_create 我们可以监控它 来动态跟踪线程 操作指令
     */
    watchPthreadCreate(): void

    watchJniInvoke():void 

    watchElfInit():void
    
    /**
     * 取消监控
     * @param tid 线程 id 
     */
    unwatch():void;

}
