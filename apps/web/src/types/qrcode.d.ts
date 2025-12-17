declare module 'qrcode' {
  type ToDataURLOptions = {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
    [key: string]: any;
  };

  interface QRCodeStatic {
    toDataURL(text: string, options?: ToDataURLOptions): Promise<string>;
    toDataURL(text: string, cb: (err: Error | null, url: string) => void): void;
    [key: string]: any;
  }

  const QRCode: QRCodeStatic;
  export default QRCode;
}
