import { Runtype, create } from '../runtype.ts';

export interface String extends Runtype<string> {
  tag: 'string';
}

/**
 * Validates that a value is a string.
 */
export const String = create<String>(
  value => {
    if (typeof value === 'number' || typeof value === 'boolean') {
      return { success: true, value: value.toString() };
    }
    return typeof value === 'string'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected string, but was ${value === null ? value : typeof value}`,
        };
  },
  { tag: 'string' },
);
