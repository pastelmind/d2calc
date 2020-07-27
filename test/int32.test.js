import { strict as assert } from "assert";

import { isInt32, parseInt32, toInt32 } from "../src/int32.js";

describe("isInt32()", () => {
  it("should accept any valid 32-bit integer", () => {
    assert.strictEqual(isInt32(0), true);
    assert.strictEqual(isInt32(123), true);
    assert.strictEqual(isInt32(-45678), true);
  });

  it("should reject non-number types without throwing", () => {
    assert.strictEqual(isInt32(undefined), false);
    assert.strictEqual(isInt32(null), false);
    assert.strictEqual(isInt32(true), false);
    assert.strictEqual(isInt32("0"), false);
    assert.strictEqual(isInt32({}), false);
    assert.strictEqual(isInt32([20]), false);
    assert.strictEqual(
      isInt32(() => 100),
      false
    );
    assert.strictEqual(isInt32(Symbol("foo bar")), false);
  });
});

describe("parseInt32()", () => {
  it("should accept strings of digits of any length", () => {
    assert.strictEqual(parseInt32("0"), 0);
    assert.strictEqual(parseInt32("123"), 123);
    // INT32_MAX
    assert.strictEqual(parseInt32("2147483647"), 2147483647);
    // INT32_MAX + 1
    assert.strictEqual(parseInt32("2147483648"), -2147483648);

    assert.strictEqual(parseInt32("12345678901234567890"), -350287150);
    assert.strictEqual(
      parseInt32("9876543210987654321098765432109876543210"),
      1371963114
    );
  });
});

describe("toInt32()", () => {
  const INT32_MAX = Math.pow(2, 31) - 1;
  const INT32_MIN = -Math.pow(2, 31);
  const UINT32_MAX = Math.pow(2, 32) - 1;

  it("should return any 32-bit signed integer as-is", () => {
    assert.strictEqual(toInt32(0), 0);
    assert.strictEqual(toInt32(1234), 1234);
    assert.strictEqual(toInt32(-56789), -56789);

    assert.strictEqual(toInt32(INT32_MAX), INT32_MAX);
    assert.strictEqual(toInt32(INT32_MIN), INT32_MIN);
  });

  it("should discard extraneous high-order bits", () => {
    assert.strictEqual(toInt32(INT32_MAX + 1), INT32_MIN);
    assert.strictEqual(toInt32(INT32_MIN - 1), INT32_MAX);
    assert.strictEqual(toInt32(UINT32_MAX), -1);
    assert.strictEqual(toInt32(UINT32_MAX + 1), 0);
    assert.strictEqual(toInt32(100000000000), 1215752192);
  });

  it("should round fractions toward zero", () => {
    assert.strictEqual(toInt32(1.1), 1);
    assert.strictEqual(toInt32(2.5), 2);
    assert.strictEqual(toInt32(3.9), 3);
    assert.strictEqual(toInt32(-1.1), -1);
    assert.strictEqual(toInt32(-2.5), -2);
    assert.strictEqual(toInt32(-3.9), -3);
  });

  it("should convert special numbers to 0", () => {
    assert.strictEqual(toInt32(NaN), 0);
    assert.strictEqual(toInt32(Infinity), 0);
    assert.strictEqual(toInt32(-Infinity), 0);
  });

  it("should accept any type that can be converted to number", () => {
    assert.strictEqual(toInt32(null), 0);
    assert.strictEqual(toInt32(true), 1);
    assert.strictEqual(toInt32(false), 0);
    assert.strictEqual(toInt32("-123"), -123);
    assert.strictEqual(toInt32([456]), 456);
    assert.strictEqual(toInt32([]), 0);
  });

  it("should handle any type that is converted by Number() to a NaN or throws", () => {
    assert.strictEqual(toInt32(undefined), 0);
    assert.strictEqual(toInt32("asdf"), 0);
    assert.strictEqual(toInt32([1, 2, 3]), 0);
    assert.strictEqual(toInt32({ foo: 1 }), 0);
  });

  it("should throw if the value cannot be converted with Number()", () => {
    assert.throws(() => toInt32(Symbol("bar")), TypeError);
  });
});
