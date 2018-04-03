export class Just<T> {
    value: T
    public constructor(value: T) {
        this.value = value
    }

    public get(): T {
        return this.value
    }
}

export type Maybe<T> = Just<T> | null
export type Optional<T> = T | null