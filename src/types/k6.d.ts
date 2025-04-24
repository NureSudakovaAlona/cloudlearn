// k6.d.ts
declare module 'k6' {
  export function sleep(time: number): void;
  export function check(obj: any, checks: object): boolean;
  export const options: any;
}

declare module 'k6/http' {
  export interface Response {
    status: number;
    body: string;
    headers: { [name: string]: string };
    timings: {
      duration: number;
      blocked: number;
      connecting: number;
      tls_handshaking: number;
      sending: number;
      waiting: number;
      receiving: number;
    };
  }

  export function get(url: string, params?: any): Response;
  export function post(url: string, body?: any, params?: any): Response;
  export function put(url: string, body?: any, params?: any): Response;
  export function del(url: string, body?: any, params?: any): Response;
}

// Глобальні змінні k6
declare const __VU: number;
declare const __ITER: number;