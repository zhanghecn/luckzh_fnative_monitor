export interface ThreadObserver {
    watchMain(): void;

    watchPthreadCreate(): void

    watchOptions(tid: number): StalkerOptions;
}