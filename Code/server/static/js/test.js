/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 16);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 1 */
/***/ (function(module, exports) {

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return null !== obj && 'object' === typeof obj;
}

module.exports = isObject;


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__single__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__array__ = __webpack_require__(7);
/*
  This code is meant to be run in a browser. Compatability table to come. 
*/



function DOMObject (dom) {
  if (!dom) {
    this.__domo__ = null;
  } else {
    this.__isArray__ = dom instanceof Array;
    if (this.__isArray__) {
      this.__domo__ = new __WEBPACK_IMPORTED_MODULE_1__array__["a" /* default */](dom);
    } else {
      this.__domo__ = new __WEBPACK_IMPORTED_MODULE_0__single__["a" /* default */](dom);
    }
  }
}

Object.defineProperty(DOMObject.prototype, 'id', {
  get: function() {
    if (this.__isEmpty__()) {
      return null;
    }

    return this.__domo__.id;
  }
});

Object.defineProperty(DOMObject.prototype, 'html', {
  get: function() {
    if (this.__isEmpty__()) {
      return null;
    }

    return this.__domo__.html;
  }
});

Object.defineProperty(DOMObject.prototype, 'classes', {
  get: function() {
    if (this.__isEmpty__()) {
      return null;
    }

    return this.__domo__.classes;
  }
});

Object.defineProperty(DOMObject.prototype, 'checked', {
  get: function() {
    if (this.__isEmpty__()) {
      return null;
    }

    return this.__domo__.checked;
  },
  set: function(value) {
    if (!this.__isEmpty__()) {
      this.__domo__.checked = value;
    }
  }
});

Object.defineProperty(DOMObject.prototype, 'disabled', {
  get: function() {
    if (this.__isEmpty__()) {
      return null;
    }

    return this.__domo__.disabled;
  },
  set: function(value) {
    if (!this.__isEmpty__()) {
      this.__domo__.disabled = value;
    }
  }
});

Object.defineProperty(DOMObject.prototype, 'value', {
  get: function() {
    if (this.__isEmpty__()) {
      return null;
    }

    return this.__domo__.value;
  },
  set: function(value) {
    if (!this.__isEmpty__()) {
      this.__domo__.value = value;
    }
  }
});

Object.defineProperty(DOMObject.prototype, 'isEmpty', {
  get: function() {
    return this.__isEmpty__();
  }
});

DOMObject.prototype.filter = function (fn, query, options) {
  if (this.__isEmpty__()) {
    return [];
  }

  var result = this.__domo__.filter(fn, query, options);

  if (!(result instanceof Array)) {
    result = [result];
  } else {
    result = result.filter(function (d) {
      return d;
    });
  }

  return result;
};

DOMObject.prototype.forEach = function (fn, query, options) {
  if (this.__isEmpty__()) {
    return null;
  }

  this.__domo__.forEach(fn, query, options);
};

DOMObject.prototype.map = function (fn, query, options) {
  if (this.__isEmpty__()) {
    return [];
  }

  var result = this.__domo__.map(fn, query, options);

  if (!(result instanceof Array)) {
    result = [result];
  }

  return result;
};

DOMObject.prototype.setStyle = function (styles, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return new DOMObject(this.__domo__.setStyle(styles, query, options));
};

/**
  @param {String[] | String} attrs - Array of attributes to return.
*/
DOMObject.prototype.getAttr = function (attrs, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return this.__domo__.getAttr(attrs, query, options);
};

/**
  @param {Object} attrs - Object of attributes to set.
*/
DOMObject.prototype.setAttr = function (attrs, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return new DOMObject(this.__domo__.setAttr(attrs, query, options));
};

DOMObject.prototype.toggleClasses = function (classes, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return this.toggleClass(classes, query, options);
};

DOMObject.prototype.toggleClass = function (classes, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return new DOMObject(this.__domo__.toggleClass(classes, query, options));
};

DOMObject.prototype.removeClasses = function (classes, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return this.removeClass(classes, query, options);
};

DOMObject.prototype.removeClass = function (classes, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return new DOMObject(this.__domo__.removeClass(classes, query, options));
};

DOMObject.prototype.addClasses = function (classes, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return this.addClass(classes, query, options);
};

DOMObject.prototype.addClass = function (classes, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return new DOMObject(this.__domo__.addClass(classes, query, options));
};

DOMObject.prototype.insertBefore = function (child, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  child = this.__preprocessChild__(child);

  return new DOMObject(this.__domo__.insertBefore(child, query, options));
};

DOMObject.prototype.insertAfter = function (child, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  child = this.__preprocessChild__(child);

  return new DOMObject(this.__domo__.insertAfter(child, query, options));
};

DOMObject.prototype.remove = function (query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return new DOMObject(this.__domo__.remove(query, options));
};

DOMObject.prototype.append = function (child, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  child = this.__preprocessChild__(child);

  return new DOMObject(this.__domo__.append(child, query, options));
};


DOMObject.prototype.prepend = function (child, query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  child = this.__preprocessChild__(child);

  return new DOMObject(this.__domo__.prepend(child, query, options));
};

DOMObject.prototype.get = function (query, options) {
  if (this.__isEmpty__()) {
    return new DOMObject();
  }

  return new DOMObject(this.__domo__.get(query, options));
};

DOMObject.prototype.__preprocessChild__ = function (child) {
  if (child instanceof DOMObject) {
    child = child.html;
  } else if (typeof child === 'string') {
    return new DOMObject(child).html;
  }

  return child;
};

DOMObject.prototype.__isEmpty__ = function () {
  return !this.__domo__;
};

/* Static Methods */

DOMObject.isA = function(domo) {
  return domo instanceof DOMObject;
};

DOMObject.cast = function (domo) {
  if (domo instanceof DOMObject) {
    return domo;
  }

  return new DOMObject(domo);
};

/* harmony default export */ __webpack_exports__["a"] = (DOMObject);


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_emmet_parser__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__DOMObject__ = __webpack_require__(2);




function DOMOBase () {
}

DOMOBase.prototype.__filter__ = function (dom, fn, query, options) {
  var apply = function (dom, fn) {
    var domo = new __WEBPACK_IMPORTED_MODULE_1__DOMObject__["a" /* default */](dom);
    if (fn(domo)) {
      return domo;
    }
    // return fn(new DOMObject(dom));
  };

  return this.__getApply__(apply, dom, fn, query, options);
};

DOMOBase.prototype.__forEach__ = function (dom, fn, query, options) {
  var apply = function (dom, fn) {
    return fn(new __WEBPACK_IMPORTED_MODULE_1__DOMObject__["a" /* default */](dom));
  };

  return this.__getApply__(apply, dom, fn, query, options);
};

DOMOBase.prototype.__map__ = function (dom, fn, query, options) {
  var apply = function (dom, fn) {
    return fn(new __WEBPACK_IMPORTED_MODULE_1__DOMObject__["a" /* default */](dom));
  };

  return this.__getApply__(apply, dom, fn, query, options);
};

DOMOBase.prototype.__setStyle__ = function (dom, styles, query, options) {
  var apply = function (dom, styles) {
    for (var style in styles) {
      dom.style[style] = styles[style];
    }    
    
    return dom;
  };

  return this.__getApply__(apply, dom, styles, query, options);
};

DOMOBase.prototype.__getAttr__ = function (dom, attrs, query, options) {
  var apply = function (dom, attrs) {
    if (attrs instanceof Array) {
      return attrs.map(function (attr) {
        var result = dom.getAttribute(attr);
        if (!result) {
          return null;
        }

        return result;
      });
    }

    return dom.getAttribute(attrs);
  };

  return this.__getApply__(apply, dom, attrs, query, options);
};

DOMOBase.prototype.__setAttr__ = function (dom, attrs, query, options) {
  var apply = function (dom, attrs) {
    for (var attr in attrs) {
      dom.setAttribute(attr, attrs[attr]);
    }    
    
    return dom;
  };

  return this.__getApply__(apply, dom, attrs, query, options);
};

DOMOBase.prototype.__toggleClass__ = function (dom, classes, query, options) {
  var apply = function (dom, classes) {
    if (classes instanceof Array) {
      classes.forEach(function (c) {
        if (dom.classList && dom.classList.add) {
          dom.classList.toggle(c);
        }
      });
    } else {
      if (dom.classList && dom.classList.add) {
        dom.classList.toggle(classes);
      }
    }
    
    return dom;
  };

  return this.__getApply__(apply, dom, classes, query, options);
};

DOMOBase.prototype.__removeClass__ = function (dom, classes, query, options) {
  var apply = function (dom, classes) {
    if (classes instanceof Array) {
      classes.forEach(function (c) {
        if (dom.classList && dom.classList.add) {
          dom.classList.remove(c);
        }
      });
    } else {
      if (dom.classList && dom.classList.add) {
        dom.classList.remove(classes);
      }
    }
    
    return dom;
  };

  return this.__getApply__(apply, dom, classes, query, options);
};

DOMOBase.prototype.__addClass__ = function (dom, classes, query, options) {
  var apply = function (dom, classes) {
    if (classes instanceof Array) {
      classes.forEach(function (c) {
        if (dom.classList && dom.classList.add) {
          dom.classList.add(c);
        }
      });
    } else {
      if (dom.classList && dom.classList.add) {
        dom.classList.add(classes);
      }
    }
    
    return dom;
  };

  return this.__getApply__(apply, dom, classes, query, options);
};

DOMOBase.prototype.__remove__ = function (dom, query, options) {
  var apply = function (element) {
    if (!element.parentElement) {
      throw new Error ('Cannot remove root node.');
    }

    var removed = element.cloneNode(true);
    element.remove();
    return removed;
  };

  return this.__getApply__(apply, sibling, null, query, options);
};


DOMOBase.prototype.__insertBefore__ = function (sibling, target, query, options) {
  var apply = function (sibling, target) {
    if (!sibling.parentElement) {
      throw new Error (`Sibling requires a parent node.`);
    }

    sibling.parentElement.insertBefore(target, sibling.previousSibling);

    return target;
  };

  return this.__getApply__(apply, sibling, target, query, options);
};


DOMOBase.prototype.__insertAfter__ = function (sibling, target, query, options) {
  var apply = function (sibling, target) {
    if (!sibling.parentElement) {
      throw new Error (`Sibling requires a parent node.`);
    }

    sibling.parentElement.insertBefore(target, sibling.nextSibling);

    return target;
  };

  return this.__getApply__(apply, sibling, target, query, options);
};

DOMOBase.prototype.__append__ = function (parent, child, query, options) {
  var apply = function (parent, child) {

    parent.appendChild(child);

    return child;
  };
  
  return this.__getApply__(apply, parent, child, query, options);
};

DOMOBase.prototype.__prepend__ = function (parent, child, query, options) {
  var apply = function (parent, child) {
    parent.insertBefore(child, parent.firstChild);

    return child;
  };

  return this.__getApply__(apply, parent, child, query, options);
};

DOMOBase.prototype.__getApply__ = function (action, parent, child, query, options) {
  // if (!query) {
  //   return action(parent, child);
  // }

  var target = this.__get__(parent, query, options);

  if (!target) {
    return null;
  }

  if (target instanceof Array) {
    return target.map(function (d) {
      if (child instanceof Array) {
        return child.map(function (c) {
          if (c.hasOwnProperty('cloneNode')) {
            return action(d, c.cloneNode(true));
          }
          return action(d, c);
        });
      }

      if (child.hasOwnProperty('cloneNode')) {
        return action(d, child.cloneNode(true));
      }

      return action(d, child);
    }, this);
  }

  if (child instanceof Array) {
    return child.map(function (c) {
      return action(target, c);
    });
  }

  return action(target, child);
};

/**
  Query the DOMObject for the node.
  
  @param {String} query - The CSS Selector query string
  @param {Object} options - Optional options are as follows
    {Integer|Integer[]} index - The index(es) of the child(ren) to return when the query returns an array of children.

  @returns {DOM Node} - Found DOM Node. Null if not found.
*/
DOMOBase.prototype.__get__ = function (dom, query, options) {
  var children;

  if (!query) {
    if (!options) {
      return dom;
    }

    if (dom instanceof Array) {
      children = dom;
    } else {
      children = [dom];
    }
  } else {
    children = dom.querySelectorAll(query);
  }

  if (children.length > 1) {
    children = this.__toArray__(children);
    if (options) {
      // Array of indexes to return
      if (options.index && options.index instanceof Array) {
        return children.filter(function (c, index) {
          return options.index.includes(index);
        });
      } else if (!Number.isNaN(parseInt(options.index))) {
        // Single index to return

        return children[options.index];        
      }

      throw new Error (`Invalid options index. Expected Int[] or Int.`);
    }

    // All children
    return children;
  } else if (children.length === 1) {
    // Single Child Found
    return children[0];
  } else {
    // Nothing Found
    return null;
  }
};

DOMOBase.prototype.__build__ = function (dom) {
  if (!(dom instanceof Node)) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_emmet_parser__["a" /* default */])(dom);
  }

  return dom;
};

DOMOBase.prototype.__toArray__ = function (nodeList) {
  var foo = [];
  var i = 0;

  for (; i < nodeList.length; i++) {
    foo.push(nodeList[i]);
  }

  return foo;
};

/* harmony default export */ __webpack_exports__["a"] = (DOMOBase);


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony default export */ __webpack_exports__["a"] = ({
  GROUP_START: '(',
  GROUP_END: ')',
  TEXT_START: '{',
  TEXT_END: '}',
  MULTIPLY: '*',
  CHILD: '>',
  SIBLING: '+',
  PARENT: '^'
});


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  console.warn("Using browser-only version of superagent in non-browser environment");
  root = this;
}

var Emitter = __webpack_require__(6);
var RequestBase = __webpack_require__(12);
var isObject = __webpack_require__(1);
var isFunction = __webpack_require__(11);
var ResponseBase = __webpack_require__(13);
var shouldRetry = __webpack_require__(14);

/**
 * Noop.
 */

function noop(){};

/**
 * Expose `request`.
 */

var request = exports = module.exports = function(method, url) {
  // callback
  if ('function' == typeof url) {
    return new exports.Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new exports.Request('GET', method);
  }

  return new exports.Request(method, url);
}

exports.Request = Request;

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  throw Error("Browser-only verison of superagent could not find XHR");
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    pushEncodedKeyValuePair(pairs, key, obj[key]);
  }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (val != null) {
    if (Array.isArray(val)) {
      val.forEach(function(v) {
        pushEncodedKeyValuePair(pairs, key, v);
      });
    } else if (isObject(val)) {
      for(var subkey in val) {
        pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
      }
    } else {
      pairs.push(encodeURIComponent(key)
        + '=' + encodeURIComponent(val));
    }
  } else if (val === null) {
    pairs.push(encodeURIComponent(key));
  }
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var pair;
  var pos;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    pos = pair.indexOf('=');
    if (pos == -1) {
      obj[decodeURIComponent(pair)] = '';
    } else {
      obj[decodeURIComponent(pair.slice(0, pos))] =
        decodeURIComponent(pair.slice(pos + 1));
    }
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Check if `mime` is json or has +json structured syntax suffix.
 *
 * @param {String} mime
 * @return {Boolean}
 * @api private
 */

function isJSON(mime) {
  return /[\/+]json\b/.test(mime);
}

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req) {
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  var status = this.xhr.status;
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
      status = 204;
  }
  this._setStatusProperties(status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this._setHeaderProperties(this.header);

  if (null === this.text && req._responseType) {
    this.body = this.xhr.response;
  } else {
    this.body = this.req.method != 'HEAD'
      ? this._parseBody(this.text ? this.text : this.xhr.response)
      : null;
  }
}

ResponseBase(Response.prototype);

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype._parseBody = function(str){
  var parse = request.parse[this.type];
  if(this.req._parser) {
    return this.req._parser(this, str);
  }
  if (!parse && isJSON(this.type)) {
    parse = request.parse['application/json'];
  }
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {}; // preserves header name case
  this._header = {}; // coerces header names to lowercase
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      // issue #675: return the raw response if the response parsing fails
      if (self.xhr) {
        // ie9 doesn't have 'response' property
        err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
        // issue #876: return the http status code if the response parsing fails
        err.status = self.xhr.status ? self.xhr.status : null;
        err.statusCode = err.status; // backwards-compat only
      } else {
        err.rawResponse = null;
        err.status = null;
      }

      return self.callback(err);
    }

    self.emit('response', res);

    var new_err;
    try {
      if (!self._isResponseOK(res)) {
        new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
        new_err.original = err;
        new_err.response = res;
        new_err.status = res.status;
      }
    } catch(e) {
      new_err = e; // #985 touching res may cause INVALID_STATE_ERR on old Android
    }

    // #1000 don't catch errors from the callback to avoid double calling it
    if (new_err) {
      self.callback(new_err, res);
    } else {
      self.callback(null, res);
    }
  });
}

/**
 * Mixin `Emitter` and `RequestBase`.
 */

Emitter(Request.prototype);
RequestBase(Request.prototype);

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} [pass] optional in case of using 'bearer' as type
 * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass, options){
  if (typeof pass === 'object' && pass !== null) { // pass is optional and can substitute for options
    options = pass;
  }
  if (!options) {
    options = {
      type: 'function' === typeof btoa ? 'basic' : 'auto',
    }
  }

  switch (options.type) {
    case 'basic':
      this.set('Authorization', 'Basic ' + btoa(user + ':' + pass));
    break;

    case 'auto':
      this.username = user;
      this.password = pass;
    break;
      
    case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
      this.set('Authorization', 'Bearer ' + user);
    break;  
  }
  return this;
};

/**
 * Add query-string `val`.
 *
 * Examples:
 *
 *   request.get('/shoes')
 *     .query('size=10')
 *     .query({ color: 'blue' })
 *
 * @param {Object|String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `options` (or filename).
 *
 * ``` js
 * request.post('/upload')
 *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String|Object} options
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, options){
  if (file) {
    if (this._data) {
      throw Error("superagent can't mix .send() and .attach()");
    }

    this._getFormData().append(field, file, options || file.name);
  }
  return this;
};

Request.prototype._getFormData = function(){
  if (!this._formData) {
    this._formData = new root.FormData();
  }
  return this._formData;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  // console.log(this._retries, this._maxRetries)
  if (this._maxRetries && this._retries++ < this._maxRetries && shouldRetry(err, res)) {
    return this._retry();
  }

  var fn = this._callback;
  this.clearTimeout();

  if (err) {
    if (this._maxRetries) err.retries = this._retries - 1;
    this.emit('error', err);
  }

  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
  err.crossDomain = true;

  err.status = this.status;
  err.method = this.method;
  err.url = this.url;

  this.callback(err);
};

// This only warns, because the request is still likely to work
Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function(){
  console.warn("This is not supported in browser version of superagent");
  return this;
};

// This throws, because it can't send/receive data as expected
Request.prototype.pipe = Request.prototype.write = function(){
  throw Error("Streaming is not supported in browser version of superagent");
};

/**
 * Compose querystring to append to req.url
 *
 * @api private
 */

Request.prototype._appendQueryString = function(){
  var query = this._query.join('&');
  if (query) {
    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
  }

  if (this._sort) {
    var index = this.url.indexOf('?');
    if (index >= 0) {
      var queryArr = this.url.substring(index + 1).split('&');
      if (isFunction(this._sort)) {
        queryArr.sort(this._sort);
      } else {
        queryArr.sort();
      }
      this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
    }
  }
};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
Request.prototype._isHost = function _isHost(obj) {
  // Native objects stringify to [object File], [object Blob], [object FormData], etc.
  return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
}

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  if (this._endCalled) {
    console.warn("Warning: .end() was called twice. This is not supported in superagent");
  }
  this._endCalled = true;

  // store callback
  this._callback = fn || noop;

  // querystring
  this._appendQueryString();

  return this._end();
};

Request.prototype._end = function() {
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var data = this._formData || this._data;

  this._setTimeouts();

  // state change
  xhr.onreadystatechange = function(){
    var readyState = xhr.readyState;
    if (readyState >= 2 && self._responseTimeoutTimer) {
      clearTimeout(self._responseTimeoutTimer);
    }
    if (4 != readyState) {
      return;
    }

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (!status) {
      if (self.timedout || self._aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(direction, e) {
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    e.direction = direction;
    self.emit('progress', e);
  }
  if (this.hasListeners('progress')) {
    try {
      xhr.onprogress = handleProgress.bind(null, 'download');
      if (xhr.upload) {
        xhr.upload.onprogress = handleProgress.bind(null, 'upload');
      }
    } catch(e) {
      // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
      // Reported here:
      // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
    }
  }

  // initiate request
  try {
    if (this.username && this.password) {
      xhr.open(this.method, this.url, true, this.username, this.password);
    } else {
      xhr.open(this.method, this.url, true);
    }
  } catch (err) {
    // see #1149
    return this.callback(err);
  }

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
    // serialize stuff
    var contentType = this._header['content-type'];
    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (!serialize && isJSON(contentType)) {
      serialize = request.serialize['application/json'];
    }
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;

    if (this.header.hasOwnProperty(field))
      xhr.setRequestHeader(field, this.header[field]);
  }

  if (this._responseType) {
    xhr.responseType = this._responseType;
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * OPTIONS query to `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.options = function(url, data, fn){
  var req = request('OPTIONS', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

function del(url, data, fn){
  var req = request('DELETE', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

request['del'] = del;
request['delete'] = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} [data]
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} [data] or fn
 * @param {Function} [fn]
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {


/**
 * Expose `Emitter`.
 */

if (true) {
  module.exports = Emitter;
}

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  function on() {
    this.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks['$' + event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks['$' + event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks['$' + event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks['$' + event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};


/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__base__ = __webpack_require__(3);


function DOMOArray (dom) {
  __WEBPACK_IMPORTED_MODULE_0__base__["a" /* default */].call(this);
  
  this.__dom__ = dom.map(function (d) {
    return this.__build__(d);
  }, this);

  if (process.env.NODE_ENV !== 'production') {
    console.log('DOMO Array');
  }
}

DOMOArray.prototype = Object.create(__WEBPACK_IMPORTED_MODULE_0__base__["a" /* default */].prototype);
DOMOArray.prototype.constructor = DOMOArray;

Object.defineProperty(DOMOArray.prototype, 'id', {
  get: function() {
    return this.html.map(function (dom) {
      return dom.id;
    });
  }
});

Object.defineProperty(DOMOArray.prototype, 'html', {
  get: function() {
    return this.__dom__;
  }
});

Object.defineProperty(DOMOArray.prototype, 'classes', {
  get: function() {
    return this.html.map(function (dom) {
      return dom.getAttribute('class');
    });
  }
});

Object.defineProperty(DOMOArray.prototype, 'checked', {
  get: function() {
    return this.html.map(function (dom) {
      return dom.checked;
    });
  },
  set: function(value) {
    if (value instanceof Array) {
      value.forEach(function (v, i) {
        this.html[i].checked = !!v;
      }, this);
    } else {
      value = !!value;

      this.html.forEach(function (dom) {
        dom.checked = value;
      });
    }
  }
});

Object.defineProperty(DOMOArray.prototype, 'disabled', {
  get: function() {
    return this.html.map(function (dom) {
      return dom.disabled;
    });
  },
  set: function(value) {
    if (value instanceof Array) {
      value.forEach(function (v, i) {
        this.html[i].disabled = !!v;
      }, this);
    } else {
      value = !!value;

      this.html.forEach(function (dom) {
        dom.disabled = value;
      });
    }
  }
});

Object.defineProperty(DOMOArray.prototype, 'value', {
  get: function() {
    return this.html.map(function (dom) {
      return dom.value;
    });
  },
  set: function(value) {
    if (value instanceof Array) {
      value.forEach(function (v, i) {
        this.html[i].value = v;
      }, this);
    } else {
      this.html.forEach(function (dom) {
        dom.value = value;
      });
    }
  }
});

DOMOArray.prototype.filter = function (fn, query, options) {
  if (!query && options) {
    return this.__filter__(this.html, fn, query, options);
  }
  
  return this.html.map(function (d) {
    return this.__filter__(d, fn, query, options);
  }, this);
};

DOMOArray.prototype.forEach = function (fn, query, options) {
  if (!query && options) {
    return this.__forEach__(this.html, fn, query, options);
  }
  
  return this.html.map(function (d) {
    return this.__forEach__(d, fn, query, options);
  }, this);
};

DOMOArray.prototype.map = function (fn, query, options) {
  if (!query && options) {
    return this.__map__(this.html, fn, query, options);
  }
  
  return this.html.map(function (d) {
    return this.__map__(d, fn, query, options);
  }, this);
};

DOMOArray.prototype.setStyle = function (styles, query, options) {
  if (!query && options) {
    return this.__setStyle__(this.html, styles, query, options);
  }

  return this.html.map(function (d) {
    return this.__setStyle__(d, styles, query, options);
  }, this);
};

DOMOArray.prototype.getAttr = function (attrs, query, options) {
  if (!query && options) {
    return this.__getAttr__(this.html, attrs, query, options);
  }

  return this.html.map(function (d) {
    return this.__getAttr__(d, attrs, query, options);
  }, this);
};

DOMOArray.prototype.setAttr = function (attrs, query, options) {
  if (!query && options) {
    return this.__setAttr__(this.html, attrs, query, options);
  }

  return this.html.map(function (d) {
    return this.__setAttr__(d, attrs, query, options);
  }, this);
};

DOMOArray.prototype.toggleClass = function (classes, query, options) {
  if (!query && options) {
    return this.__toggleClass__(this.html, classes, query, options);
  }

  return this.html.map(function (d) {
    return this.__toggleClass__(d, classes, query, options);
  }, this);
};

DOMOArray.prototype.removeClass = function (classes, query, options) {
  if (!query && options) {
    return this.__removeClass__(this.html, classes, query, options);
  }

  return this.html.map(function (d) {
    return this.__removeClass__(d, classes, query, options);
  }, this);
};

DOMOArray.prototype.addClass = function (classes, query, options) {
  if (!query && options) {
    return this.__addClass__(this.html, classes, query, options);
  }

  return this.html.map(function (d) {
    return this.__addClass__(d, classes, query, options);
  }, this);
};

DOMOArray.prototype.insertBefore = function (target, query, options) {
  if (!query && options) {
    return this.__insertBefore__(this.html, target, query, options);
  }

  return this.html.map(function (d) {
    return this.__insertBefore__(d, target.cloneNode(true), query, options);
  }, this);
};

DOMOArray.prototype.insertAfter = function (target, query, options) {
  if (!query && options) {
    return this.__insertAfter__(this.html, target, query, options);
  }

  return this.html.map(function (d) {
    return this.__insertAfter__(d, target.cloneNode(true), query, options);
  }, this);
};

DOMOArray.prototype.append = function (child, query, options) {
  if (!query && options) {
    return this.__append__(this.html, child, query, options);
  }

  return this.html.map(function (d) {
    return this.__append__(d, child.cloneNode(true), query, options);
  }, this);
};

DOMOArray.prototype.prepend = function (child, query, options) {
  if (!query && options) {
    return this.__prepend__(this.html, child, query, options);
  }

  return this.html.map(function (d) {
    return this.__prepend__(d, child.cloneNode(true), query, options);
  }, this);
};

DOMOArray.prototype.get = function (query, options) {
  if (!query && options) {
    return this.__get__(this.html, query, options);
  }

  return this.html.map(function (d) {
    return this.__get__(d, query, options);
  }, this);
};

/* harmony default export */ __webpack_exports__["a"] = (DOMOArray);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(0)))

/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__base__ = __webpack_require__(3);


function DOMOSingle (dom) {
  __WEBPACK_IMPORTED_MODULE_0__base__["a" /* default */].call(this);
  this.__dom__ = this.__build__(dom);

  if (process.env.NODE_ENV !== 'production') {
    console.log('DOMO Single');
  }
}

DOMOSingle.prototype = Object.create(__WEBPACK_IMPORTED_MODULE_0__base__["a" /* default */].prototype);
DOMOSingle.prototype.constructor = DOMOSingle;

Object.defineProperty(DOMOSingle.prototype, 'id', {
  get: function() {
    return this.html.id;
  }
});

Object.defineProperty(DOMOSingle.prototype, 'html', {
  get: function() {
    return this.__dom__;
  }
});

Object.defineProperty(DOMOSingle.prototype, 'classes', {
  get: function() {
    return this.html.getAttribute('class');
  }
});

Object.defineProperty(DOMOSingle.prototype, 'checked', {
  get: function() {
    return this.html.checked;
  },
  set: function(value) {
    this.html.checked = !!value;
  }
});

Object.defineProperty(DOMOSingle.prototype, 'disabled', {
  get: function() {
    return this.html.disabled;
  },
  set: function(value) {
    this.html.disabled = !!value;
  }
});

Object.defineProperty(DOMOSingle.prototype, 'value', {
  get: function() {
    return this.html.value;
  },
  set: function(value) {
    this.html.value = value;
  }
});

DOMOSingle.prototype.filter = function (fn, query, options) {
  return this.__filter__(this.html, fn, query, options);
};

DOMOSingle.prototype.forEach = function (fn, query, options) {
  return this.__forEach__(this.html, fn, query, options);
};

DOMOSingle.prototype.map = function (fn, query, options) {
  return this.__map__(this.html, fn, query, options);
};

DOMOSingle.prototype.setStyle = function (styles, query, options) {
  return this.__setStyle__(this.html, styles, query, options);
};

DOMOSingle.prototype.getAttr = function (attrs, query, options) {
  return this.__getAttr__(this.html, attrs, query, options);
};

DOMOSingle.prototype.setAttr = function (attrs, query, options) {
  return this.__setAttr__(this.html, attrs, query, options);
};

DOMOSingle.prototype.toggleClass = function (classes, query, options) {
  return this.__toggleClass__(this.html, classes, query, options);
};

DOMOSingle.prototype.removeClass = function (classes, query, options) {
  return this.__removeClass__(this.html, classes, query, options);
};

DOMOSingle.prototype.addClass = function (classes, query, options) {
  return this.__addClass__(this.html, classes, query, options);
};

DOMOSingle.prototype.insertBefore = function (target, query, options) {
  return this.__insertBefore__(this.html, target, query, options);
};

DOMOSingle.prototype.insertAfter = function (target, query, options) {
  return this.__insertAfter__(this.html, target, query, options);
};

DOMOSingle.prototype.remove = function (query, options) {
  return this.__remove__(this.html, query, options);
};

DOMOSingle.prototype.append = function (child, query, options) {
  return this.__append__(this.html, child, query, options);
};

DOMOSingle.prototype.prepend = function (child, query, options) {
  return this.__prepend__(this.html, child, query, options);
};

DOMOSingle.prototype.get = function (query, options) {
  return this.__get__(this.html, query, options);
};

/* harmony default export */ __webpack_exports__["a"] = (DOMOSingle);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(0)))

/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__tokenize__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ops__ = __webpack_require__(4);



var doc;

function parser(str, htmlDocument) {
  doc = htmlDocument || document;
  var tokens = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__tokenize__["a" /* default */])(str);

  if (tokens.length === 0) {
    throw new Error(`No tokens from String: ${str}`);
  }

  return makeNode(tokens);
}

/**
  Takes a queue of tokens and returns a node
*/
function makeNode(tokens) {
  var nodeStack = [];
  var token = null;
  var parent = null;
  var child = null;

  if (process.env.NODE_ENV !== 'production') {
    console.log('');
    console.log('Consuming Tokens');
  }

  if (process.env.DEBUG) {
    console.log('Tokens: ', tokens);
  }

  token = tokens.shift();
  // Evaluate the first node.
  if (isOp(token)) {
    if (token[0] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].TEXT_START) {
      nodeStack.push(evaluateText(token));
    } else if(token[0] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_START) {
      tokens.unshift(token);
      nodeStack.push(evaluateGrouping(tokens));
    } else {
      throw new Error (`Invalid Syntax. Expected valid node. Cannot start with opperator ${token}.`);
    }
  } else {
    nodeStack.push(evaluateNode(token));
  }


  while (tokens.length > 0) {
    token = tokens.shift();

    if (process.env.DEBUG) {
      console.log('Stack', nodeStack);
      console.log('Tokens', tokens);
      console.log(`Token: ${token}`);
    }

    if (isOp(token)) {
      if (token[0] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_START) {
        tokens.unshift(token);
        nodeStack.push(evaluateGrouping(tokens));
      } else if (token[0] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].TEXT_START) {
        parent = nodeStack.pop();

        if (!parent) {
          throw new Error (`Invalid Syntax. Text requires a parent.`);
        }

        nodeStack.push(evaluateChild(parent, evaluateText(token)));
      } else if (token[0] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].MULTIPLY) {
        if (nodeStack.length === 0) {
          if (process.env.DEBUG) {
            console.log('Error in makeNode() isOp * branch. Node stack is empty.');
          }

          throw new Error (`Invalid Syntax. ${__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].MULTIPLY} expects a valid node before it.`);
        }

        nodeStack.push(evaluateMultiply(nodeStack.pop(), token, tokens));
      } else if (token === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].PARENT) {
        if (nodeStack.length === 0) {
          throw new Error (`Invalid Syntax. ${__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].PARENT} expects a valid node before it.`);
        }

        nodeStack.push(evaluateParent(tokens, nodeStack));
      } else if (token === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].SIBLING) {
        if (nodeStack.length === 0) {
          throw new Error (`Invalid Syntax. ${__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].SIBLING} expects a valid node before it.`);
        }

        var first = nodeStack.pop();
        var second = tokens.shift();

        if (isOp(second)) {
          if (second !== __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_START) {
            throw new Error (`Invalid Syntax. ${__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].SIBLING} expects a valid node after it. Found opperator: ${second}.`);
          }

          tokens.unshift(second);
          second = evaluateGrouping(tokens);
        } else {
          second = evaluateNode(second);
        }
        nodeStack.push(evaluateSibling(first, second));
      } else if (token === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].CHILD) {
        child = tokens.shift();

        if (isOp(child)) {
          if (child !== __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_START) {
            throw new Error (`Invalid Syntax. ${__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].CHILD} expects a valid node after it. Found opperator: ${child}.`);
          }
          tokens.unshift(child);
          nodeStack.push(evaluateGrouping(tokens));
        } else {
          nodeStack.push(evaluateNode(child));
        }
      } else {
        throw new Error (`Unhandled Opperator: ${token}.`);
      }
    } else {
      // probably shouldn't ever get here on valid strings
      if (process.env.DEBUG) {
        console.log(`I don't think this should happen. Token: ${token}`);
      }

      throw new Error(`Expected Opperator but found ${token}.`);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('Finished Tokens');
  }

  if (process.env.DEBUG) {
    console.log('Node Stack: ', nodeStack);
  }

  evaluateStack(nodeStack);

  if (process.env.DEBUG) {
    console.log('Evaluated Node Stack', nodeStack[0]);
    console.log('');
  }

  return nodeStack.pop();
}

/**
  Mutates stack.
*/
function evaluateStack (stack) {
  var parent = null;
  var child = null;

  if (process.env.NODE_ENV !== 'production') {
    console.log('Evaluating Stack');
  }

  if (process.env.DEBUG) {
    console.log('Stack: ', stack);
  }

  while (stack.length > 1) {
    child = stack.pop();
    parent = stack.pop();
    stack.push(evaluateChild(parent, child));
  }
}

/**
  @param {String} node - The string of the element to create.

  @return {DOM Node} - DOM Node representation of the string.
*/
function evaluateNode (node) {
  // Supported SVG Tags
  var svgTags = [
    'circle',
    'defs',
    'ellipse',
    'g',
    'line',
    'linearGradient',
    'mask',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'rect',
    'svg',
    'text'
  ];

  if (process.env.DEBUG) {
    console.log(`Evaluating node: ${node}`);
  }
  var attrs = node.split('#');
  var id = null;
  var classes = [];

  if (attrs.length > 1) {
    // There is an ID
    classes = attrs[1].split('.');
    id = classes.shift();
    node = attrs[0];
  } else {
    classes = attrs[0].split('.');
    node = classes.shift();
  }

  if (svgTags.includes(node)) {
    node = doc.createElementNS("http://www.w3.org/2000/svg", node);
  } else {
    node = doc.createElement(node);
  }

  if (id) {
    node.setAttribute('id', id);
  }

  classes.forEach(function (c) {
    node.classList.add(c);
  });

  return node;
}

function evaluateParent (tokens, nodeStack) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Evaluating Parent Op');
  }

  var depth = 1;

  while (tokens[0] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].PARENT) {
    depth++;
    tokens.shift();
  }

  // Get a pointer to the first child.
  var children = nodeStack[nodeStack.length - 1];
  evaluateStack(nodeStack);
  var parent = nodeStack.pop();
  var target = children;

  if (process.env.DEBUG) {
    console.log('Parent:', parent);
    console.log('Child: ', children);
  }

  for (var i = 0; i <= depth; i++) {
    target = target.parentElement;
    if (!target) {
      if (process.env.DEBUG) {
        console.log(`Target: ${target}`);
        console.log(`Depth: ${depth}, Iteration: ${i}`);
      }

      throw new Error (`Invalid Syntax. Too many ${__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].PARENT}.`);
    }
  }

  // Works because target is a pointer.
  evaluateChild(target, makeNode(tokens));
  return parent;
}

/**
  @param {DOM Node | DOM Node[]} parent - Soon to be parent(s).
  @param {DOM Node | DOM Node[]} child - Soon to be child(ren).

  @return {DOM Node | DOM Node[]} - The parent(s) with the child(ren). 
*/
function evaluateChild (parent, child) {
  if (process.env.DEBUG) {
    console.log('Evaluating Child');
    console.log('Parent: ', parent);
    console.log('Child: ', child);
  }

  var p = parent;

  if (parent instanceof Array) {
    p = parent[parent.length - 1];
  }


  if (child instanceof Array) {
    child.forEach(function (c) {
      p.appendChild(c);
    });
  } else {
    p.appendChild(child);
  }

  if (process.env.DEBUG) {
    console.log('Parent: ', parent);
  }

  // This works because p is a pointer.
  return parent;
}

/**
  @param {DOM Node | DOM Node []} first - The first child.
  @param {DOM Node | DOM Node []} second - The second child.

  @param {DOM Node[]} - Array of the combined children.
*/
function evaluateSibling (first, second) {
  if (process.env.DEBUG) {
    console.log('Evaluating Silbings');
    console.log('First', first);
    console.log('Second', second);
  }

  var result = [];

  if (first instanceof Array) {
    result = first;
  } else {
    result.push(first);
  }

  if (second instanceof Array) {
    second.forEach(function (node) {
      result.push(node);
    });
  } else {
    result.push(second);
  }

  return result;
}

/**  
  @param {DOM Node} target - The target DOM Node that will be multiplied.
  @param {String} token - The token with the GROUP_START symbol.
  @param {String[]} tokens - The rest of the tokens.

  @return {DOM Node} - The DOM Node structure that this grouping creates.
*/
function evaluateMultiply (target, token, tokens) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Evaluating Multiply');
  }

  if (process.env.DEBUG) {
    console.log('Tokens: ', tokens);
  }

  // Always an Int. Type checked during tokenizing.  
  var times = parseInt(token.split(' ')[1]);
  var result = [];
  var depth = 1;
  var grouping = [];
  var child = null;

  if (tokens[0] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].CHILD) {
    var t = tokens.shift();

    while (tokens.length > 0 && !child) {
      t = tokens.shift();
      if (isOp(t)) {
        if (t === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].CHILD) {
          depth++;
        } else if (t === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].PARENT) {
          depth--;
          if (depth < 1) {
            // End and process the group. Put the ^ back in the tokens.
            // tokens.unshift(t);
            if (process.env.DEBUG) {
              console.log('Grouping: ', grouping);
            }
            // grouping.shift();
            child = makeNode(grouping);
          }
        }
      }

      if (!child) {
        grouping.push(t);
      }
    }
  }

  if (!child && grouping.length > 0) {
    child = makeNode(grouping);
  }

  if (child) {
    target.appendChild(child);
  }

  for (var i = 0; i < times; i++) {
    result.push(target.cloneNode(true));
  }

  return result;
}

/**
  @param {String} token - Token representing the text to create.

  @return {DOM Node} - DOM Text node for this string.
*/
function evaluateText (token) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Evaluating Text.');
  }

  if (process.env.DEBUG) {
    console.log(`Text: ${token}`);
  }

  return doc.createTextNode(token.substr(1, token.length - 2).trim());
}

/**
  @param {String} token - The token with the GROUP_START symbol.
  @param {String[]} tokens - The rest of the tokens.

  @return {DOM Node} - The DOM Node structure that this grouping creates.
*/
function evaluateGrouping (tokens) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Starting new grouping.');
  }

  var token = tokens.shift();
  var endIndex = tokens.findIndex(function (t) {
    return t.length > 0 && t[t.length - 1] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_END;
  });

  if (endIndex >= 0) {
    var groupedTokens = tokens.slice(0, endIndex);
    
    // Mutate the tokens to remove the grouping. 
    for (var i = 0; i <= endIndex; i++) {
      tokens.shift();
    }

    return makeNode(groupedTokens);
  }

  if (token[token.length - 1] === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_END) {
    return makeNode([token.substr(1, token.length - 2)]);
  }

  if (process.env.DEBUG) {
    console.log(`No closing ) found.`, tokens);
  }

  throw new Error(`Invalid String. No closing ${__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_END}`);
}

/**
  @param {String} token - Token to check.

  @return {Boolean} - True: Token is an opperator.
*/
function isOp(token) {
  for (var op in __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */]) {
    if (token === __WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */][op] ||
        token.includes(__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].MULTIPLY) ||
        token.includes(__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_START) ||
        token.includes(__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].GROUP_END) ||
        token.includes(__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].TEXT_START) ||
        token.includes(__WEBPACK_IMPORTED_MODULE_1__ops__["a" /* default */].TEXT_END)) {

      return true;
    }
  }

  return false;
}

/* harmony default export */ __webpack_exports__["a"] = (parser);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(0)))

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(process) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ops__ = __webpack_require__(4);


/**
  @param {String} str - The string to tokenize.

  @return {String[]} - Array of string tokens.
*/
function tokenize(str) {
  if (typeof str !== 'string') {
    throw new Error(`Expected a String but found: ${str}`);
  }

  var tokens = str.split(' ');

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Tokenizing: ${str}`);
  }

  if (process.env.DEBUG) {
    console.log('Tokens: ', tokens);
  }

  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].includes(__WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].TEXT_START)) {
      condenseTextToken(tokens, i);
    } else if (tokens[i][0] === __WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].GROUP_START && tokens[i].length > 1) {
      tokens = tokens.slice(0,i).concat(tokens[i][0], tokens[i].substr(1), tokens.slice(i+1));
      // i++;
    } else if (tokens[i][tokens[i].length - 1] === __WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].GROUP_END && tokens[i].length > 1) {
      tokens = tokens.slice(0,i).concat(tokens[i].substr(0, tokens[i].length - 1), tokens[i][tokens[i].length - 1], tokens.slice(i+1));
      // i++;      
    } else if (tokens[i] === __WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].MULTIPLY) {
      condenseMultiplyToken(tokens, i);
    } else {
      tokens[i] = tokens[i].toLowerCase().trim();
    }
  }

  tokens = tokens.filter(function (token) {
    return token !== '';
  });

  return tokens;
}

/**
  @param {String[]} tokens - Array of tokens
  @param {Integer} start - Starting index of the text.
  @param {Integer} end - Ending index of the text.

  @return {String[]} - A mutated array of tokens with the text condensed into 
    the start index. All other tokens to the end are set to ''.
*/
function condenseTextToken(tokens, start) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Condensing Text Token');
  }

  var endIndex = tokens.slice(start).findIndex(function (token) {
    return token.includes(__WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].TEXT_END);
  });

  if (endIndex >= 0) {
    endIndex += start;
    tokens[start] = tokens.slice(start, endIndex + 1).join(' ').trim();

    if (process.env.DEBUG) {
      console.log(`Tokens ${start} - ${endIndex}: ${tokens[start]}`);
    }

    for (var i = start + 1; i <= endIndex; i++) {
      tokens[i] = '';
    }

    return;
  } 

  if (process.env.DEBUG) {
    console.log(`No closing }.`, tokens);
  }

  throw new Error(`Invalid String. No closing ${__WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].TEXT_END}`);
}

/**
  @param {String[]} tokens - Array of tokens
  @param {Integer} index - Index of the Multiply opperator.

  @return {String[]} - A mutated array of tokens with the multiply opperator
     condensed into the index. The integer token set to ''.
*/
function condenseMultiplyToken(tokens, index) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Condensing Multiply Token');
  }

  var num = parseInt(tokens[index + 1]);

  if (!Number.isNaN(num)) {
    tokens[index] = `${tokens[index]} ${num}`;
    // possible index error here.
    tokens[index + 1] = '';

    return;
  }

  if (process.env.DEBUG) {
    console.log(`Expected Integer after ${__WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].MULTIPLY} but found ${tokens[index + 1]}.`);
  }

  throw new Error(`Invalid String. Expected Integer after ${__WEBPACK_IMPORTED_MODULE_0__ops__["a" /* default */].MULTIPLY} but found ${tokens[index + 1]}.`);
}

/* harmony default export */ __webpack_exports__["a"] = (tokenize);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(0)))

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Check if `fn` is a function.
 *
 * @param {Function} fn
 * @return {Boolean}
 * @api private
 */
var isObject = __webpack_require__(1);

function isFunction(fn) {
  var tag = isObject(fn) ? Object.prototype.toString.call(fn) : '';
  return tag === '[object Function]';
}

module.exports = isFunction;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Module of mixed-in functions shared between node and client code
 */
var isObject = __webpack_require__(1);

/**
 * Expose `RequestBase`.
 */

module.exports = RequestBase;

/**
 * Initialize a new `RequestBase`.
 *
 * @api public
 */

function RequestBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in RequestBase.prototype) {
    obj[key] = RequestBase.prototype[key];
  }
  return obj;
}

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.clearTimeout = function _clearTimeout(){
  clearTimeout(this._timer);
  clearTimeout(this._responseTimeoutTimer);
  delete this._timer;
  delete this._responseTimeoutTimer;
  return this;
};

/**
 * Override default response body parser
 *
 * This function will be called to convert incoming data into request.body
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.parse = function parse(fn){
  this._parser = fn;
  return this;
};

/**
 * Set format of binary response body.
 * In browser valid formats are 'blob' and 'arraybuffer',
 * which return Blob and ArrayBuffer, respectively.
 *
 * In Node all values result in Buffer.
 *
 * Examples:
 *
 *      req.get('/')
 *        .responseType('blob')
 *        .end(callback);
 *
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.responseType = function(val){
  this._responseType = val;
  return this;
};

/**
 * Override default request body serializer
 *
 * This function will be called to convert data set via .send or .attach into payload to send
 *
 * @param {Function}
 * @api public
 */

RequestBase.prototype.serialize = function serialize(fn){
  this._serializer = fn;
  return this;
};

/**
 * Set timeouts.
 *
 * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
 * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
 *
 * Value of 0 or false means no timeout.
 *
 * @param {Number|Object} ms or {response, read, deadline}
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.timeout = function timeout(options){
  if (!options || 'object' !== typeof options) {
    this._timeout = options;
    this._responseTimeout = 0;
    return this;
  }

  for(var option in options) {
    switch(option) {
      case 'deadline':
        this._timeout = options.deadline;
        break;
      case 'response':
        this._responseTimeout = options.response;
        break;
      default:
        console.warn("Unknown timeout option", option);
    }
  }
  return this;
};

/**
 * Set number of retry attempts on error.
 *
 * Failed requests will be retried 'count' times if timeout or err.code >= 500.
 *
 * @param {Number} count
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.retry = function retry(count){
  // Default to 1 if no count passed or true
  if (arguments.length === 0 || count === true) count = 1;
  if (count <= 0) count = 0;
  this._maxRetries = count;
  this._retries = 0;
  return this;
};

/**
 * Retry request
 *
 * @return {Request} for chaining
 * @api private
 */

RequestBase.prototype._retry = function() {
  this.clearTimeout();

  // node
  if (this.req) {
    this.req = null;
    this.req = this.request();
  }

  this._aborted = false;
  this.timedout = false;

  return this._end();
};

/**
 * Promise support
 *
 * @param {Function} resolve
 * @param {Function} [reject]
 * @return {Request}
 */

RequestBase.prototype.then = function then(resolve, reject) {
  if (!this._fullfilledPromise) {
    var self = this;
    if (this._endCalled) {
      console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
    }
    this._fullfilledPromise = new Promise(function(innerResolve, innerReject){
      self.end(function(err, res){
        if (err) innerReject(err); else innerResolve(res);
      });
    });
  }
  return this._fullfilledPromise.then(resolve, reject);
}

RequestBase.prototype.catch = function(cb) {
  return this.then(undefined, cb);
};

/**
 * Allow for extension
 */

RequestBase.prototype.use = function use(fn) {
  fn(this);
  return this;
}

RequestBase.prototype.ok = function(cb) {
  if ('function' !== typeof cb) throw Error("Callback required");
  this._okCallback = cb;
  return this;
};

RequestBase.prototype._isResponseOK = function(res) {
  if (!res) {
    return false;
  }

  if (this._okCallback) {
    return this._okCallback(res);
  }

  return res.status >= 200 && res.status < 300;
};


/**
 * Get request header `field`.
 * Case-insensitive.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

RequestBase.prototype.get = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Get case-insensitive header `field` value.
 * This is a deprecated internal API. Use `.get(field)` instead.
 *
 * (getHeader is no longer used internally by the superagent code base)
 *
 * @param {String} field
 * @return {String}
 * @api private
 * @deprecated
 */

RequestBase.prototype.getHeader = RequestBase.prototype.get;

/**
 * Set header `field` to `val`, or multiple fields with one object.
 * Case-insensitive.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 * Case-insensitive.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 */
RequestBase.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Write the field `name` and `val`, or multiple fields with one object
 * for "multipart/form-data" request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 *
 * request.post('/upload')
 *   .field({ foo: 'bar', baz: 'qux' })
 *   .end(callback);
 * ```
 *
 * @param {String|Object} name
 * @param {String|Blob|File|Buffer|fs.ReadStream} val
 * @return {Request} for chaining
 * @api public
 */
RequestBase.prototype.field = function(name, val) {

  // name should be either a string or an object.
  if (null === name ||  undefined === name) {
    throw new Error('.field(name, val) name can not be empty');
  }

  if (this._data) {
    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObject(name)) {
    for (var key in name) {
      this.field(key, name[key]);
    }
    return this;
  }

  if (Array.isArray(val)) {
    for (var i in val) {
      this.field(name, val[i]);
    }
    return this;
  }

  // val should be defined now
  if (null === val || undefined === val) {
    throw new Error('.field(name, val) val can not be empty');
  }
  if ('boolean' === typeof val) {
    val = '' + val;
  }
  this._getFormData().append(name, val);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */
RequestBase.prototype.abort = function(){
  if (this._aborted) {
    return this;
  }
  this._aborted = true;
  this.xhr && this.xhr.abort(); // browser
  this.req && this.req.abort(); // node
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

RequestBase.prototype.withCredentials = function(on){
  // This is browser-only functionality. Node side is no-op.
  if(on==undefined) on = true;
  this._withCredentials = on;
  return this;
};

/**
 * Set the max redirects to `n`. Does noting in browser XHR implementation.
 *
 * @param {Number} n
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.redirects = function(n){
  this._maxRedirects = n;
  return this;
};

/**
 * Convert to a plain javascript object (not JSON string) of scalar properties.
 * Note as this method is designed to return a useful non-this value,
 * it cannot be chained.
 *
 * @return {Object} describing method, url, and data of this request
 * @api public
 */

RequestBase.prototype.toJSON = function(){
  return {
    method: this.method,
    url: this.url,
    data: this._data,
    headers: this._header
  };
};


/**
 * Send `data` as the request body, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
 *      request.post('/user')
 *        .send('name=tobi')
 *        .send('species=ferret')
 *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.send = function(data){
  var isObj = isObject(data);
  var type = this._header['content-type'];

  if (this._formData) {
    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
  }

  if (isObj && !this._data) {
    if (Array.isArray(data)) {
      this._data = [];
    } else if (!this._isHost(data)) {
      this._data = {};
    }
  } else if (data && this._data && this._isHost(this._data)) {
    throw Error("Can't merge these send calls");
  }

  // merge
  if (isObj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    // default to x-www-form-urlencoded
    if (!type) this.type('form');
    type = this._header['content-type'];
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!isObj || this._isHost(data)) {
    return this;
  }

  // default to json
  if (!type) this.type('json');
  return this;
};


/**
 * Sort `querystring` by the sort function
 *
 *
 * Examples:
 *
 *       // default order
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery()
 *         .end(callback)
 *
 *       // customized sort function
 *       request.get('/user')
 *         .query('name=Nick')
 *         .query('search=Manny')
 *         .sortQuery(function(a, b){
 *           return a.length - b.length;
 *         })
 *         .end(callback)
 *
 *
 * @param {Function} sort
 * @return {Request} for chaining
 * @api public
 */

RequestBase.prototype.sortQuery = function(sort) {
  // _sort default to true but otherwise can be a function or boolean
  this._sort = typeof sort === 'undefined' ? true : sort;
  return this;
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

RequestBase.prototype._timeoutError = function(reason, timeout, errno){
  if (this._aborted) {
    return;
  }
  var err = new Error(reason + timeout + 'ms exceeded');
  err.timeout = timeout;
  err.code = 'ECONNABORTED';
  err.errno = errno;
  this.timedout = true;
  this.abort();
  this.callback(err);
};

RequestBase.prototype._setTimeouts = function() {
  var self = this;

  // deadline
  if (this._timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self._timeoutError('Timeout of ', self._timeout, 'ETIME');
    }, this._timeout);
  }
  // response timeout
  if (this._responseTimeout && !this._responseTimeoutTimer) {
    this._responseTimeoutTimer = setTimeout(function(){
      self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
    }, this._responseTimeout);
  }
}


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {


/**
 * Module dependencies.
 */

var utils = __webpack_require__(15);

/**
 * Expose `ResponseBase`.
 */

module.exports = ResponseBase;

/**
 * Initialize a new `ResponseBase`.
 *
 * @api public
 */

function ResponseBase(obj) {
  if (obj) return mixin(obj);
}

/**
 * Mixin the prototype properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in ResponseBase.prototype) {
    obj[key] = ResponseBase.prototype[key];
  }
  return obj;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

ResponseBase.prototype.get = function(field){
    return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

ResponseBase.prototype._setHeaderProperties = function(header){
    // TODO: moar!
    // TODO: make this a util

    // content-type
    var ct = header['content-type'] || '';
    this.type = utils.type(ct);

    // params
    var params = utils.params(ct);
    for (var key in params) this[key] = params[key];

    this.links = {};

    // links
    try {
        if (header.link) {
            this.links = utils.parseLinks(header.link);
        }
    } catch (err) {
        // ignore
    }
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

ResponseBase.prototype._setStatusProperties = function(status){
    var type = status / 100 | 0;

    // status / class
    this.status = this.statusCode = status;
    this.statusType = type;

    // basics
    this.info = 1 == type;
    this.ok = 2 == type;
    this.redirect = 3 == type;
    this.clientError = 4 == type;
    this.serverError = 5 == type;
    this.error = (4 == type || 5 == type)
        ? this.toError()
        : false;

    // sugar
    this.accepted = 202 == status;
    this.noContent = 204 == status;
    this.badRequest = 400 == status;
    this.unauthorized = 401 == status;
    this.notAcceptable = 406 == status;
    this.forbidden = 403 == status;
    this.notFound = 404 == status;
};


/***/ }),
/* 14 */
/***/ (function(module, exports) {

var ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'EADDRINFO',
  'ESOCKETTIMEDOUT'
];

/**
 * Determine if a request should be retried.
 * (Borrowed from segmentio/superagent-retry)
 *
 * @param {Error} err
 * @param {Response} [res]
 * @returns {Boolean}
 */
module.exports = function shouldRetry(err, res) {
  if (err && err.code && ~ERROR_CODES.indexOf(err.code)) return true;
  if (res && res.status && res.status >= 500) return true;
  // Superagent timeout
  if (err && 'timeout' in err && err.code == 'ECONNABORTED') return true;
  if (err && 'crossDomain' in err) return true;
  return false;
};


/***/ }),
/* 15 */
/***/ (function(module, exports) {


/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

exports.type = function(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.params = function(str){
  return str.split(/ *; */).reduce(function(obj, str){
    var parts = str.split(/ *= */);
    var key = parts.shift();
    var val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Parse Link header fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

exports.parseLinks = function(str){
  return str.split(/ *, */).reduce(function(obj, str){
    var parts = str.split(/ *; */);
    var url = parts[0].slice(1, -1);
    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
    obj[rel] = url;
    return obj;
  }, {});
};

/**
 * Strip content related fields from `header`.
 *
 * @param {Object} header
 * @return {Object} header
 * @api private
 */

exports.cleanHeader = function(header, shouldStripCookie){
  delete header['content-type'];
  delete header['content-length'];
  delete header['transfer-encoding'];
  delete header['host'];
  if (shouldStripCookie) {
    delete header['cookie'];
  }
  return header;
};

/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_superagent__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_superagent___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_superagent__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_dom_object__ = __webpack_require__(2);



var results = new __WEBPACK_IMPORTED_MODULE_1_dom_object__["a" /* default */](document.getElementById('results'));

function testPathPost () {
  let test = new Promise((resolve, reject) => {
    __WEBPACK_IMPORTED_MODULE_0_superagent___default.a.post('http://localhost:8080/path')
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log(res);
    results.append('p { POST /graph success }');
  }).catch((err) => {
    results.append('p { POST /graph failure }');
  });
}

function testGraphPost () {
  let test = new Promise((resolve, reject) => {
    __WEBPACK_IMPORTED_MODULE_0_superagent___default.a.post('http://localhost:8080/graph')
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {

          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });

  test.then((res) => {
    console.log(res);
    results.append('p { POST /path success }');
  }).catch((err) => {
    results.append('p { POST /path failure }');
  });
}

function testGeoJSON () {
  console.log('testing geo json');
  let test = new Promise((resolve, reject) => {
    __WEBPACK_IMPORTED_MODULE_0_superagent___default.a.get('http://localhost:8080/graph/geo')
      .end((err, res) => {
        // console.log('err', err);
        // console.log('res', res);
        if (err) {
          console.log('rejecting');
          reject(err);
        } else {
          console.log('resolving');
          var json = JSON.parse(res.text);
          resolve(json);
        }
      });
  });




  test.then((res) => {
    results.append('p { POST /graph/geo success }');
    console.log(res);

    let nodeCount = 0;
    let nodes = [];
    let edges = [];
    let startNode;
    let endNode;
    res.features.forEach((feature) => {
      let coords = [];
      startNode = null;
      endNode = null;
      feature.geometry.coordinates.forEach((coord) => {
        coords.push([coord[1], coord[0]]);
      });

      // console.log(`Nodes length ${nodes.length}`);
      for (var i = 0; i < nodes.length; i++) {
        if (arrayEqual(nodes[i].latlng, coords[0])) {
          startNode = nodes[i];
        }
        if (arrayEqual(nodes[i].latlng, coords[coords.length - 1])) {
          endNode = nodes[i];
        }
      }

      if (!startNode) {
        startNode = { index: nodeCount, latlng: coords[0] };
        nodeCount++;
        nodes.push(startNode);
      }

      if (!endNode) {
        endNode = { index: nodeCount, latlng: coords[coords.length - 1] };
        nodeCount++;
        nodes.push(endNode);
      }

      let edge = {
        startNode: startNode,
        endNode: endNode,
        linePoints: coords,
        polyLine: null
      };

      let reverseEdge = {
        startNode: endNode,
        endNode: startNode,
        linePoints: coords.reverse(),
        polyLine: null
      };

      edges.push(edge);
      edges.push(reverseEdge);

      // console.log('Coordinates', coords);
      // console.log('edges', edges);
    });

    let adjMatrix = initAdjacenyMatrix(nodes, edges);
    console.log('Adjacency Matrix', adjMatrix);
    // test matrix for empty rows
    // test for deadend rows
    // test for single connected nodes

    __WEBPACK_IMPORTED_MODULE_0_superagent___default.a.post('http://localhost:8080/test')
      .set('Content-Type', 'application/json')
      .send({ adjMatrix: adjMatrix })
      .end((err, res) => {
        console.log(res);
      });

  }).catch((err) => {
    results.append('p { POST /graph/geo failure }');
  });

}

function initAdjacenyMatrix (nodes, edges) {
  console.log('nodes', nodes);
  console.log('edges', edges);
  let adjacencyMatrix = [];

  for (var i = 0; i < nodes.length; i++) {
    var row = [];
    for (var j = 0; j < nodes.length; j++) {
      row.push(0);
    }
    adjacencyMatrix.push(row);
  }

  for (var i = 0; i < edges.length; i++) {
    let indexA = edges[i].startNode.index;
    let indexB = edges[i].endNode.index;
    let latlngA = edges[i].startNode.latlng;
    let latlngB = edges[i].endNode.latlng;
    let weight = 1 + EuclideanDistance(latlngA, latlngB);
    adjacencyMatrix[indexA][indexB] = weight;
  }

  return adjacencyMatrix;
}

function EuclideanDistance(a, b)
{
  return Math.sqrt(Math.pow((b[0] - a[0]), 2) + Math.pow((b[1] - a[1]), 2));
}

function arrayEqual (arr1, arr2) {
  if (arr1 instanceof Array &&
      arr2 instanceof Array &&
      arr1.length === arr2.length &&
      arr1.every(function (e, i) {
        return e === arr2[i];
      }))
  {
        return true;
  }

  return false;
}

function init () {
  testPathPost();
  testGraphPost();
  testGeoJSON();
}

init();

/***/ })
/******/ ]);