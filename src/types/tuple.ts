import { Reflect } from '../reflect.ts';
import { Details, Result } from '../result.ts';
import { Runtype, Static, create, innerValidate } from '../runtype.ts';
import { enumerableKeysOf, FAILURE, SUCCESS } from '../util.ts';

export interface Tuple<A extends readonly Runtype[]>
  extends Runtype<
    {
      [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
    }
  > {
  tag: 'tuple';
  components: A;
}

/**
 * Construct a tuple runtype from runtypes for each of its elements.
 */
export function Tuple<T extends readonly Runtype[]>(...components: T): Tuple<T> {
  const self = ({ tag: 'tuple', components } as unknown) as Reflect;
  return create<any>((xs, visited) => {
    if (!Array.isArray(xs)) return FAILURE.TYPE_INCORRECT(self, xs);

    if (xs.length !== components.length)
      return FAILURE.CONSTRAINT_FAILED(
        self,
        `Expected length ${components.length}, but was ${xs.length}`,
      );

    const keys = enumerableKeysOf(xs);
    const results: Result<unknown>[] = keys.map(key => {
      const res = innerValidate(components[key as any], xs[key as any], visited);
      if (res.success && res.value !== xs[key as any]) {
        xs[key as any] = res.value;
      }
      return res;
    });
    const details = keys.reduce<{ [key: number]: string | Details } & (string | Details)[]>(
      (details, key) => {
        const result = results[key as any];
        if (!result.success) details[key as any] = result.details || result.message;
        return details;
      },
      [],
    );

    if (enumerableKeysOf(details).length !== 0) return FAILURE.CONTENT_INCORRECT(self, details);
    else return SUCCESS(xs);
  }, self);
}
