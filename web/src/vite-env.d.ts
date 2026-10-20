/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** where the kitchen's gRPC-Web port is, if not http://localhost:5080. */
    readonly VITE_LUNCH_SERVER?: string;
}
