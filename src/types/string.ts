import { Reflect } from '../reflect.ts';
import { Runtype, create } from '../runtype.ts';
import { FAILURE, SUCCESS } from '../util.ts';

export interface String extends Runtype<string> {
  tag: 'string';
}

const self = ({ tag: 'string' } as unknown) as Reflect;

/**
 * Validates that a value is a string.
 */
export const String = create<String>(value => {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return SUCCESS(value.toString());
  }
  return typeof value === 'string' ? SUCCESS(value) : FAILURE.TYPE_INCORRECT(self, value);
}, self);
