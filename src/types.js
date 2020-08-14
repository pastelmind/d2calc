/**
 * Helper interface for `Nominal<T, B>`.
 * @template T
 * @typedef {object} Branded
 * @property {T} __brand
 */

/**
 * Nominal subtype of `T` with the brand `B`.
 * `B` should be the subtype name as a string literal, though any type is OK.
 * @template T, B
 * @typedef {T & Branded<B>} Nominal
 */

/**
 * Helper function for creating number and string literal types.
 * @template {number | string} T
 * @param {T} value
 * @return {T}
 */
export function _c(value) {
  return value;
}
