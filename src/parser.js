"use strict";

/** Base class for AST expression nodes */
class AstExpression {}

class AstNumber extends AstExpression {
  /**
   * @param {number} value Must be a nonnegative number
   */
  constructor(value) {
    super();
    this.value = value;
  }
}

class AstBinaryOp extends AstExpression {
  /**
   * @param {string} operator Binary operator
   * @param {AstExpression} left Left side expression
   * @param {AstExpression} right Right side expression
   */
  constructor(operator, left, right) {
    super();
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

class AstUnaryOp extends AstExpression {
  /**
   * @param {string} operator Unary operator
   * @param {AstExpression} expression Expression to apply the operator
   */
  constructor(operator, expression) {
    super();
    this.operator = operator;
    this.expression = expression;
  }
}

class AstConditional extends AstExpression {
  /**
   * @param {AstExpression} condition
   * @param {AstExpression} trueExpression Expression to evaluate if condition is true (non-zero)
   * @param {AstExpression} falseExpression Expression to evaluate if condition is false (zero)
   */
  constructor(condition, trueExpression, falseExpression) {
    super();
    this.condition = condition;
    this.trueExpression = trueExpression;
    this.falseExpression = falseExpression;
  }
}

class AstIdentifier extends AstExpression {
  /**
   * @param {string} name
   */
  constructor(name) {
    super();
    this.name = name;
  }
}

class AstFunctionCall extends AstExpression {
  /**
   * @param {string} functionName
   * @param {AstExpression} arg1
   * @param {AstExpression} arg2
   */
  constructor(functionName, arg1, arg2) {
    super();
    this.functionName = functionName;
    this.arg1 = arg1;
    this.arg2 = arg2;
  }
}

class AstReferenceFunctionCall extends AstExpression {
  /**
   * @param {string} functionName
   * @param {string | number} reference
   * @param {string} identifier1
   * @param {string | null} identifier2
   */
  constructor(functionName, reference, identifier1, identifier2) {
    super();
    this.functionName = functionName;
    this.reference = reference;
    this.identifier1 = identifier1;
    this.identifier2 = identifier2;
  }
}
