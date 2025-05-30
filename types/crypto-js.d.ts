declare module 'crypto-js' {
  interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: any): string;
    concat(wordArray: WordArray): WordArray;
    clamp(): void;
    clone(): WordArray;
  }

  interface CipherParams {
    ciphertext: WordArray;
    key: WordArray;
    iv: WordArray;
    salt: WordArray;
    algorithm: any;
    mode: any;
    padding: any;
    blockSize: number;
    formatter: any;
    toString(formatter?: any): string;
  }

  interface CipherOption {
    iv?: WordArray | string;
    mode?: any;
    padding?: any;
    format?: any;
  }

  namespace AES {
    function encrypt(message: string | WordArray, key: string | WordArray, cfg?: CipherOption): CipherParams;
    function decrypt(ciphertext: string | CipherParams, key: string | WordArray, cfg?: CipherOption): WordArray;
  }

  namespace enc {
    const Utf8: any;
    const Hex: any;
    const Base64: any;
  }

  namespace lib {
    const WordArray: any;
  }

  namespace mode {
    const CBC: any;
    const CFB: any;
    const CTR: any;
    const ECB: any;
    const OFB: any;
  }

  namespace pad {
    const Pkcs7: any;
    const AnsiX923: any;
    const Iso10126: any;
    const Iso97971: any;
    const NoPadding: any;
    const ZeroPadding: any;
  }

  namespace format {
    const OpenSSL: any;
  }

  function MD5(message: string | WordArray): WordArray;
  function SHA1(message: string | WordArray): WordArray;
  function SHA256(message: string | WordArray): WordArray;
  function SHA512(message: string | WordArray): WordArray;
  function SHA3(message: string | WordArray): WordArray;
  function RIPEMD160(message: string | WordArray): WordArray;
  function HmacMD5(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA1(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA256(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA512(message: string | WordArray, key: string | WordArray): WordArray;
  function PBKDF2(password: string | WordArray, salt: string | WordArray, cfg?: any): WordArray;
} 