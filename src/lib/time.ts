export class Time {
  private _last?: number
  private elapsed!: number
  start () {
    // ?? IDK
    // Not sure if setting this
    // outside of the loop is a good idea. If
    // the processor startup is slow the initial
    // delta could be larger than it should.
    this._last = Date.now()
  }
  /**
   * "Get the time delta in seconds since the last time this function was called."
   * @returns The time delta in seconds.
   */
  getTimeDelta () {
    const current = Date.now()
    const delta = current - this._last!
    this._last = current
    this.elapsed += delta
    return this.toSeconds(delta)
  }

  toSeconds (ms: number) {
    return ms / 1000
  }
}
