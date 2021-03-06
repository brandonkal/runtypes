import { Result, Union, Intersect, Optional, Constraint, ConstraintCheck, Brand } from './index.ts';
import { Reflect } from './reflect.ts';
import show from './show.ts';
import { ValidationError } from './errors.ts';
import { SUCCESS } from './util.ts';

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface RuntypeBase<A = unknown> {
  /**
   * Verifies that a value conforms to this runtype. When given a value that does
   * not conform to the runtype, throws an exception.
   */
  assert(x: any): asserts x is A;

  /**
   * Verifies that a value conforms to this runtype. If so, returns the same value,
   * statically typed. Otherwise throws an exception.
   */
  check(x: any): A;

  /**
   * Validates that a value conforms to this type, and returns a result indicating
   * success or failure (does not throw).
   */
  validate(x: any): Result<A>;

  /**
   * A type guard for this runtype.
   */
  guard(x: any): x is A;

  /**
   * Convert this to a Reflect, capable of introspecting the structure of the type.
   */
  readonly reflect: Reflect;

  /* @internal */ readonly _falseWitness: A;
}

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface Runtype<A = unknown> extends RuntypeBase<A> {
  /**
   * Union this Runtype with another.
   */
  Or<B extends Runtype>(B: B): Union<[this, B]>;

  /**
   * Intersect this Runtype with another.
   */
  And<B extends Runtype>(B: B): Intersect<[this, B]>;

  /**
   * Optionalize this Runtype.
   */
  optional(): Optional<this>;

  /**
   * Use an arbitrary constraint function to validate a runtype, and optionally
   * to change its name and/or its static type.
   *
   * @template T - Optionally override the static type of the resulting runtype
   * @param {(x: Static<this>) => boolean | string} constraint - Custom function
   * that returns `true` if the constraint is satisfied, `false` or a custom
   * error message if not.
   * @param [options]
   * @param {string} [options.name] - allows setting the name of this
   * constrained runtype, which is helpful in reflection or diagnostic
   * use-cases.
   */
  withConstraint<T extends Static<this>, K = unknown>(
    constraint: ConstraintCheck<this>,
    options?: { name?: string; args?: K },
  ): Constraint<this, T, K>;

  /**
   * Helper function to convert an underlying Runtype into another static type
   * via a type guard function.  The static type of the runtype is inferred from
   * the type of the guard function.
   *
   * @template T - Typically inferred from the return type of the type guard
   * function, so usually not needed to specify manually.
   * @param {(x: Static<this>) => x is T} guard - Type guard function (see
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
   *
   * @param [options]
   * @param {string} [options.name] - allows setting the name of this
   * constrained runtype, which is helpful in reflection or diagnostic
   * use-cases.
   */
  withGuard<T extends Static<this>, K = unknown>(
    guard: (x: Static<this>) => x is T,
    options?: { name?: string; args?: K },
  ): Constraint<this, T, K>;

  /**
   * Adds a brand to the type.
   */
  withBrand<B extends string>(brand: B): Brand<B, this>;
}

/**
 * Obtains the static type associated with a Runtype.
 */
export type Static<A extends RuntypeBase> = A['_falseWitness'];

export function create<A extends Runtype>(
  validate: (x: any, visited: VisitedState) => Result<Static<A>>,
  A: any,
): A {
  A.check = check;
  A.assert = check;
  A._innerValidate = (value: any, visited: VisitedState) => {
    if (visited.has(value, A)) return SUCCESS(value);
    return validate(value, visited);
  };
  A.validate = (value: any) => A._innerValidate(value, VisitedState());
  A.guard = guard;
  A.Or = Or;
  A.And = And;
  A.optional = optional;
  A.withConstraint = withConstraint;
  A.withGuard = withGuard;
  A.withBrand = withBrand;
  A.reflect = A;
  A.toString = () => `Runtype<${show(A)}>`;

  return A;

  function check(x: any) {
    const result: Result<unknown> = A.validate(x);
    if (result.success) return result.value;
    else throw new ValidationError(result);
  }

  function guard(x: any): x is A {
    return A.validate(x).success;
  }

  function Or<B extends Runtype>(B: B): Union<[A, B]> {
    return Union(A, B);
  }

  function And<B extends Runtype>(B: B): Intersect<[A, B]> {
    return Intersect(A, B);
  }

  function optional(): Optional<A> {
    return Optional(A);
  }

  function withConstraint<T extends Static<A>, K = unknown>(
    constraint: ConstraintCheck<A>,
    options?: { name?: string; args?: K },
  ): Constraint<A, T, K> {
    return Constraint<A, T, K>(A, constraint, options);
  }

  function withGuard<T extends Static<A>, K = unknown>(
    guard: (x: Static<A>) => x is T,
    options?: { name?: string; args?: K },
  ): Constraint<A, T, K> {
    return Constraint<A, T, K>(A, guard, options);
  }

  function withBrand<B extends string>(B: B): Brand<B, A> {
    return Brand(B, A);
  }
}

export function innerValidate<A extends RuntypeBase>(
  targetType: A,
  value: any,
  visited: VisitedState,
): Result<Static<A>> {
  return (targetType as any)._innerValidate(value, visited);
}

type VisitedState = {
  has: (candidate: object, type: Runtype) => boolean;
};
function VisitedState(): VisitedState {
  const members: WeakMap<object, WeakMap<Runtype, true>> = new WeakMap();

  const add = (candidate: object, type: Runtype) => {
    if (candidate === null || !(typeof candidate === 'object')) return;
    const typeSet = members.get(candidate);
    members.set(
      candidate,
      typeSet ? typeSet.set(type, true) : (new WeakMap() as WeakMap<Runtype, true>).set(type, true),
    );
  };

  const has = (candidate: object, type: Runtype) => {
    const typeSet = members.get(candidate);
    const value = (typeSet && typeSet.get(type)) || false;
    add(candidate, type);
    return value;
  };

  return { has };
}

/**
 * convertLoose converts values loosely based on schema.
 * i.e. "false" becomes false.
 */
 export function convertLoose(desired: unknown, before: unknown) {
  const desT = typeof desired;
  const befT = typeof before;
  if (desT === 'boolean' && befT === 'string') {
    let out = before === 'true' ? true : before === 'false' ? false : undefined;
    if (typeof out !== 'undefined') {
      return { converted: true, value: out };
    }
  }
  if (desT === 'string') {
    if (befT === 'number' || befT === 'boolean' || before === null) {
      return { converted: true, value: String(before) };
    }
  }
  if (desT === 'number' && befT === 'string') {
    let num = Number(before);
    if (Number.isNaN(num)) {
      return { converted: false, value: before };
    }
    return { converted: true, value: num };
  }
  if (desired === null && before === 'null') {
    return { converted: true, value: null };
  }
  if (desired === 'null' && before === null) {
    return { converted: true, value: 'null' };
  }
  return { converted: false, value: before };
}
