(function () {
  function appendChildren(parent, children) {
    for (const child of children.flat(Infinity)) {
      if (child === null || child === undefined || child === false) {
        continue;
      }
      parent.appendChild(
        child instanceof Node ? child : document.createTextNode(String(child)),
      );
    }
    return parent;
  }

  function el(tagName, attributes, children) {
    const element = document.createElement(tagName);
    for (const [name, value] of Object.entries(attributes || {})) {
      if (value === null || value === undefined || value === false) {
        continue;
      }
      if (name === "className") {
        element.className = value;
      } else if (name === "dataset") {
        for (const [dataName, dataValue] of Object.entries(value)) {
          element.dataset[dataName] = dataValue;
        }
      } else if (name === "style" && typeof value === "object") {
        Object.assign(element.style, value);
      } else if (name.startsWith("on") && typeof value === "function") {
        element.addEventListener(name.slice(2).toLowerCase(), value);
      } else if (name in element) {
        element[name] = value;
      } else {
        element.setAttribute(name, String(value));
      }
    }

    return appendChildren(
      element,
      Array.isArray(children) ? children : [children],
    );
  }

  function clear(element) {
    if (element) {
      element.replaceChildren();
    }
    return element;
  }

  function setChildren(element, children) {
    clear(element);
    return appendChildren(
      element,
      Array.isArray(children) ? children : [children],
    );
  }

  window.AdminDOM = {
    appendChildren,
    clear,
    el,
    setChildren,
  };
})();
