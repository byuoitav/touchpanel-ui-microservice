import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SocketService, MESSAGE } from './socket.service';
import { EventEmitter } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observer, of, throwError } from 'rxjs';
import { WebSocketSubjectConfig } from 'rxjs/webSocket';
import { mock } from 'node:test';
import { _fixedSizeVirtualScrollStrategyFactory } from '@angular/cdk/scrolling';
import { JsonConvert } from 'json2typescript';
import { APIService, ThemeService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { start } from 'node:repl';


//--------------------------------WEBSOCKET SERVICE-----------------------------------------

jest.mock('rxjs/webSocket', () => ({
    webSocket: jest.fn()
}));

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

    it('should create Websocket Service', () => {
        expect(socketService).toBeTruthy();
        expect(socketService.screenoff).toBe(false);
    });

    it('should handle keepalive message', () => {
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'keepalive' });
        expect(mockWebSocket.next).toHaveBeenCalledWith({ type: 'ping' });
    });

    it('should handle refresh message', () => {
        const assignSpy = jest.spyOn(location, 'assign').mockImplementation(() => { });
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'refresh' });
        expect(assignSpy).toHaveBeenCalledWith(`http://${location.hostname}:8888/`);
    });

    it('should handle screenoff message', () => {
        socketService.screenoff = false;
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'screenoff' });
        expect(socketService.screenoff).toBe(true);
    });

    it('should handle websocketTest message', () => {
        socketService.getEventListener().subscribe();
        mockObserver.next({ message: 'websocketTest' });
        expect(mockWebSocket.next).toHaveBeenCalledWith({ type: 'websocketTest' });
    });

    it('should handle other messages and emit event', () => {
        const eventEmitterSpy = jest.spyOn(socketService['listener'], 'emit');

        socketService.getEventListener().subscribe();
        var data = `  
{ 
  "generating-system": "ENSN-506-CP1", 
  "timestamp": "2024-07-01T17:40:59.682468099Z", 
  "event-tags": ["core-state", "user-generated", "room-system"], 
  "target-device": { 
    "buildingID": "ENSN", 
    "roomID": "ENSN-506", 
    "deviceID": "ENSN-506-D1"
  }, 
  "affected-room": { 
    "buildingID": "ENSN", 
    "roomID": "ENSN-506"
  }, 
  "key": "input", 
  "value": "HDMI1",
  "user": "10.0.93.22" 
}`;
        mockObserver.next(JSON.stringify(data));
        expect(eventEmitterSpy).toHaveBeenCalled();
        data = `  
            {"generating-system":"ENSN-506-CP1","timestamp":"2024-07-01T11:58:06.081131933-06:00","event-tags":["core-state","auto-generated"],"target-device":{"buildingID":"ENSN","roomID":"ENSN-506","deviceID":"ENSN-506-D1"},"affected-room":{"buildingID":"ENSN","roomID":"ENSN-506"},"key":"blanked","value":"false","user":""}
        `;
        mockObserver.next(JSON.stringify(data));
        expect(eventEmitterSpy).toHaveBeenCalledTimes(2);
        data = `  
           {"generating-system":"ENSN-506-CP1","timestamp":"2024-07-01T18:04:57.81574701Z","event-tags":["core-state","user-generated","room-system"],"target-device":{"buildingID":"ENSN","roomID":"ENSN-506","deviceID":"ENSN-506-D1"},"affected-room":{"buildingID":"ENSN","roomID":"ENSN-506"},"key":"input","value":"HDMI1","user":"10.0.93.42"}
        `;
        mockObserver.next(JSON.stringify(data));
        expect(eventEmitterSpy).toHaveBeenCalledTimes(3);


    });

    it('should handle errors', () => {
        const consoleSpy = jest.spyOn(console, 'debug');
        socketService.getEventListener().subscribe();
        mockObserver.error('error');
        expect(consoleSpy).toHaveBeenCalledWith("Observer Error:", "error");

    });

    it('should handle completion', () => {
        const consoleSpy = jest.spyOn(console, 'debug');
        socketService.getEventListener().subscribe();
        mockObserver.complete();
        expect(consoleSpy).toHaveBeenCalledWith("Observer Complete");
    });

});

//-----------------------------------API SERVICE-----------------------------------------

describe('API Service', () => {
    let fixture: APIService;
    let httpMock;
    let themeServiceMock;
    let setupHostnameSpy: jest.SpyInstance;
    let getHostnameSpy: jest.SpyInstance;
    let setupPiHostnameSpy: jest.SpyInstance;
    const HOST_NAME = "MOCK-1234";
    const RETRY_TIMEOUT = 6 * 1000;

    beforeEach(() => {
        themeServiceMock = {
            fetchTheme: jest.fn()
        }

        httpMock = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn()
        }

        // Mock the HTTP call to get hostname from /hostname when instantiating class
        httpMock.get.mockReturnValue(of(HOST_NAME));

        // Spies
        setupHostnameSpy = jest.spyOn(APIService.prototype, 'setupHostname' as any);
        getHostnameSpy = jest.spyOn(APIService.prototype, 'getHostname' as any);
        setupPiHostnameSpy = jest.spyOn(APIService.prototype, 'setupPiHostname' as any);


    });

    afterEach(() => {
        // Restore the spy after each test
        setupHostnameSpy.mockRestore();
        getHostnameSpy.mockRestore();
        setupPiHostnameSpy.mockRestore();
        jest.clearAllMocks();
        fixture = null;
    });

    const startService = () => {
        fixture = new APIService(
            httpMock,
            themeServiceMock
        )
        APIService.resetForTesting();
    }

    describe('Instantiating Class', () => { //setupHostname()

        it('should create APIService and call setupHostname', () => {
            startService();
            expect(fixture).toBeTruthy();
            expect(setupHostnameSpy).toHaveBeenCalled();
            expect(setupPiHostnameSpy).toHaveBeenCalled();
        });
    });

    describe('Setting Hostname', () => { // setupHostname()
        it('should set the correct hostname', () => {
            startService();
            expect(getHostnameSpy).toHaveBeenCalled();
            expect(setupPiHostnameSpy).toHaveBeenCalled();
            expect(APIService.hostname).toBe(HOST_NAME);
        });

        it('should retry if error', fakeAsync(() => {
            setupPiHostnameSpy.mockReturnValueOnce(HOST_NAME);
            getHostnameSpy.mockReturnValueOnce(throwError('error'))
                .mockReturnValueOnce(throwError('error'))
                .mockReturnValue(of('testHostname'));
            startService();
            // Manually advance time by RETRY_TIMEOUT milliseconds (retry interval)
            tick(RETRY_TIMEOUT);

            // called twice, got errors both times
            expect(getHostnameSpy).toHaveBeenCalledTimes(2);

            tick(RETRY_TIMEOUT);

            // called three times, got error twice and success once
            expect(getHostnameSpy).toHaveBeenCalledTimes(3);

            //wait 
            tick(RETRY_TIMEOUT);

            // Assertions after completion and third try
            expect(getHostnameSpy).toHaveBeenCalledTimes(3); // Verify final call count
            expect(setupPiHostnameSpy).toHaveBeenCalled();
            expect(APIService.hostname).toBe('testHostname');
        }));

        it('should log completion message', () => {
            const consoleSpy = jest.spyOn(console, 'debug');
            startService();
            expect(consoleSpy).toHaveBeenCalledWith('Observer getHostname got a complete notification');
            setTimeout(() => {
                // Check if console.debug was called with the complete notification
                expect(consoleSpy).toHaveBeenCalledWith('Observer getHostname got a complete notification');
            }, 100);
        });
    });
});


//-----------------------------------THEME SERVICE-----------------------------------------
describe('Theme Service', () => {
    let httpMock;
    let fixture: ThemeService;
    const mockLogoUrl = '<svg>...</svg>';

    const mockThemeConfig = {
        'background-color': '#ffffff',
        'top-bar-color': '#000000',
        'background-color-accent': '#cccccc',
        'dpad-color': '#ff0000',
        'dpad-press': '#00ff00',
        'cam-preset-color': '#0000ff',
        'cam-preset-press': '#ff00ff',
        'volume-slider-color': '#00ffff',
        'help-button-color': '#ffff00',
        'text-color': '#333333',
        'font-name': 'Arial',
        'font-link': 'https://example.com/font.css',
        'show-cam-text': true,
        'cam-link': 'https://example.com/cam'
    };

    const mockThemeConfigNoCam = {
        'background-color': '#ffffff',
        'top-bar-color': '#000000',
        'background-color-accent': '#cccccc',
        'dpad-color': '#ff0000',
        'dpad-press': '#00ff00',
        'cam-preset-color': '#0000ff',
        'cam-preset-press': '#ff00ff',
        'volume-slider-color': '#00ffff',
        'help-button-color': '#ffff00',
        'text-color': '#333333',
        'font-name': 'Arial',
        'font-link': 'https://example.com/font.css',
        'show-cam-text': false,
        'cam-link': 'https://example.com/cam'
    };




    beforeEach(() => {
        httpMock = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn()
        }

        fixture = new ThemeService(
            httpMock
        )

        httpMock.get.mockReturnValue(of(mockLogoUrl));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return the logo URL', () => {
        fixture.getLogo().subscribe((logo: string) => {
            expect(logo).toBe(mockLogoUrl);
        });
    });

    it('should fetch and apply theme configuration correctly', async () => {
        const getThemeConfigSpy = jest.spyOn(fixture, 'getThemeConfig');
        getThemeConfigSpy.mockReturnValue(of(mockThemeConfig));
        const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

        await fixture.fetchTheme();

        expect(setPropertySpy).toHaveBeenCalledWith('--background-color', '#ffffff');
        expect(setPropertySpy).toHaveBeenCalledWith('--top-bar-color', '#000000');
        expect(setPropertySpy).toHaveBeenCalledWith('--background-color-accent', '#cccccc');
        expect(setPropertySpy).toHaveBeenCalledWith('--dpad-color', '#ff0000');
        expect(setPropertySpy).toHaveBeenCalledWith('--dpad-press', '#00ff00');
        expect(setPropertySpy).toHaveBeenCalledWith('--cam-preset-color', '#0000ff');
        expect(setPropertySpy).toHaveBeenCalledWith('--cam-preset-press', '#ff00ff');
        expect(setPropertySpy).toHaveBeenCalledWith('--volume-slider-color', '#00ffff');
        expect(setPropertySpy).toHaveBeenCalledWith('--help-button-color', '#ffff00');
        expect(setPropertySpy).toHaveBeenCalledWith('--text-color', '#333333');
        expect(setPropertySpy).toHaveBeenCalledWith('--font-name', 'Arial');
    });

    it('should hide cam text if show-cam-text is false', async () => {
        const mockThemeConfig = mockThemeConfigNoCam;

        const getThemeConfigSpy = jest.spyOn(fixture, 'getThemeConfig');
        getThemeConfigSpy.mockReturnValue(of(mockThemeConfig));
        const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

        await fixture.fetchTheme();

        expect(setPropertySpy).toHaveBeenCalledWith('--show-cam-text', 'none');
    });

    it('should use default values if theme config is missing', async () => {
        const consoleSpy = jest.spyOn(console, 'log');

        const getThemeConfigSpy = jest.spyOn(fixture, 'getThemeConfig');
        getThemeConfigSpy.mockReturnValue(of(""));
        const setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

        await fixture.fetchTheme();

        expect(setPropertySpy).not.toHaveBeenCalled();

        expect(consoleSpy).toHaveBeenCalledWith('Error: No theme configuration received. Using default values.');
    });

    it('should handle errors in getThemeConfig()', async () => {
        jest.spyOn(fixture, 'getThemeConfig').mockReturnValue(throwError(new Error('Network error')));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await fixture.fetchTheme();

        expect(consoleErrorSpy).toHaveBeenCalledWith('There was a problem with the fetch operation:', 'Network error');
    });

    it('should handle errors in getThemeConfig', async () => {
        jest.spyOn(fixture, 'getThemeConfig').mockReturnValue(throwError(new Error('Network error')));
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await fixture.fetchTheme();

        expect(consoleErrorSpy).toHaveBeenCalledWith('There was a problem with the fetch operation:', 'Network error');
    });

    it('should get the theme config ( getThemeConfig() )', () => {
        httpMock.get.mockReturnValue(of(mockThemeConfig));
        fixture.getThemeConfig().subscribe((config: any) => {
            expect(config).toBe(mockThemeConfig);
        });
    });
});