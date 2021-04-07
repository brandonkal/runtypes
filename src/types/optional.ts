import { Reflect } from '../reflect.ts';
import { Runtype, create, Static } from '../runtype.ts';
import { SUCCESS } from '../util.ts';

export interface Optional<R extends Runtype> extends Runtype<Static<R> | undefined> {
  tag: 'optional';
  underlying: R;
}

/**
 * Validates optional value.
 */
export function Optional<R extends Runtype>(runtype: R) {
  const self = ({ tag: 'optional', underlying: runtype } as unknown) as Reflect;
  return create<Optional<R>>(
    value => (value === undefined ? SUCCESS(value) : runtype.validate(value)),
    self,
  );
}
