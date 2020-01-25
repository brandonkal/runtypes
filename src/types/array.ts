import { Runtype, Static, create } from '../runtype.ts';

type ArrayStaticType<E extends Runtype, RO extends boolean> = RO extends true
  ? ReadonlyArray<Static<E>>
  : Static<E>[];

interface Arr<E extends Runtype, RO extends boolean> extends Runtype<ArrayStaticType<E, RO>> {
  tag: 'array';
  element: E;
  isReadonly: RO;

  asReadonly(): Arr<E, true>;
}

/**
 * Construct an array runtype from a runtype for its elements.
 */
function InternalArr<E extends Runtype, RO extends boolean>(
  element: E,
  isReadonly: RO,
): Arr<E, RO> {
  return withExtraModifierFuncs(
    create(
      xs => {
        if (!Array.isArray(xs)) {
          return {
            success: false,
            message: `Expected array, but was ${xs === null ? xs : typeof xs}`,
          };
        }

        for (const key in xs) {
          const x = xs[key];
          let validated = element.validate(x);
          if (!validated.success) {
            return {
              success: false,
              //@ts-ignore -- deno: Property 'message' does not exist on type 'Success<unknown>'
              message: validated.message,
              //@ts-ignore -- deno
              key: validated.key ? `[${xs.indexOf(x)}].${validated.key}` : `[${xs.indexOf(x)}]`,
            };
          } else if (validated.value !== x) {
            xs[key] = validated.value;
          }
        }

        return { success: true, value: xs };
      },
      { tag: 'array', isReadonly, element },
    ),
  );
}

function Arr<E extends Runtype, RO extends boolean>(element: E): Arr<E, false> {
  return InternalArr(element, false);
}

function withExtraModifierFuncs<E extends Runtype, RO extends boolean>(A: any): Arr<E, RO> {
  A.asReadonly = asReadonly;

  return A;

  function asReadonly(): Arr<E, true> {
    return InternalArr(A.element, true);
  }
}

export { Arr as Array };
