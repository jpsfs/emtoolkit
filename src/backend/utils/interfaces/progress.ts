/**
 * Progress Report Utility
 */
export interface Progress {
    Setup(): Promise<void>;
    Activity<T>(name: string, activiy: () => Promise<T>): Promise<T>;
    Dispose(): void;
    LevelUp(): void;
    LevelDown(): void;
}

/**
 * Progress Activity
 */
export interface ProgressActivity {
    Complete(): void;
}