import * as rt from './src/index.ts';
import { it, expect } from 'https://x.kite.run/lib/testutils.ts';

it('is a boolean', () => {
  const isBool = rt.Boolean.check(true);
  expect(isBool).toBe(true);
});

it('fails on normal text', () => {
  expect(() => rt.Boolean.check('hello')).toThrowError('Expected boolean, but was string');
});

it('converts almost boolean', () => {
  const isBool = rt.Boolean.check('true');
  expect(isBool).toBe(true);
});

it('handles normal arrays', () => {
  const arr = rt.Array(rt.Number).check([1, 2, 3]);
  expect(JSON.stringify(arr)).toBe('[1,2,3]');
});

it('fails on invalid arrays', () => {
  expect(() => rt.Array(rt.Number).check([1, 2, 'three'])).toThrow('Expected number[]');
});

it('fails on invalid arrays', () => {
  let out: number[] = rt.Array(rt.Number).check([1, 2, '3']);
  expect(JSON.stringify(out)).toBe('[1,2,3]');
});

it('checks record', () => {
  let person = rt.Record({
    first: rt.String,
    last: rt.String,
    age: rt.Number,
  });
  const out = person.check({
    first: 'Joe',
    last: 'Centenial',
    age: 100,
  });
  expect(JSON.stringify(out)).toBe(`{"first":"Joe","last":"Centenial","age":100}`);
});

it('converts record', () => {
  let person = rt.Record({
    first: rt.String,
    last: rt.String,
    age: rt.Number,
  });
  const out = person.check({
    first: 'Joe',
    last: 'Centenial',
    age: '100',
  });
  expect(JSON.stringify(out)).toBe(`{"first":"Joe","last":"Centenial","age":100}`);
});
