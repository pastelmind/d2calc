"use strict";

// Explicit type annotation is needed to suppress TypeScript error.
// See https://stackoverflow.com/a/59229771/ for more information.
/** @type {import("assert").strict} */
const assert = require("assert").strict;

const interpret = require("../src/interpreter.js");

/**
 * @typedef {import('../src/interpreter.js').InterpreterEnvironment} InterpreterEnvironment
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

  describe("should interpret identifiers correctly", () => {
    /** @type {InterpreterEnvironment} */
    const environment = {
      identifiers: {
        numvar: 47,
        funcvar: () => 138,
      },
    };

    describe("if identifiers are given as numbers", () => {
      itInterpretsTo("numvar", environment, 47);
    });

    describe("if identifiers are given as functions", () => {
      itInterpretsTo("funcvar", environment, 138);
    });
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

  describe("should interpret function calls correctly", () => {
    /** @type {InterpreterEnvironment} */
    const environment = {
      functions: {
        min(a, b) {
          return a >= 0 && b >= 0 ? Math.min(a, b) : 0;
        },
        max(a, b) {
          return a >= 0 && b >= 0 ? Math.max(a, b) : 0;
        },
      },
    };

    itInterpretsTo("max(5, 10)", environment, 10);
    itInterpretsTo("max(100, 3)", environment, 100);
    itInterpretsTo("max(-1, 10)", environment, 0);
    itInterpretsTo("max(5, -10)", environment, 0);

    itInterpretsTo("min(5, 10)", environment, 5);
    itInterpretsTo("min(100, 3)", environment, 3);
    itInterpretsTo("min(-1, 10)", environment, 0);
    itInterpretsTo("min(5, -10)", environment, 0);
  });

  describe("should interpret reference function calls correctly", () => {
    /** @type {InterpreterEnvironment} */
    const environment = {
      referenceFunctions: {
        ref1(reference, code) {
          assert.deepStrictEqual(reference, "foo");
          assert.deepStrictEqual(code, "bar");
          return 125;
        },
        ref2(reference, code) {
          assert.deepStrictEqual(reference, 250);
          assert.deepStrictEqual(code, "key");
          return 500;
        },
      },
      referenceFunctions2Q: {
        ref1(reference, code1, code2) {
          assert.deepStrictEqual(reference, "foo");
          assert.deepStrictEqual(code1, "bar");
          assert.deepStrictEqual(code2, "baz");
          return -10;
        },
        ref2(reference, code1, code2) {
          assert.deepStrictEqual(reference, 4);
          assert.deepStrictEqual(code1, "don");
          assert.deepStrictEqual(code2, "key");
          return -100;
        },
      },
    };

    itInterpretsTo("ref1('foo'.bar)", environment, 125);
    itInterpretsTo("ref2((100 + 150).key)", environment, 500);

    itInterpretsTo("ref1('foo'.bar.baz)", environment, -10);
    itInterpretsTo("ref2(4.don.key)", environment, -100);
  });
});
