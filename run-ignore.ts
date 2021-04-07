//@ts-nocheck
import {
  Boolean,
  Number,
  String,
  Literal,
  Array,
  Tuple,
  Record,
  Union,
  Static,
  Contract,
  Partial,
  Null,
} from './src/index.ts';

const Vector = Tuple(Number, Number, Number);

const Asteroid = Record({
  type: Literal('asteroid'),
  location: Vector,
  mass: Number,
});

const Planet = Record({
  type: Literal('planet'),
  location: Vector,
  mass: Number,
  population: Number,
  habitable: Boolean,
});

const Rank = Union(
  Literal('captain'),
  Literal('first mate'),
  Literal('officer'),
  Literal('ensign'),
);

const CrewMember = Record({
  name: String,
  age: Number,
  rank: Rank,
  home: Planet,
});

const Ship = Record({
  type: Literal('ship'),
  location: Vector,
  mass: Number,
  name: String,
  crew: Array(CrewMember),
});

const SpaceObject = Union(Asteroid, Planet, Ship);

const Dollar = Number.withBrand('dollar');

const d: Static<typeof Dollar> = 12;

SpaceObject.alternatives[0].withBrand;
SpaceObject.check();

type SpaceObj = Static<typeof Asteroid>;
const a = {} as SpaceObj;

function disembark(obj: {}) {
  if (SpaceObject.guard(obj)) {
    // obj: SpaceObject
    if (obj.type === 'ship') {
      // obj: Ship
      obj.crew = [];
    }
  }
}

const isH = SpaceObject.match(_astroid => false, planet => planet.habitable, _ship => true);
isH(a);

const divide = Contract(
  // Parameters:
  Number,
  Number.withConstraint(n => n !== 0 || 'division by zero'),
  // Return type:
  Number,
).enforce((n, m) => n / m);

divide(10, 2); // 5

divide(10, 0); // Throws error: division by zero

// Using `Ship` from above
const RegisteredShip = Ship.And(
  Record({
    // All registered ships must have this flag
    isRegistered: Literal(true),
  }),
).And(
  Partial({
    // We may or may not know the ship's classification
    shipClass: Union(Literal('military'), Literal('civilian')),

    // We may not know the ship's rank (so we allow it to be undefined via `Partial`),
    // we may also know that a civilian ship doesn't have a rank (e.g. null)
    rank: Rank.Or(Null),
  }),
);
type RS = Static<typeof RegisteredShip>;
const rs = {} as RS;
type S = Static<typeof Ship>;
rs.sh;

console.log(RegisteredShip);

const Square = Record({ size: Number });
const Rectangle = Record({ width: Number, height: Number });
const Circle = Record({ radius: Number });

const Shape = Union(Square, Rectangle, Circle);

Shape.check;

const area = Shape.match(
  ({ size }) => Math.pow(size, 2),
  ({ width, height }) => width * height,
  ({ radius }) => Math.PI * Math.pow(radius, 2),
);

area();

const p = Literal('brandon');
const c = p.check({});
const f2 = Literal(42);
const f = f2.check(55);
c;
