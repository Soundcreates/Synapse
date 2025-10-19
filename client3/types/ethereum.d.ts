// Global type declarations for Ethereum provider

interface Window {
  ethereum?: any;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export {};
