import { strict as assert } from "assert";

import sinon from "sinon";

import { D2FInterpreterError } from "../src/errors.js";
import interpret from "../src/interpreter.js";

/**
 * @typedef {import("../src/interpreter.js").InterpreterEnvironment} InterpreterEnvironment
 * @typedef {import("../src/interpreter.js").NumericFunction} NumericFunction
 * @typedef {import("../src/interpreter.js").ReferenceFunction} ReferenceFunction
 * @typedef {import("../src/interpreter.js").ReferenceFunction2Q} ReferenceFunction2Q
 */

/**
 * Verifies that interpreting the given code results in the given value.
 * Helper method for running Mocha tests.
 *
 * @param {string} code
 * @param {InterpreterEnvironment} environment
 * @param {number} value
 */
function itInterpretsTo(code, environment, value) {
  it(`Test "${code}"`, () => {
    assert.deepStrictEqual(interpret(code, environment), value);
  });
}

describe("interpret()", () => {
  describe("should interpret numbers correctly", () => {
    itInterpretsTo("0", {}, 0);
    itInterpretsTo("125", {}, 125);
  });

  it("should interpret identifiers correctly", () => {
    const funcvar = sinon.fake.returns(138);

    /** @type {InterpreterEnvironment} */
    const environment = {
      identifiers: {
        numvar: 47,
        funcvar,
      },
    };

    assert.deepStrictEqual(interpret("numvar", environment), 47);
    sinon.assert.notCalled(funcvar);

    assert.deepStrictEqual(interpret("funcvar", environment), 138);
    sinon.assert.calledOnceWithExactly(funcvar);
  });

  describe("should interpret arithmetic operators correctly", () => {
    itInterpretsTo("2 + 3", {}, 5);
    itInterpretsTo("100 - 5", {}, 95);
    itInterpretsTo("18 * 3", {}, 54);
    itInterpretsTo("63 / 9", {}, 7);
    itInterpretsTo("-30", {}, -30);
  });

  describe("should interpret comparison operators correctly", () => {
    itInterpretsTo("100 == 100", {}, 1);
    itInterpretsTo("2 == 3", {}, 0);

    itInterpretsTo("4 != 100", {}, 1);
    itInterpretsTo("4 != 4", {}, 0);

    itInterpretsTo("6 < 9", {}, 1);
    itInterpretsTo("7 < 7", {}, 0);
    itInterpretsTo("8 < 6", {}, 0);

    itInterpretsTo("1 > 0", {}, 1);
    itInterpretsTo("2 > 2", {}, 0);
    itInterpretsTo("3 > 5", {}, 0);

    itInterpretsTo("15 <= 17", {}, 1);
    itInterpretsTo("13 <= 13", {}, 1);
    itInterpretsTo("11 <= 10", {}, 0);

    itInterpretsTo("30 >= 29", {}, 1);
    itInterpretsTo("31 >= 31", {}, 1);
    itInterpretsTo("32 >= 33", {}, 0);
  });

  describe("should use 0 as the result of division by 0", () => {
    itInterpretsTo("5 / 0", {}, 0);
    itInterpretsTo("100 + 10 / 0 + 2", {}, 102);
  });

  describe("should interpret parenthesized expressions correctly", () => {
    itInterpretsTo("(2 + 3) * 5", {}, 25);
    itInterpretsTo("(200 - 80) / 5 == (12 * (9 - 7))", {}, 1);
  });

  describe("should truncate division result", () => {
    itInterpretsTo("45 / 2", {}, 22);
    itInterpretsTo("(-45) / 2", {}, -22);
    itInterpretsTo("45 / (-2)", {}, -22);
    itInterpretsTo("(-45) / (-2)", {}, 22);
  });

  describe("should interpret conditional expressions correctly", () => {
    itInterpretsTo("1 ? 3 : 6", {}, 3);
    itInterpretsTo("0 ? 999 : 123", {}, 123);
  });

  it("should interpret function calls correctly", () => {
    const min = sinon.fake(
      /** @type {NumericFunction} */
      (a, b) => (a >= 0 && b >= 0 ? Math.min(a, b) : 0)
    );
    const max = sinon.fake(
      /** @type {NumericFunction} */
      (a, b) => (a >= 0 && b >= 0 ? Math.max(a, b) : 0)
    );
    /** @type {InterpreterEnvironment} */
    const environment = {
      functions: {
        min,
        max,
      },
    };

    assert.deepStrictEqual(interpret("max(5, 10)", environment), 10);
    sinon.assert.calledWithExactly(max.getCall(0), 5, 10);
    assert.deepStrictEqual(interpret("max(100, 3)", environment), 100);
    sinon.assert.calledWithExactly(max.getCall(1), 100, 3);
    assert.deepStrictEqual(interpret("max(-1, 10)", environment), 0);
    sinon.assert.calledWithExactly(max.getCall(2), -1, 10);
    assert.deepStrictEqual(interpret("max(5, -10)", environment), 0);
    sinon.assert.calledWithExactly(max.getCall(3), 5, -10);

    sinon.assert.notCalled(min);
    sinon.assert.callCount(max, 4);

    min.resetHistory();
    max.resetHistory();

    assert.deepStrictEqual(interpret("min(5, 10)", environment), 5);
    assert.deepStrictEqual(interpret("min(100, 3)", environment), 3);
    assert.deepStrictEqual(interpret("min(-1, 10)", environment), 0);
    assert.deepStrictEqual(interpret("min(5, -10)", environment), 0);

    sinon.assert.notCalled(max);
    sinon.assert.callCount(min, 4);
    sinon.assert.calledWithExactly(min.getCall(0), 5, 10);
    sinon.assert.calledWithExactly(min.getCall(1), 100, 3);
    sinon.assert.calledWithExactly(min.getCall(2), -1, 10);
    sinon.assert.calledWithExactly(min.getCall(3), 5, -10);
  });

  it("should interpret reference function calls correctly", () => {
    const ref1 = sinon.fake.returns(125);
    const ref2 = sinon.fake.returns(500);
    const ref1_2q = sinon.fake.returns(-10);
    const ref2_2q = sinon.fake.returns(-100);

    /** @type {InterpreterEnvironment} */
    const environment = {
      referenceFunctions: {
        ref1,
        ref2,
      },
      referenceFunctions2Q: {
        ref1: ref1_2q,
        ref2: ref2_2q,
      },
    };

    assert.deepStrictEqual(interpret("ref1('foo'.bar)", environment), 125);
    assert.deepStrictEqual(
      interpret("ref2((100 + 150).key)", environment),
      500
    );
    assert.deepStrictEqual(interpret("ref1('foo'.bar.baz)", environment), -10);
    assert.deepStrictEqual(interpret("ref2(4.don.key)", environment), -100);

    sinon.assert.calledOnceWithExactly(ref1, "foo", "bar");
    sinon.assert.calledOnceWithExactly(ref2, 250, "key");
    sinon.assert.calledOnceWithExactly(ref1_2q, "foo", "bar", "baz");
    sinon.assert.calledOnceWithExactly(ref2_2q, 4, "don", "key");
  });

  describe("should handle integer overflow correctly", () => {
    // Addition
    itInterpretsTo("2147483647 + 1", {}, -2147483648);
    itInterpretsTo("2147483647 + 2147483646", {}, -3);
    itInterpretsTo("-2147483645 + -2147483644", {}, 7);
    itInterpretsTo("-2147483643 + -6", {}, 2147483647);

    // Subtraction
    itInterpretsTo("2147483641 - -8", {}, -2147483647);
    itInterpretsTo("2147483639 - -2147483638", {}, -19);
    itInterpretsTo("-2147483637 - 2147483636", {}, 23);
    itInterpretsTo("-2147483635 - 14", {}, 2147483647);

    // Multiplication
    itInterpretsTo("2147483647 * 2", {}, -2);
    itInterpretsTo("2147483643 * -4", {}, 20);
    itInterpretsTo("-6 * 2147483641", {}, 42);
    itInterpretsTo("-5 * -2147483642", {}, 2147483618);
    itInterpretsTo("2147483641 * 2147483641", {}, 49);

    // Changing the sign of INT32_MIN
    itInterpretsTo("-2147483648", {}, -2147483648);
    itInterpretsTo("2147483648 * -1", {}, -2147483648);
    itInterpretsTo("-1 * 2147483648", {}, -2147483648);
  });

  it("should not treat Object.prototype builtins as identifiers", () => {
    assert.throws(
      () => interpret("hasOwnProperty"),
      new D2FInterpreterError(`Unknown identifier: hasOwnProperty`)
    );
    assert.throws(
      () => interpret("toString"),
      new D2FInterpreterError(`Unknown identifier: toString`)
    );
    assert.throws(
      () => interpret("valueOf"),
      new D2FInterpreterError(`Unknown identifier: valueOf`)
    );
  });

  it("should not treat Object.prototype builtins as numeric functions", () => {
    assert.throws(
      () => interpret("hasOwnProperty(1, 2)"),
      new D2FInterpreterError(`Unknown function: hasOwnProperty`)
    );
    assert.throws(
      () => interpret("toString(1, 2)"),
      new D2FInterpreterError(`Unknown function: toString`)
    );
    assert.throws(
      () => interpret("valueOf(1, 2)"),
      new D2FInterpreterError(`Unknown function: valueOf`)
    );
  });

  it("should not treat Object.prototype builtins as reference functions", () => {
    assert.throws(
      () => interpret("hasOwnProperty('foo'.qualifier)"),
      new D2FInterpreterError(
        `Unknown single-qualifier reference function: hasOwnProperty`
      )
    );
    assert.throws(
      () => interpret("toString('foo'.qualifier)"),
      new D2FInterpreterError(
        `Unknown single-qualifier reference function: toString`
      )
    );
    assert.throws(
      () => interpret("valueOf('foo'.qualifier)"),
      new D2FInterpreterError(
        `Unknown single-qualifier reference function: valueOf`
      )
    );

    assert.throws(
      () => interpret("hasOwnProperty('foo'.qual1.qual2)"),
      new D2FInterpreterError(
        `Unknown double-qualifier reference function: hasOwnProperty`
      )
    );
    assert.throws(
      () => interpret("toString('foo'.qual1.qual2)"),
      new D2FInterpreterError(
        `Unknown double-qualifier reference function: toString`
      )
    );
    assert.throws(
      () => interpret("valueOf('foo'.qual1.qual2)"),
      new D2FInterpreterError(
        `Unknown double-qualifier reference function: valueOf`
      )
    );
  });
});

afterEach(() => {
  // Restore the default sandbox
  sinon.restore();
});
