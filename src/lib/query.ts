import { EntityComponent } from './components'
import { Entity, EntityBehavior } from './entities'
import { EntityBehaviorStore } from './store'

export class QueryCache {
  private _cache: Map<string, Entity[]> = new Map()
  cache (query: string, entities: Entity[]) {
    this._cache.set(query, entities)
  }
  get (query: string) {
    console.log('🧊🧊🧊 Using cache on query: ', query)
    return this._cache.get(query)
  }
  has (query: string) {
    return this._cache.has(query)
  }
}

export interface IQueryBuilder {
  with(...queries: any[]): IQueryBuilder
  without(...queries: any[]): IQueryBuilder
  where(item: any, comparer: (data: typeof item) => boolean): IQueryBuilder
  exec(): Entity[]
}

export class ComponentQueryBuilder<T = any> implements IQueryBuilder {
  private _withQueries: Set<string> = new Set()
  private _withoutQueries: Set<string> = new Set()
  private _whereQueries: Map<string, (data: EntityComponent<any>) => boolean> =
    new Map()
  private _results: EntityComponent<T>[] = []
  constructor (
    private store: EntityBehaviorStore<T>,
    private _cache: QueryCache
  ) {}
  with<K extends keyof T> (...queries: K[]) {
    for (const query of queries) {
      this._withQueries.add(query as string)
    }
    return this
  }
  without<K extends keyof T> (...queries: K[]) {
    for (const query of queries) {
      this._withoutQueries.add(query as string)
    }
    return this
  }
  where<K extends keyof T> (
    component: K,
    comparer: (component: T[K]) => boolean
  ) {
    this._whereQueries.set(component as string, comparer as any)
    return this
  }
  private createCacheKey = () => {
    const withKey =
      '(WITH: [' + Array.from(this._withQueries.values()).join('&') + '])'
    const withoutKey =
      '(WITHOUT: [' + Array.from(this._withQueries.values()).join('&') + '])'
    const whereKey =
      '(WHERE: [' +
      Array.from(this._whereQueries.entries())
        .map(e => `${e[0]} === ${e[1]}`)
        .join('&') +
      '])'
    return 'cqry: ' + withKey + ' ' + withoutKey + ' ' + whereKey
  }
  private processWhere () {
    if (!this._results.length)
      throw new Error(
        'A WHERE query must be accompanied by at least one WITH or WITHOUT queries.'
      )
    if (!this._whereQueries.size) return
    let spliceIndex = 0
    const splicePoints: number[] = []
    for (const component of this._results) {
      if (!this._whereQueries.has(component.name)) {
        spliceIndex += 1
        continue
      }
      if (this._whereQueries.get(component.name)!(component)) {
        spliceIndex += 1
        continue
      }
      splicePoints.push(spliceIndex)
      spliceIndex += 1
    }
    if (splicePoints.length) {
      this._results = this._results.filter(
        (r, index) => !splicePoints.includes(index)
      )
    }
  }

  private processWith () {
    if (!this._withQueries.size) return
    for (const qry of Array.from(this._withQueries.values())) {
      if (!this.store.components.get(qry)) continue
      this._results.push(...this.store.components.get(qry)!)
    }
  }

  private processWithout () {
    if (!this._withoutQueries.size) return
    if (this._results.length > 0) {
      const splicePoints: number[] = []
      let spliceIndex = 0
      const withoutKeys = Array.from(this._withoutQueries.keys())
      for (const component of this._results) {
        if (component.entity.components.hasSomeComponents(withoutKeys)) {
          splicePoints.push(spliceIndex)
        }
        spliceIndex += 1
      }
      if (splicePoints.length) {
        this._results = this._results.filter(
          (r, index) => !splicePoints.includes(index)
        )
      }
      return
    }
    const includeKeys = Array.from(this.store.components.keys()).filter(
      key => !this._withoutQueries.has(key)
    )
    for (const compKey of includeKeys) {
      this._results.push(...this.store.components.get(compKey)!)
    }
  }

  private processQueries () {
    this.processWith()
    this.processWithout()
    this.processWhere()
  }

  private resultsToEntities () {
    return this._results.map(e => e.entity)
  }

  private clearQuery () {
    this._results = []
    this._whereQueries.clear()
    this._withoutQueries.clear()
    this._withQueries.clear()
  }

  exec () {
    const cacheKey = this.createCacheKey()
    if (this._cache.has(cacheKey)) {
      this.clearQuery()
      return this._cache.get(cacheKey)!
    }
    this.processQueries()
    const entities = this.resultsToEntities()
    this._cache.cache(cacheKey, entities)
    return entities
  }
}

export class BehaviorQueryBuilder<T> implements IQueryBuilder {
  private _withQueries: Set<string> = new Set()
  private _withoutQueries: Set<string> = new Set()
  private _whereQueries: Map<string, (data: EntityBehavior<T>) => boolean> =
    new Map()
  private _results: EntityBehavior<T>[] = []
  constructor (
    private store: EntityBehaviorStore<T>,
    private _cache: QueryCache
  ) {}
  with (...queries: string[]) {
    for (const query of queries) {
      this._withQueries.add(query as string)
    }
    return this
  }
  without (...queries: string[]) {
    for (const query of queries) {
      this._withoutQueries.add(query as string)
    }
    return this
  }
  where<K extends EntityBehavior> (
    behavior: string,
    comparer: (behavior: K) => boolean
  ) {
    this._whereQueries.set(behavior as string, comparer as any)
    return this
  }
  private createCacheKey = () => {
    const withKey =
      '(WITH: [' + Array.from(this._withQueries.values()).join('&') + '])'
    const withoutKey =
      '(WITHOUT: [' + Array.from(this._withQueries.values()).join('&') + '])'
    const whereKey =
      '(WHERE: [' +
      Array.from(this._whereQueries.entries())
        .map(e => `${e[0]} === ${e[1]}`)
        .join('&') +
      '])'
    return 'bqry: ' + withKey + ' ' + withoutKey + ' ' + whereKey
  }
  private processWhere () {
    if (!this._results.length)
      throw new Error(
        'A WHERE query must be accompanied by at least one WITH or WITHOUT queries.'
      )
    if (!this._whereQueries.size) return
    let spliceIndex = 0
    const splicePoints: number[] = []
    for (const behavior of this._results) {
      if (!this._whereQueries.has(behavior.name)) {
        spliceIndex += 1
        continue
      }
      if (this._whereQueries.get(behavior.name)!(behavior)) {
        spliceIndex += 1
        continue
      }
      splicePoints.push(spliceIndex)
      spliceIndex += 1
    }
    if (splicePoints.length) {
      this._results = this._results.filter(
        (r, index) => !splicePoints.includes(index)
      )
    }
  }

  private processWith () {
    if (!this._withQueries.size) return
    for (const qry of Array.from(this._withQueries.values())) {
      this._results.push(...this.store.behaviors.get(qry)!)
    }
  }

  private processWithout () {
    if (!this._withoutQueries.size) return
    if (this._results.length > 0) {
      const splicePoints: number[] = []
      let spliceIndex = 0
      const withoutKeys = Array.from(this._withoutQueries.keys())
      for (const behavior of this._results) {
        if (behavior.entity.behaviors.hasSomeBehaviors(withoutKeys)) {
          splicePoints.push(spliceIndex)
        }
        spliceIndex += 1
      }
      if (splicePoints.length) {
        this._results = this._results.filter(
          (r, index) => !splicePoints.includes(index)
        )
      }
      return
    }
    const includeKeys = Array.from(this.store.behaviors.keys()).filter(
      key => !this._withoutQueries.has(key)
    )
    for (const behavior of includeKeys) {
      this._results.push(...this.store.behaviors.get(behavior)!)
    }
  }

  private processQueries () {
    this.processWith()
    this.processWithout()
    this.processWhere()
  }

  private resultsToEntities () {
    return this._results.map(e => e.entity)
  }

  private clearQuery () {
    this._results = []
    this._whereQueries.clear()
    this._withoutQueries.clear()
    this._withQueries.clear()
  }

  exec () {
    const cacheKey = this.createCacheKey()
    if (this._cache.has(cacheKey)) {
      this.clearQuery()
      return this._cache.get(cacheKey)!
    }
    this.processQueries()
    const entities = this.resultsToEntities()
    this._cache.cache(cacheKey, entities)
    return entities
  }
}

export class QueryManager<T = any> {
  constructor (
    private store: EntityBehaviorStore<T>,
    private cache: QueryCache
  ) {}
  get tcomponents () {
    return new ComponentQueryBuilder<T>(this.store, this.cache) // TODO: This should cast as IQueryBuilder, but generics are off right now
  }
  get components () {
    return new ComponentQueryBuilder<any>(this.store, this.cache) // TODO: This should cast as IQueryBuilder, but generics are off right now
  }
  get behaviors () {
    return new BehaviorQueryBuilder(this.store, this.cache) // TODO: This should cast as IQueryBuilder, but generics are off right now
  }
}
