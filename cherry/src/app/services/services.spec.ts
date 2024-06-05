import { TestBed } from '@angular/core/testing';
import { SocketService, MESSAGE } from './socket.service';
import { EventEmitter } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observer, of, throwError } from 'rxjs';
import { WebSocketSubjectConfig } from 'rxjs/webSocket';
import { mock } from 'node:test';
import { _fixedSizeVirtualScrollStrategyFactory } from '@angular/cdk/scrolling';
import { JsonConvert } from 'json2typescript';

jest.mock('rxjs/webSocket', () => ({
    webSocket: jest.fn()
}));

jest.mock('json2typescript', () => {
    const actualJson2typescript = jest.requireActual('json2typescript');
    return {
        ...actualJson2typescript,
        JsonObject: () => (constructor: Function) => { },
        JsonProperty: () => (target: any, propertyKey: string | symbol) => { }
    };
});

describe("Websocket", () => {
    let socketService: SocketService;
    let mockWebSocket: WebSocketSubject<any>;
    let mockObserver: Observer<any>;
    let mockJsonConvert: JsonConvert;
    let originalLocationAssign: typeof location.assign;


    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SocketService]
        });

        socketService = TestBed.inject(SocketService);

        mockWebSocket = {
            next: jest.fn(),
            subscribe: jest.fn().mockImplementation(callbacks => {
                mockObserver = callbacks;
            })
        } as unknown as WebSocketSubject<any>;

        (webSocket as jest.Mock).mockReturnValue(mockWebSocket);

        mockJsonConvert = new JsonConvert();
        jest.spyOn(mockJsonConvert, 'deserialize').mockReturnValue(
            { type: 'mockEvent', data: {} } as unknown as Event);

        Object.defineProperty(window, 'location', {
            value: {
                assign: jest.fn()
            },
            writable: true
        });

        originalLocationAssign = location.assign;

        Object.defineProperty(window, 'location', {
            value: {
                assign: jest.fn(),
                hostname: window.location.hostname
            },
            writable: true
        });

    });

    afterEach(() => {
        jest.clearAllMocks();
        window.location.assign = originalLocationAssign;
    });

    it('websocket service created', () => {
        expect(socketService).toBeTruthy();
        expect(socketService.screenoff).toBe(false);
    });

    it('handle keepalive message', () => {
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'keepalive' });
        expect(mockWebSocket.next).toHaveBeenCalledWith({ type: 'ping' });
    });

    it('handle refresh message', () => {
        const assignSpy = jest.spyOn(location, 'assign').mockImplementation(() => { });
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'refresh' });
        expect(assignSpy).toHaveBeenCalledWith(`http://${location.hostname}:8888/`);
    });

    it('handle screenoff message', () => {
        socketService.screenoff = false;
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'screenoff' });
        expect(socketService.screenoff).toBe(true);
    });

    it('handle websocketTest message', () => {
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'websocketTest' });
        expect(mockWebSocket.next).toHaveBeenCalledWith({ type: 'websocketTest' });
    });

    it('handle other messages and emit event', () => {
        const eventEmitterSpy = jest.spyOn(socketService['listener'], 'emit');
    
        socketService.getEventListener().subscribe();
        const mockMsg = '{"message": "mockEvent", "data": {}}'; 
        mockObserver.next(mockMsg);

        expect(eventEmitterSpy).toHaveBeenCalled();
      });
});
