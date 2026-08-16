/**
 * Тема 25 — Модули
 * Junior sandbox | только JavaScript
 *
 * Сначала реализуй double в math.js, затем runDouble.
 */

import { double } from "./math.js";

export function runDouble() {
  console.log(double(4));
}

if (typeof document === "undefined") {
  runDouble();
}
