/**
 * This module is to be used as a reuseable class to bridge rxjs stream <=> websockets
 * 
 * TODO: Move this into a separate npm module.
 */

import * as Rx from 'rxjs/Rx'
import { List, Range } from 'immutable'
import { Just, Maybe } from './func'

export type LogLevels = 'error' | 'warn' | 'info' | 'verbose' | 'debug'

export interface LogMessage {
    msg: string,
    level: LogLevels
}

declare class LogMsg implements LogMessage {
    msg: string
    level: LogLevels
}

declare class Logger {
    ws: WebSocket

    log: (level: LogLevels, msg: string) => void
    info: (msg: string) => void
    error: (msg: string) => void
    debug: (msg: string) => void
    warn: (msg: string) => void
}

/**
 * The TextMessage defines a very simple message protocol for sending/receiving messages across websocket clients
 * 
 */
export interface TextMessage {
    op: string;    // TODO: Define allowable ops
    type: string;  // 
    tag: string;   // A unique (to the sender) ID so it can be used to track messages
    data: string;  // FIXME: This is really ugly, and should be generic, but Java has issues (type erasure)
    ack: boolean;
}

declare function makeRequest( op: string
                            , type: string
                            , tag: string
                            , data: {}
                            , ack: boolean): TextMessage

/** 
 * Used as a data 'shape' to describe metadata about an Observable
 */
export interface Record {
    component: string;   // name of the component the stream belongs to
    streamName: string;
    streamType: string;
    action?: 'mounted' | 'unmounted';
}

export interface StreamInfo<T> extends Record {
    stream: Rx.Observable<T> | Rx.Subject<T> | null;
}

// An interface describing how to lookup a StreamInfo entry
export interface Lookup {
    cName?: string;
    sName?: string;
    sType?: string;
    index?: Record;
}

export type IndexedStreamInfo<T> = [number, StreamInfo<T>]

export type matcher<T> = Array<IndexedStreamInfo<T>>
                       | Error
declare function getMatched<T>(matched: matcher<T>): Maybe<IndexedStreamInfo<T>>

type LookupResult<T> = Error | Array<IndexedStreamInfo<T>>

declare function 
makeStreamInfo<T extends {}>
              ( cName: string
              , sName: string
              , sType: string
              , start: T | Rx.Observable<T> | Rx.Subject<T>)
              : StreamInfo<T>

/**
 * Filters the List of StreamInfo from this.streams based on the data in lookup
 * 
 * Will throw an error if no fields at all defined in lookup, or if using one of the field name and the index type
 * but they dont both match.  It returns an array of [number, StreamInfo<T>] tuples.  It returns this format so that
 * entries can be deleted (using this.stream.delete).  (note however that only one element can be deleted at a time)
 * 
 * TODO: This is a poor way to find the stream we need.  It's a O(n) (actually (O(n*3))), but we should probably
 * store this.streams as nested maps: Map<string, Map<string, StreamInfo<any>>>
 */
declare function 
lookup<T>( search: Lookup
         , streams: List<StreamInfo<any>>)
         : LookupResult<T>

/**
 * An in-memory data structure that holds all the stored streams (as StreamInfo types)
 * 
 * When some object has a data dependency on another stream, it can look for it here and obtain a reference to the 
 * other stream.  The _register_ method is used to insert a StreamInfo object (which contains a handle to a stream)
 * into this.streams.  Conversely, the _unregister_ method is used to remove a StreamInfo object from the Dispatch.
 * 
 * Because streams can be dynamically added and removed from Dispatch, objects can subscribe to Dispatch's this.info
 * subject.  This stream will send 'mount' and 'unmount' events so that interested parties can now when streams 
 * have either been added or removed from Dispatch
 */
declare class Dispatch {
    streams: List<StreamInfo<any>>
    info: Rx.BehaviorSubject<Record>

    // TODO: this.info.next() should send a TextMessage with the data field set to the Record
    register<T>(smap: StreamInfo<T>): void

    /**
     * Give a Record type, lookup in this.streams and remove if it is found.
     *
     * Sends a new emitted record from this.info Subject to let any interested parties know that the
     * StreamMap has been deleted.
     */
    unregister<T>(rec: Record): StreamInfo<T> 
}

/**
 * A Websocket to rxjs Observable bridge
 */
export class WStoStreamBridge {
    ws: WebSocket
    dispatch: Maybe<Dispatch>
    streams: List<StreamInfo<any>>

    constructor(url: string, disp?: Dispatch)

    /**
     * Adds a StreamInfo object to thee internal this.streams.
     * 
     * Can be used if a StreamInfo type is already available, or if there is no dispatch.  This method
     * will subscribe to the StreamInfo.stream, and forward the items it receives over the websocket
     * 
     * FIXME:  we need to take care here of backpressure.  Since websockets are slower than in-memory 
     * data structures, we need to be mindful of this.  Not to mention we can funnel several Observable
     * streams to a single websocket.  Because of this, we may want to to debounce some streams.  for example
     * we may want to debounce or accumulate events and send them at once.
     */
    add<T>(si: StreamInfo<T>): void

    /**
     * Looks up an Observable in dispatch and adds to its internal this.streams
     */
    bridge<T>(search: Lookup): void
    /**
     * We only unbridge from the internel this.streams, not from this.dispatch.streams
     */
    unbridge(search: Lookup): void
}

declare namespace Func {
    export class Just<T> {
        value: T
        public constructor(value: T)
    
        public get(): T
    }
    
    export type Maybe<T> = Just<T> | null
    export type Optional<T> = T | null
}

declare const dispatch: Dispatch