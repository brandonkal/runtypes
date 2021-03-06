import { Runtype, Static, create, innerValidate } from '../runtype.ts';
import { enumerableKeysOf, FAILURE, hasKey, SUCCESS } from '../util.ts';
import { Optional } from './optional.ts';
import { Details, Result } from '../result.ts';

type FilterOptionalKeys<T> = Exclude<
  {
    [K in keyof T]: T[K] extends Optional<any> ? K : never;
  }[keyof T],
  undefined
>;
type FilterRequiredKeys<T> = Exclude<
  {
    [K in keyof T]: T[K] extends Optional<any> ? never : K;
  }[keyof T],
  undefined
>;

type MergedRecord<O extends { [_: string]: Runtype }> = {
  [K in FilterRequiredKeys<O>]: Static<O[K]>;
} &
  {
    [K in FilterOptionalKeys<O>]?: Static<O[K]>;
  } extends infer P
  ? { [K in keyof P]: P[K] }
  : never;

type MergedRecordReadonly<O extends { [_: string]: Runtype }> = {
  [K in FilterRequiredKeys<O>]: Static<O[K]>;
} &
  {
    [K in FilterOptionalKeys<O>]?: Static<O[K]>;
  } extends infer P
  ? { readonly [K in keyof P]: P[K] }
  : never;

type RecordStaticType<
  O extends { [_: string]: Runtype },
  Part extends boolean,
  RO extends boolean
> = Part extends true
  ? RO extends true
    ? { readonly [K in keyof O]?: Static<O[K]> }
    : { [K in keyof O]?: Static<O[K]> }
  : RO extends true
  ? MergedRecordReadonly<O>
  : MergedRecord<O>;

export interface InternalRecord<
  O extends { [_: string]: Runtype },
  Part extends boolean,
  RO extends boolean
> extends Runtype<RecordStaticType<O, Part, RO>> {
  tag: 'record';
  fields: O;
  isPartial: Part;
  isReadonly: RO;

  asPartial(): InternalRecord<O, true, RO>;
  asReadonly(): InternalRecord<O, Part, true>;
}

export type Record<O extends { [_: string]: Runtype }, RO extends boolean> = InternalRecord<
  O,
  false,
  RO
>;

export type Partial<O extends { [_: string]: Runtype }, RO extends boolean> = InternalRecord<
  O,
  true,
  RO
>;

/**
 * Construct a record runtype from runtypes for its values.
 */
export function InternalRecord<
  O extends { [_: string]: Runtype },
  Part extends boolean,
  RO extends boolean
>(fields: O, isPartial: Part, isReadonly: RO): InternalRecord<O, Part, RO> {
  const self = { tag: 'record', isPartial, isReadonly, fields } as any;
  return withExtraModifierFuncs(
    create((x, visited) => {
      if (x === null || x === undefined) {
        return FAILURE.TYPE_INCORRECT(self, x);
      }

      const keysOfFields = enumerableKeysOf(fields);
      if (keysOfFields.length !== 0 && typeof x !== 'object')
        return FAILURE.TYPE_INCORRECT(self, x);

      const keys = [...new Set([...keysOfFields, ...enumerableKeysOf(x)])];
      const results = keys.reduce<{ [key in string | number | symbol]: Result<unknown> }>(
        (results, key) => {
          const fieldsHasKey = hasKey(key, fields);
          const xHasKey = hasKey(key, x);
          if (fieldsHasKey) {
            const runtype = fields[key as any];
            const isOptional = isPartial || runtype.reflect.tag === 'optional';
            if (xHasKey) {
              const value = x[key as any];
              if (isOptional && value === undefined) {
                results[key as any] = SUCCESS(value);
              } else {
                const validated = innerValidate(runtype, value, visited);
                results[key as any] = validated;
                if (validated.success && validated.value !== x[key as any]) {
                  x[key as any] = validated.value;
                }
              }
            } else {
              if (!isOptional) results[key as any] = FAILURE.PROPERTY_MISSING(runtype.reflect);
              else results[key as any] = SUCCESS(undefined);
            }
          } else if (xHasKey) {
            // TODO: exact record validation
            const value = x[key as any];
            results[key as any] = SUCCESS(value);
          } else {
            /* istanbul ignore next */
            throw new Error('impossible');
          }
          return results;
        },
        {},
      );

      const details = keys.reduce<{ [key in string | number | symbol]: string | Details }>(
        (details, key) => {
          const result = results[key as any];
          if (!result.success) details[key as any] = result.details || result.message;
          return details;
        },
        {},
      );

      if (enumerableKeysOf(details).length !== 0) return FAILURE.CONTENT_INCORRECT(self, details);
      else return SUCCESS(x);
    }, self),
  );
}

export function Record<O extends { [_: string]: Runtype }>(fields: O): Record<O, false> {
  return InternalRecord(fields, false, false);
}

export function Partial<O extends { [_: string]: Runtype }>(fields: O): Partial<O, false> {
  return InternalRecord(fields, true, false);
}

function withExtraModifierFuncs<
  O extends { [_: string]: Runtype },
  Part extends boolean,
  RO extends boolean
>(A: any): InternalRecord<O, Part, RO> {
  A.asPartial = asPartial;
  A.asReadonly = asReadonly;

  return A;

  function asPartial() {
    return InternalRecord(A.fields, true, A.isReadonly);
  }

  function asReadonly() {
    return InternalRecord(A.fields, A.isPartial, true);
  }
}
