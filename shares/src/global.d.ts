declare global {
    namespace NodeJS {
        interface ProcessEnv {
            STORAGE_ADDRESS: string;
        }
    }
}