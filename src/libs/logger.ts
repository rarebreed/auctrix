import { LogLevels } from '../auctrix.d'

export class Logger {
    ws: WebSocket

    constructor(ws: WebSocket) {
        this.ws = ws
        ws.onopen = (evt: Event) => {
            console.log("Websocket is open")
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
        this.ws.send(JSON.stringify({level: level, msg: msg}))
    }

    log = (level: LogLevels, msg: string) => this._log(level)(msg)    
    info = this._log('info')
    error = this._log('error')
    debug = this._log('debug')
    warn = this._log('warn')
}