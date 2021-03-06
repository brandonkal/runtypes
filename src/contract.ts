import { Runtype } from './index.ts';
import { ValidationError } from './errors.ts';
import { Static } from './runtype.ts';
import { FAILURE } from './util.ts';

export interface Contract<A extends readonly Runtype[], R extends Runtype> {
  enforce(
    f: (
      ...args: {
        [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
      }
    ) => Static<R>,
  ): (
    ...args: {
      [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
    }
  ) => Static<R>;
}

/**
 * Create a function contract.
 */
export function Contract<A extends readonly Runtype[], R extends Runtype>(
  ...runtypes: [...A, R]
): Contract<A, R>;

export function Contract<A extends readonly Runtype[], R extends Runtype>(
  ...runtypes: [...A, R]
): Contract<A, R> {
  const lastIndex = runtypes.length - 1;
  const argRuntypes = (runtypes.slice(0, lastIndex) as unknown) as A;
  const returnRuntype = runtypes[lastIndex] as R;
  return {
    enforce: (
      f: (
        ...args: {
          [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
        }
      ) => Static<R>,
    ) => (
      ...args: {
        [key in keyof A]: A[key] extends Runtype ? Static<A[key]> : unknown;
      }
    ): Static<R> => {
      if (args.length < argRuntypes.length) {
        const message = `Expected ${argRuntypes.length} arguments but only received ${args.length}`;
        const failure = FAILURE.ARGUMENT_INCORRECT(message);
        throw new ValidationError(failure);
      }
      for (let i = 0; i < argRuntypes.length; i++) argRuntypes[i].check(args[i]);
      return returnRuntype.check(f(...args));
    },
  };
}
