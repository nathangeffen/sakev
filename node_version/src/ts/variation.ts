export class Variation<Type> {
  value: Type;
  olderSibling: Variation<Type> | null;
  youngerSibling: Variation<Type> | null;
  parent: Variation<Type> | null;
  oldestChild: Variation<Type> | null;

  constructor(value: Type) {
    this.value = value;
    this.olderSibling = null;
    this.youngerSibling = null;
    this.parent = null;
    this.oldestChild = null;
  }
  appendChild = function(this: Variation<Type>, value: Type): Variation<Type> {
    const variation = new Variation<Type>(value);
    if (this.oldestChild) {
      let node = this.oldestChild;
      while (node.youngerSibling) {
        node = node.youngerSibling;
      }
      node.youngerSibling = variation;
      variation.olderSibling = node;
    } else {
      this.oldestChild = variation;
    }
    variation.parent = this;
    return variation;
  }

  appendYoungerSibling = function(this: Variation<Type>, value: Type): Variation<Type> {
    const variation = new Variation<Type>(value);
    if (this.youngerSibling) {
      this.youngerSibling.olderSibling = variation;
      variation.youngerSibling = this.youngerSibling;
    }
    this.youngerSibling = variation;
    variation.olderSibling = this;
    return variation;
  }

  promote = function(this: Variation<Type>) {
    if (this.olderSibling) {

      // Some declarations to make the code easier to read
      const olderSibling = this.olderSibling;
      const youngerSibling = this.youngerSibling;
      const parent = this.parent;
      // First do this
      this.olderSibling = olderSibling.olderSibling;
      this.youngerSibling = olderSibling;

      // Make youngerSibling point to what used to be the older sibling
      if (youngerSibling) {
        youngerSibling.olderSibling = olderSibling;
      }

      // put olderSibling between the above two
      olderSibling.olderSibling = this;
      olderSibling.youngerSibling = youngerSibling;

      // Make the parent point to this if and only if it currently points
      // to olderSibling
      if (parent && parent.oldestChild === olderSibling) {
        parent.oldestChild = this;
      }
    }
  }

  appendOlderSibling = function(this: Variation<Type>, value: Type): Variation<Type> {
    const variation = this.appendYoungerSibling(value);
    this.promote();
    return variation;
  }

  oldestSibling = function(this: Variation<Type>): Variation<Type> {
    let variation = this;
    while (variation.olderSibling) {
      variation = variation.olderSibling;
    }
    return variation;
  }

  // Returns the least non-null significant variation immediately
  // attached to this one starting with younger sibling then older
  // sibling then parent. If no relatives, then null.
  delete = function(this: Variation<Type>): Variation<Type> | null {
    let variation: Variation<Type> | null = null;
    if (this.parent) {
      variation = this.parent;
      if (this.parent.oldestChild == this) {
        this.parent.oldestChild = this.youngerSibling;
      }
    }
    if (this.olderSibling) {
      variation = this.olderSibling;
      this.olderSibling.youngerSibling = this.youngerSibling;
    }
    if (this.youngerSibling) {
      variation = this.youngerSibling;
      this.youngerSibling.olderSibling = this.olderSibling;
    }
    return variation;
  }

  head = function(this: Variation<Type>): Variation<Type> {
    let result = this;
    while (result.parent) {
      result = result.parent;
    }
    return result;
  }


  traverse = function(
    this: Variation<Type>, processValue: (val: Type, location: number[]) => void, location: number[] = [0],
  ) {
    processValue(this.value, location);
    if (this.youngerSibling) {
      const count = location[location.length - 1];
      location.push(count);
      const variation = this.youngerSibling;
      variation.traverse(processValue, location);
      location.pop();
    }
    if (this.oldestChild) {
      location[location.length - 1]++;
      const variation = this.oldestChild;
      variation.traverse(processValue, location);
    }
  }
}

