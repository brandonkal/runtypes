import { Reflect } from '../reflect.ts';
import { Runtype, create } from '../runtype.ts';
import { FAILURE } from '../util.ts';

export interface Never extends Runtype<never> {
  tag: 'never';
}

const self = ({ tag: 'never' } as unknown) as Reflect;

/**
 * Validates nothing (unknown fails).
 */
export const Never = create<Never>(FAILURE.NOTHING_EXPECTED, self);
