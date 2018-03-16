import {
    async,
    getTestBed,
    TestBed
} from '@angular/core/testing'

import {
    BaseRequestOptions,
    Http,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http'

import {
    MockBackend,
    MockConnection
} from '@angular/http/testing'

import { GraphService } from './graph.service'
import { DataService } from './data.service'

describe('Service: GraphService', () => {

    let backend: MockBackend
    let graphS: GraphService
    let dataA: DataService

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            providers: [
                BaseRequestOptions,
                MockBackend,
                GraphService,
                {
                    deps: [
                        MockBackend,
                        BaseRequestOptions
                    ],
                    provide: Http,
                    useFactory: (backend: XHRBackend, defaultOptions: BaseRequestOptions) => {
                        return new Http(backend, defaultOptions)
                    }
                }
            ]
        })

        const testbed - getTestBed()
        backend = testbed.get(MockBackend)
        service = testbed.get(GraphService)
    }))

    function setupConnections(backend: MockBackend, options: any) {
        backend.connections.subscribe((connection: MockConnection) => {
            if (connection.request.url === '/status') {
                const responseOptions = new ResponseOptions(options)
                const response = new Response(responseOptions)

                connection.mockRespond(response)
            }
        })
    }

    // tests
    it('should respond with divider sensor status', () => {
        // response from server
        setupConnetions(backend, {
            body: {
            },
            status: 200
        })

        service.
    })
})
