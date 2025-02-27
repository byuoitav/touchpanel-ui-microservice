import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';

// This interceptor attaches the camera control key to the request headers for every request
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const controlKey = document.cookie.split('; ').find(row => row.startsWith('control-key='))?.split('=')[1];

    if (controlKey) {
      const clonedReq = req.clone({
        setHeaders: {
          'Cookie': `control-key=${controlKey}`
        }
      });
      return next.handle(clonedReq);
    }
    
    return next.handle(req);
  }
}
