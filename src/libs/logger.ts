import { LogLevels, NodeWS } from '../auctrix.d'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
const WS = require('ws')

export class Logger {
    ws: NodeWS.NWebSocket
    subject: BehaviorSubject<{level: string, msg: string}>

    constructor(webs: NodeWS.NWebSocket | string) {
        this.subject = new BehaviorSubject({level: "info", msg: 'default'})
        if (webs instanceof String) {
            this.ws = new WS(webs)
        }
        if (webs instanceof NodeWS.NWebSocket)
            this.ws = webs
        this.ws.onopen = () => {
            console.log("Websocket is open")
            this.subject.subscribe({
                next: (n) => {
                    this.ws.send(JSON.stringify(n))
                },
                error: (e) => {
                    this.ws.send(JSON.stringify(e))
                },
                complete: () => console.log('Subject completed')
            })
        }
        this.ws.onmessage = (msg: string) => {
            console.log(`received: ${msg}`)
        }
        this.ws.onconnect = (webs: NodeWS.NWebSocket) => {
            console.log(('Got a connection'))
        }
    }

    /**
     * A curried style function that will make a LogMsg type to be sent over a websocket.
     * The websocket server on the other end will take this message and persist to a log file
     */
    _log = (level: LogLevels) => (msg: string) => {
        switch(level) {
            case 'info':
                console.log(msg)
                break
            case 'error':
                console.error(msg)
                break
            case 'debug':
                console.debug(msg)
                break
            default:
                console.log(msg)
        }
        this.subject.next({level: level, msg: msg})
    }

    log = (level: LogLevels, msg: string) => this._log(level)(msg)    
    info = this._log('info')
    error = this._log('error')
    debug = this._log('debug')
    warn = this._log('warn')

    test = () => {
        console.log('testing')
        this.ws.send(JSON.stringify({msg: 'testing'}))
    }
}