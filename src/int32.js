/**
 * @template T, B
 * @typedef {import("./types.js").Nominal<T, B>} Nominal
 */

/**
 * Nominal type for 32-bit signed integer
 * @typedef {Nominal<number, "Int32">} Int32
 */

/**
 * Converts a string containing digits to a 32-bit signed integer.
 * Long integers that do not fit into Int32 will overflow.
 *
 * @param {string} num A non-empty string containing only digits.
 * @return {Int32}
 */
export function parseInt32(num) {
  // Number.MAX_SAFE_INTEGER (2 ** 53 - 1) and Number.MIN_SAFE_INTEGER
  // (-(2 ** 53)) have 16 digits.
  // Thus, we can safely split up to 15 digits per chunk w/o losing precision.
  let end = num.length % 15 || 15;
  let value = Number(num.substring(0, end));
  while ((end += 15) <= num.length) {
    value = Math.imul(value, 1000000000000000);
    value += Number(num.substring(end - 15, end));
  }
  return /** @type {Int32} */ (value | 0);
}

/**
 * Converts any value to a 32-bit signed integer.
 * If the value is not a number, it is converted to a number first. Then it is
 * truncated to a 32-bit signed integer.
 *
 * @param {*} value Value to convert
 * @return {Int32}
 * @throws {TypeError} If the value cannot be converted to a number, i.e. is a
 *    `BigInt` or `Symbol`.
 */
export function toInt32(value) {
  return /** @type {Int32} */ (value | 0);
}

/**
 * Checks if the given number is a signed 32-bit integer.
 *
 * @param {number} value
 * @return {value is Int32}
 */
export function isInt32(value) {
  return value === toInt32(value);
}
