import { Runtype, Static, create } from '../runtype.ts';

export const RuntypeName = Symbol('RuntypeName');

export interface Brand<B extends string, A extends Runtype>
  extends Runtype<
    Static<A> & {
      [RuntypeName]: B;
    }
  > {
  tag: 'brand';
  brand: B;
  entity: A;
}

// error TS2345: Argument of type '(value: any) => Result<unknown>' is not assignable to parameter of type '(x: any) => Result<A["_falseWitness"] & { [RuntypeName]: B; }>'.
//   Type 'Result<unknown>' is not assignable to type 'Result<A["_falseWitness"] & { [RuntypeName]: B; }>'.
//     Type 'Success<unknown>' is not assignable to type 'Result<A["_falseWitness"] & { [RuntypeName]: B; }>'.
//       Type 'Success<unknown>' is not assignable to type 'Success<A["_falseWitness"] & { [RuntypeName]: B; }>'.
//         Type 'unknown' is not assignable to type 'A["_falseWitness"] & { [RuntypeName]: B; }'.
//           Property '[RuntypeName]' is missing in type '{}' but required in type '{ [RuntypeName]: B; }'.

export function Brand<B extends string, A extends Runtype>(brand: B, entity: A) {
  return create<Brand<B, A>>(
    //@ts-ignore -- deno: see ref 1
    value => {
      const validated = entity.validate(value);
      return validated.success
        ? { success: true, value: validated.value as Static<Brand<B, A>> }
        : validated;
    },
    {
      tag: 'brand',
      brand,
      entity,
    },
  );
}
