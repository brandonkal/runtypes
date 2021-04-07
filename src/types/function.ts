import { Reflect } from '../reflect.ts';
import { Runtype, create } from '../runtype.ts';
import { FAILURE, SUCCESS } from '../util.ts';

export interface Function extends Runtype<(...args: any[]) => any> {
  tag: 'function';
}

const self = ({ tag: 'function' } as unknown) as Reflect;

/**
 * Construct a runtype for functions.
 */
export const Function = create<Function>(
  value => (typeof value === 'function' ? SUCCESS(value) : FAILURE.TYPE_INCORRECT(self, value)),
  self,
);
