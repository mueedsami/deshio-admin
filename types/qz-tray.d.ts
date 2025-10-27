declare global {
  interface Window {
    qz: {
      websocket: {
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
      };
      configs: {
        create: (printer: string | null) => any;
      };
      print: (config: any, data: any[]) => Promise<void>;
    };
  }
}

export {};