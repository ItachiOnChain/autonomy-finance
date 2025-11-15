/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_AUTONOMY_ADDRESS: string
  readonly VITE_ADAPTER_ADDRESS: string
  readonly VITE_RWA_ADAPTER_ADDRESS: string
  readonly VITE_ATASSET_ADDRESS: string
  readonly VITE_COLLATERAL_ADDRESS: string
  readonly VITE_PRICE_ORACLE_ADDRESS: string
  readonly VITE_RWA_ORACLE_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

