declare module 'js-cookie' {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'Strict' | 'lax' | 'Lax' | 'none' | 'None';
    [property: string]: any;
  }

  interface CookiesStatic {
    /**
     * 쿠키 설정
     */
    set(name: string, value: string | object, options?: CookieAttributes): string | undefined;
    
    /**
     * 쿠키 가져오기
     */
    get(name: string): string | undefined;
    get(): {[name: string]: string};
    
    /**
     * 쿠키 삭제
     */
    remove(name: string, options?: CookieAttributes): void;
    
    /**
     * 기본 속성 설정
     */
    withAttributes(attributes: CookieAttributes): CookiesStatic;
    
    /**
     * 기본 경로 설정
     */
    withConverter(converter: {
      read(value: string): string | object;
      write(value: string | object): string;
    }): CookiesStatic;
  }

  const Cookies: CookiesStatic;
  export default Cookies;
} 