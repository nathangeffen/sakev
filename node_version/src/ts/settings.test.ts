import { expect, test } from "vitest";
import { dbRemoveSetting, getSetting } from "./settings.js";

test("Test create setting", () => {
  let value = getSetting("key1");
  expect(value).toStrictEqual(null);
  value = getSetting("key1", () => {
    return "value1";
  }, false);
  expect(value).toStrictEqual("value1");
  value = getSetting("key1", () => {
    return "value1";
  }, true);
  dbRemoveSetting("key1");
  value = getSetting("key1");
  expect(value).toStrictEqual(null);
});
