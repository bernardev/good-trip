declare module 'qrcode' {
  type ToDataURLOptions = {
    width?: number;
    margin?: number;
    color?: { dark?: string; light?: string };
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    scale?: number;
  };
  
  interface QRCodeStatic {
    toDataURL(text: string, options?: ToDataURLOptions): Promise<string>;
    toDataURL(text: string, cb: (err: Error | null, url: string) => void): void;
  }
  
  const QRCode: QRCodeStatic;
  export default QRCode;
}