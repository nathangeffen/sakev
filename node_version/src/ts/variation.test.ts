import { expect, test } from "vitest";
import { Variation } from "./variation.js";

// We build the following tree and do our tests on it
// 1->2->3->4
//     ->3.5
//     ->3.7->4.7

const node_1_0 = function() {
  let node = new Variation(1.0);
  return node;
};

const node_2_0 = function() {
  let node = node_1_0();
  return node.appendChild(2.0);
};

const node_3_0 = function() {
  let node = node_2_0();
  return node.appendChild(3.0);
};

const node_3_5 = function() {
  let node = node_3_0();
  node = node.parent!;
  return node.appendChild(3.5);
};

const node_3_7 = function() {
  let node = node_3_5();
  node = node.parent!;
  return node.appendChild(3.7);
};

const node_4_0 = function() {
  let node = node_3_7();
  node = node.oldestSibling();
  return node.appendChild(4);
};

const node_4_7 = function() {
  let node = node_4_0();
  node = node.parent!;
  node = node.youngerSibling!.youngerSibling!;
  return node.appendChild(4.7);
};

const fullTree = function() {
  return node_4_7();
};

test("Variation with one node", () => {
  let node = node_1_0();
  expect(node.value).toStrictEqual(1);
  expect(node.parent).toEqual(null);
  expect(node.oldestChild).toEqual(null);
  expect(node.olderSibling).toEqual(null);
  expect(node.youngerSibling).toEqual(null);
});

test("Tree with two nodes", () => {
  let node = node_2_0();
  expect(node.value).toStrictEqual(2);
  expect(node.parent!.oldestChild).toStrictEqual(node);
  expect(node.olderSibling).toStrictEqual(null);
  expect(node.youngerSibling).toStrictEqual(null);
  expect(node.parent!.value).toStrictEqual(1);
});

test("Tree with three nodes", () => {
  let node = node_3_0();
  expect(node.value).toStrictEqual(3);
  expect(node.parent!.oldestChild).toStrictEqual(node);
  expect(node.olderSibling).toStrictEqual(null);
  expect(node.youngerSibling).toStrictEqual(null);
  expect(node.parent!.value).toStrictEqual(2);
  expect(node.parent!.parent!.value).toStrictEqual(1);
  expect(node.parent!.parent!.parent).toStrictEqual(null);
});

test("Tree with four nodes and subvariations", () => {
  let node = fullTree();
  node = node.head();
  expect(node.value).toStrictEqual(1);
  expect(node.parent).toStrictEqual(null);
  expect(node.olderSibling).toStrictEqual(null);
  expect(node.youngerSibling).toStrictEqual(null);
  node = node.oldestChild!;
  expect(node.value).toStrictEqual(2);
  expect(node.parent!.value).toStrictEqual(1);
  expect(node.olderSibling).toStrictEqual(null);
  expect(node.youngerSibling).toStrictEqual(null);
  node = node.oldestChild!;
  expect(node.value).toStrictEqual(3);
  expect(node.parent!.value).toStrictEqual(2);
  expect(node.olderSibling).toStrictEqual(null);
  expect(node.oldestChild!.value).toStrictEqual(4);
  expect(node.youngerSibling!.value).toStrictEqual(3.5);
  let youngest = node.oldestChild;
  expect(youngest!.value).toStrictEqual(4);
  expect(youngest!.parent!.value).toStrictEqual(3);
  expect(youngest!.olderSibling!).toStrictEqual(null);
  expect(youngest!.oldestChild!).toStrictEqual(null);
  expect(youngest!.youngerSibling!).toStrictEqual(null);
  node = node.youngerSibling!;
  expect(node.value).toStrictEqual(3.5);
  expect(node.parent!.value).toStrictEqual(2);
  expect(node.olderSibling!.value).toStrictEqual(3);
  expect(node.youngerSibling!.value).toStrictEqual(3.7);
  expect(node.oldestChild!).toStrictEqual(null);
  node = node.youngerSibling!;
  expect(node.value).toStrictEqual(3.7);
  expect(node.parent!.value).toStrictEqual(2);
  expect(node.olderSibling!.value).toStrictEqual(3.5);
  expect(node.youngerSibling).toStrictEqual(null);
  expect(node.oldestChild!.value).toStrictEqual(4.7);
});

test("Node promotion", () => {
  let node = fullTree();
  expect(node.value).toStrictEqual(4.7);

  node = node.parent!;
  expect(node.value).toStrictEqual(3.7);
  node.promote();
  expect(node.value).toStrictEqual(3.7);
  expect(node.parent!.value).toStrictEqual(2);
  expect(node.olderSibling!.value).toStrictEqual(3);
  expect(node.youngerSibling!.value).toStrictEqual(3.5);
  expect(node.oldestChild!.value).toStrictEqual(4.7);
  expect(node.parent!.oldestChild!.value).toStrictEqual(3);
  expect(node.youngerSibling!.olderSibling).toStrictEqual(node);
  expect(node.youngerSibling!.youngerSibling).toStrictEqual(null);

  node.promote();
  expect(node.value).toStrictEqual(3.7);
  expect(node.parent!.value).toStrictEqual(2);
  expect(node.olderSibling).toStrictEqual(null);
  expect(node.youngerSibling!.value).toStrictEqual(3);
  expect(node.oldestChild!.value).toStrictEqual(4.7);
  expect(node.youngerSibling!.olderSibling).toStrictEqual(node);
  expect(node.youngerSibling!.youngerSibling!.value).toStrictEqual(3.5);
  expect(node.parent!.oldestChild!.value).toStrictEqual(3.7);

  // Should change nothing
  node.promote();
  expect(node.value).toStrictEqual(3.7);
  expect(node.parent!.value).toStrictEqual(2);
  expect(node.olderSibling).toStrictEqual(null);
  expect(node.youngerSibling!.value).toStrictEqual(3);
  expect(node.oldestChild!.value).toStrictEqual(4.7);
  expect(node.youngerSibling!.olderSibling).toStrictEqual(node);
  expect(node.youngerSibling!.youngerSibling!.value).toStrictEqual(3.5);
  expect(node.parent!.oldestChild!.value).toStrictEqual(3.7);
});

test("Node deletion", () => {
  let node = node_4_0();
  node = node.head(); // value == 1
  node = node.oldestChild!; // value == 2
  node = node.oldestChild!; // value == 3
  expect(node.value).toStrictEqual(3);
  expect(node.youngerSibling!.value).toStrictEqual(3.5);
  expect(node.youngerSibling!.youngerSibling!.value).toStrictEqual(3.7);
  expect(node.youngerSibling!.youngerSibling!.youngerSibling!).toStrictEqual(null);

  let nodeDeleted = node.delete();
  expect(nodeDeleted!.parent!.value).toStrictEqual(2);
  expect(nodeDeleted!.value).toStrictEqual(3.5);
  expect(nodeDeleted!.youngerSibling!.value).toStrictEqual(3.7);
  expect(nodeDeleted!.oldestChild).toStrictEqual(null);
});

test("Traverse", () => {
  let node = node_4_7();
  node = node.head();
  const expected = [1.0, 2.0, 3.0, 3.5, 3.7, 4.7, 4.0]
  let index = 0;
  node.traverse((val: number, location: number[]) => {
    expect(val).toStrictEqual(expected[index]);
    expect(index).toBeGreaterThanOrEqual(location[0]);
    if (val === 3.5) {
      expect(location.length).toStrictEqual(2);
      expect(location[0]).toStrictEqual(2);
      expect(location[1]).toStrictEqual(2);
    }
    if (val === 3.7) {
      expect(location.length).toStrictEqual(3);
      expect(location[2]).toStrictEqual(2);
    }
    if (val === 3.7) {
      expect(location.length).toStrictEqual(3);
      expect(location[2]).toStrictEqual(2);
    }
    if (val === 4.7) {
      expect(location.length).toStrictEqual(3);
      expect(location[2]).toStrictEqual(3);
    }
    if (val === 4.0) {
      expect(location.length).toStrictEqual(1);
      expect(location[0]).toStrictEqual(3);
    }
    index++;
  });
});
