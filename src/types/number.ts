import { Runtype, create, convertLoose } from '../runtype.ts';

export interface Number extends Runtype<number> {
  tag: 'number';
}

/**
 * Validates that a value is a number.
 */
export const Number = create<Number>(
  value => {
    let n = convertLoose(42, value);
    if (n.converted) {
      return { success: true, value: n.value as number };
    }
    return typeof value === 'number'
      ? { success: true, value }
      : {
          success: false,
          message: `Expected number, but was ${value === null ? value : typeof value}`,
        };
  },
  { tag: 'number' },
);
