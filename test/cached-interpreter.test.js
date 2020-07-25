import { strict as assert } from "assert";

import { CachedInterpreter } from "../src/cached-interpreter.js";
import { D2FInterpreterError, D2FSyntaxError } from "../src/errors.js";

describe("CachedInterpreter", () => {
  it("should cache syntactically valid formulae", () => {
    const interpreter = new CachedInterpreter();
    // @ts-expect-error Accessing private property for test
    const astCache = interpreter.astCache_;

    assert.strictEqual(0, Object.keys(astCache).length);

    const formula1 = "2 + 5";
    const formula2 = "((12 + 34) / -5 < 100) ? 67 : 89";

    interpreter.interpret(formula1);
    assert.strictEqual(1, Object.keys(astCache).length);
    assert.ok(Object.prototype.hasOwnProperty.call(astCache, formula1));
    const ast1Before = astCache[formula1];

    interpreter.interpret(formula1);
    assert.strictEqual(1, Object.keys(astCache).length);
    const ast1After = astCache[formula1];

    assert.strictEqual(
      ast1Before,
      ast1After,
      "AST must be the same object, not a new one"
    );

    interpreter.interpret(formula2);
    assert.strictEqual(2, Object.keys(astCache).length);
    assert.ok(Object.prototype.hasOwnProperty.call(astCache, formula2));
    const ast2Before = astCache[formula2];

    interpreter.interpret(formula2);
    assert.strictEqual(2, Object.keys(astCache).length);
    const ast2After = astCache[formula2];

    assert.strictEqual(
      ast2Before,
      ast2After,
      "AST must be the same object, not a new one"
    );
  });

  it("should cache syntactically valid formula that throws interpreter error", () => {
    const interpreter = new CachedInterpreter();
    // @ts-expect-error Accessing private property for test
    const astCache = interpreter.astCache_;

    assert.throws(
      () => interpreter.interpret("min(2, 3)"),
      D2FInterpreterError
    );
    assert.strictEqual(1, Object.keys(astCache).length);
  });

  it("should not cache syntactically invalid formula", () => {
    const interpreter = new CachedInterpreter();
    // @ts-expect-error Accessing private property for test
    const astCache = interpreter.astCache_;

    assert.throws(() => interpreter.interpret("max(2, )"), D2FSyntaxError);
    assert.strictEqual(0, Object.keys(astCache).length);
  });

  it("should not treat Object.prototype builtins as formulae", () => {
    const interpreter = new CachedInterpreter();
    // @ts-expect-error Accessing private property for test
    const astCache = interpreter.astCache_;

    // This should be treated as an unknown identifier
    assert.throws(
      () => interpreter.interpret("hasOwnProperty"),
      D2FInterpreterError
    );
    assert.throws(() => interpreter.interpret("toString"), D2FInterpreterError);
    assert.throws(() => interpreter.interpret("valueOf"), D2FInterpreterError);
    assert.strictEqual(3, Object.keys(astCache).length);
  });
});
