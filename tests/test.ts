import { dispatch } from '../src/auctrix'
import { StreamInfo } from '../src/auctrix.d'
import { Logger } from '../src/libs/logger'
import * as Rx from 'rxjs/Rx'
import 'jasmine'
const WebSocket = require('ws')

// 1. Create a producer
let prod$ = Rx.Observable.from([1, 2, 3])

// 2. Register the producer with dispatch
let prodInfo: StreamInfo<number> = {
    component: "test",
    streamName: "producer-test",
    streamType: "number",
    action: "mounted",
    stream: prod$
}
dispatch.register(prodInfo)

// 3. Create a logger
let ws = new WebSocket('ws://localhost:4000/ws')
let logger = new Logger(ws)

// 4. Create a consumer that will do what we want
let consumer: Rx.Observer<number> = {
    next(n: number) {
        logger.info(`Got a number of ${n}`)
    },
    error(e: Error) {
        logger.error("Error occurred")
    },
    complete() {
        logger.info("Got a completion event")
    }
}

// 5. Consumer observes the dispatch.info stream 
dispatch.info.subscribe({
    next: (r: StreamInfo<number>) => {
        if (r.component !== 'test' || r.action !== 'mounted' || r.stream == null)
            return
        r.stream.subscribe(consumer)
    }
})
