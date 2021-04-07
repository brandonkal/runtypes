import * as rt from 'https://x.kite.run/lib/runtypes.ts';

const Options = rt.Record({
  boolean: rt.Boolean,
  // true: rt.Union(rt.Literal('false'), rt.Null),
  // true: rt.Null,
  zzz: rt.Tuple(rt.String, rt.Number),
  // true: rt.Literal('false'),
});

const data = {
  boolean: false,
  // true: '42',
  zzz: [42, '42'],
};

// const c = Options.validate(data);
let g = Options.guard(data);
// console.log(c);
console.log(g);
console.log(data);
