if (String.prototype.trim === undefined) // fix for iOS 3.2
  String.prototype.trim = function(){ return this.replace(/^\s+/, '').replace(/\s+$/, '') };

// For iOS 3.x
// from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
if (Array.prototype.reduce === undefined)
  Array.prototype.reduce = function(fun){
    if(this === void 0 || this === null) throw new TypeError();
    var t = Object(this), len = t.length >>> 0, k = 0, accumulator;
    if(typeof fun !== "function") throw new TypeError();
    if(len == 0 && arguments.length == 1) throw new TypeError();

    if(arguments.length >= 2)
     accumulator = arguments[1];
    else
      do{
        if(k in t){
          accumulator = t[k++];
          break;
        }
        if(++k >= len) throw new TypeError();
      } while (true);

    while (k < len){
      if(k in t) accumulator = fun.call(undefined, accumulator, t[k], k, t);
      k++;
    }
    return accumulator;
  };
var Zepto = (function() {
  var slice = [].slice, key, css, $$, fragmentRE, container, document = window.document, undefined,
    getComputedStyle = document.defaultView.getComputedStyle;

  function classRE(name){ return new RegExp("(^|\\s)" + name + "(\\s|$)") }
  function compact(array){ return array.filter(function(item){ return item !== undefined && item !== null }) }
  function flatten(array){ return array.reduce(function(a,b){ return a.concat(b) }, []) }
  function camelize(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }

  fragmentRE = /^\s*<.+>/;
  container = document.createElement("div");
  function fragment(html) {
    container.innerHTML = ('' + html).trim();
    var result = slice.call(container.childNodes);
    container.innerHTML = '';
    return result;
  }

  function Z(dom, selector){
    dom = dom || [];
    dom.__proto__ = Z.prototype;
    dom.selector = selector || '';
    return dom;
  }

  function $(selector, context){
    if (!selector) return Z();
    if (context !== undefined) return $(context).find(selector);
    else if (typeof selector === 'function') return $(document).ready(selector);
    else if (selector instanceof Z) return selector;
    else {
      var dom;
      if (selector instanceof Array) dom = compact(selector);
      else if (selector instanceof Element || selector === window || selector === document)
        dom = [selector], selector = null;
      else if (fragmentRE.test(selector)) dom = fragment(selector);
      else dom = $$(document, selector);
      return Z(dom, selector);
    }
  }

  $.extend = function(target, source){ for (key in source) target[key] = source[key]; return target }
  $.qsa = $$ = function(element, selector){ return slice.call(element.querySelectorAll(selector)) }

  $.fn = {
    forEach: [].forEach,
    map: [].map,
    reduce: [].reduce,
    push: [].push,
    indexOf: [].indexOf,
    concat: [].concat,
    ready: function(callback){
      document.addEventListener('DOMContentLoaded', callback, false); return this;
    },
    get: function(idx){ return idx === undefined ? this : this[idx] },
    size: function(){ return this.length },
    remove: function(){ return this.each(function(){ this.parentNode.removeChild(this) }) },
    each: function(callback){
      this.forEach(function(el, idx){ callback.call(el, idx, el) });
      return this;
    },
    filter: function(selector){
      return $([].filter.call(this, function(element){
        return $$(element.parentNode, selector).indexOf(element) >= 0;
      }));
    },
    is: function(selector){
      return this.length > 0 && $(this[0]).filter(selector).length > 0;
    },
    eq: function(idx){ return $(this[idx]) },
    first: function(){ return $(this[0]) },
    last: function(){ return $(this[this.length - 1]) },
    find: function(selector){
      var result;
      if (this.length == 1) result = $$(this[0], selector);
      else result = flatten(this.map(function(el){ return $$(el, selector) }));
      return $(result);
    },
    closest: function(selector, context){
      var node = this[0], nodes = $$(context !== undefined ? context : document, selector);
      if (nodes.length === 0) node = null;
      while(node && node !== document && nodes.indexOf(node) < 0) node = node.parentNode;
      return $(node !== document && node);
    },
    parents: function(selector){
      var ancestors = [], nodes = this;
      while (nodes.length > 0)
        nodes = compact(nodes.map(function(node){
          if ((node = node.parentNode) && node !== document && ancestors.indexOf(node) < 0) {
            ancestors.push(node);
            return node;
          }
        }));
      ancestors = $(ancestors);
      return selector === undefined ? ancestors : ancestors.filter(selector);
    },
    parent: function(selector){
      var node, nodes = [];
      this.each(function(){
        if ((node = this.parentNode) && nodes.indexOf(node) < 0) nodes.push(node);
      });
      nodes = $(nodes);
      return selector === undefined ? nodes : nodes.filter(selector);
    },
    pluck: function(property){ return this.map(function(element){ return element[property] }) },
    show: function(){ return this.css('display', 'block') },
    hide: function(){ return this.css('display', 'none') },
    prev: function(){ return $(this.pluck('previousElementSibling')) },
    next: function(){ return $(this.pluck('nextElementSibling')) },
    html: function(html){
      return html === undefined ?
        (this.length > 0 ? this[0].innerHTML : null) :
        this.each(function(idx){ this.innerHTML = typeof html == 'function' ? html(idx, this.innerHTML) : html });
    },
    text: function(text){
      return text === undefined ?
        (this.length > 0 ? this[0].innerText : null) :
        this.each(function(){ this.innerText = text });
    },
    attr: function(name, value){
      return (typeof name == 'string' && value === undefined) ?
        (this.length > 0 && this[0].nodeName === 'INPUT' && this[0].type === 'text' && name === 'value') ? (this.val()) :
        (this.length > 0 ? this[0].getAttribute(name) || undefined : null) :
        this.each(function(idx){
          if (typeof name == 'object') for (key in name) this.setAttribute(key, name[key])
          else this.setAttribute(name, typeof value == 'function' ? value(idx, this.getAttribute(name)) : value);
        });
    },
    removeAttr: function(name) {
      return this.each(function() { this.removeAttribute(name); });
    },
    val: function(value){
      return (value === undefined) ?
        (this.length > 0 ? this[0].value : null) :
        this.each(function(){
          this.value = value;
        });
    },
    offset: function(){
      var obj = this[0].getBoundingClientRect();
      return {
        left: obj.left + document.body.scrollLeft,
        top: obj.top + document.body.scrollTop,
        width: obj.width,
        height: obj.height
      };
    },
    css: function(property, value){
      if (value === undefined && typeof property == 'string')
        return this[0].style[camelize(property)] || getComputedStyle(this[0], '').getPropertyValue(property);
      css = "";
      for (key in property) css += key + ':' + property[key] + ';';
      if (typeof property == 'string') css = property + ":" + value;
      return this.each(function() { this.style.cssText += ';' + css });
    },
    index: function(element){
      return this.indexOf($(element)[0]);
    },
    hasClass: function(name){
      return classRE(name).test(this[0].className);
    },
    addClass: function(name){
      return this.each(function(){
        !$(this).hasClass(name) && (this.className += (this.className ? ' ' : '') + name)
      });
    },
    removeClass: function(name){
      return this.each(function(){
        this.className = this.className.replace(classRE(name), ' ').trim()
      });
    },
    toggleClass: function(name, when){
      return this.each(function(){
       ((when !== undefined && !when) || $(this).hasClass(name)) ?
         $(this).removeClass(name) : $(this).addClass(name)
      });
    }
  };

  ['width', 'height'].forEach(function(property){
    $.fn[property] = function(){ return this.offset()[property] }
  });


  var adjacencyOperators = {append: 'beforeEnd', prepend: 'afterBegin', before: 'beforeBegin', after: 'afterEnd'};

  for (key in adjacencyOperators)
    $.fn[key] = (function(operator) {
      return function(html){
        return this.each(function(index, element){
          if (html instanceof Z) {
            dom = html;
            if (operator == "afterBegin" || operator == "afterEnd")
              for (var i=0; i<dom.length; i++) element['insertAdjacentElement'](operator, dom[dom.length-i-1]);
            else
              for (var i=0; i<dom.length; i++) element['insertAdjacentElement'](operator, dom[i]);
          } else {
            element['insertAdjacent'+(html instanceof Element ? 'Element' : 'HTML')](operator, html);
          }
        });
      };
    })(adjacencyOperators[key]);

  Z.prototype = $.fn;

  return $;
})();

'$' in window || (window.$ = Zepto);
(function($){
  var $$ = $.qsa, handlers = {}, _zid = 1;
  function zid(element) {
    return element._zid || (element._zid = _zid++);
  }
  function findHandlers(element, event, fn, selector) {
    event = parse(event);
    if (event.ns) var matcher = matcherFor(event.ns);
    return (handlers[zid(element)] || []).filter(function(handler) {
      return handler
        && (!event.e  || handler.e == event.e)
        && (!event.ns || matcher.test(handler.ns))
        && (!fn       || handler.fn == fn)
        && (!selector || handler.sel == selector);
    });
  }
  function parse(event) {
    var parts = ('' + event).split('.');
    return {e: parts[0], ns: parts.slice(1).sort().join(' ')};
  }
  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
  }

  function add(element, events, fn, selector, delegate){
    var id = zid(element), set = (handlers[id] || (handlers[id] = []));
    events.split(/\s/).forEach(function(event){
      var handler = $.extend(parse(event), {fn: fn, sel: selector, del: delegate, i: set.length});
      set.push(handler);
      element.addEventListener(handler.e, delegate || fn, false);
    });
  }
  function remove(element, events, fn, selector){
    var id = zid(element);
    (events || '').split(/\s/).forEach(function(event){
      findHandlers(element, event, fn, selector).forEach(function(handler){
        delete handlers[id][handler.i];
        element.removeEventListener(handler.e, handler.del || handler.fn, false);
      });
    });
  }

  $.event = {
    add: function(element, events, fn){
      add(element, events, fn);
    },
    remove: function(element, events, fn){
      remove(element, events, fn);
    }
  };

  $.fn.bind = function(event, callback){
    return this.each(function(){
      add(this, event, callback);
    });
  };
  $.fn.unbind = function(event, callback){
    return this.each(function(){
      remove(this, event, callback);
    });
  };
  $.fn.one = function(event, callback){
    return this.each(function(){
      var self = this;
      add(this, event, function wrapper(){
        callback();
        remove(self, event, arguments.callee);
      });
    });
  };

  $.Event = function(event) {
    if (typeof event == 'string') {
      var name = event;
      event = document.createEvent('Events');
      event.initEvent(name, true, true);
      return event;
    } else {
      this.originalEvent = event;
      for (key in event) if (typeof event[key] != 'function') this[key] = event[key];
    }
  };

  ['preventDefault', 'stopImmediatePropagation', 'stopPropagation'].forEach(function(method){
    $.Event.prototype[method] = function() {
      return this.originalEvent[method].apply(this.originalEvent, arguments);
    };
  });

  $.fn.delegate = function(selector, event, callback){
    return this.each(function(i, element){
      add(element, event, callback, selector, function(e){
        var target = e.target, nodes = $$(element, selector);
        while (target && nodes.indexOf(target) < 0) target = target.parentNode;
        if (target && !(target === element) && !(target === document)) {
          callback.call(target, $.extend(new $.Event(e), {
            currentTarget: target, liveFired: element
          }));
        }
      });
    });
  };
  $.fn.undelegate = function(selector, event, callback){
    return this.each(function(){
      remove(this, event, callback, selector);
    });
  }

  $.fn.live = function(event, callback){
    $(document.body).delegate(this.selector, event, callback);
    return this;
  };
  $.fn.die = function(event, callback){
    $(document.body).undelegate(this.selector, event, callback);
    return this;
  };

  $.fn.trigger = function(event, data){
    var name, result;
    if (typeof event == 'string') name = event, event = new $.Event(name);
    return this.each(function(){
      if (name) event.initEvent(name, true, false);
      result = this.dispatchEvent(event);
      if (event.result !== false) event.result = result;
    });
  };
})(Zepto);
(function($){
  function detect(ua){
    var ua = ua, os = {},
      android = ua.match(/(Android)\s+([\d.]+)/),
      iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      webos = ua.match(/(webOS)\/([\d.]+)/),
      blackberry = ua.match(/(BlackBerry).*Version\/([\d.]+)/);
    if (android) os.android = true, os.version = android[2];
    if (iphone) os.ios = true, os.version = iphone[2].replace(/_/g, '.'), os.iphone = true;
    if (ipad) os.ios = true, os.version = ipad[2].replace(/_/g, '.'), os.ipad = true;
    if (webos) os.webos = true, os.version = webos[2];
    if (blackberry) os.blackberry = true, os.version = blackberry[2];
    return os;
  }
  $.os = detect(navigator.userAgent);
  $.__detect = detect;

  var v = navigator.userAgent.match(/WebKit\/([\d.]+)/);
  $.browser = v ? { webkit: true, version: v[1] } : { webkit: false };
})(Zepto);
(function($){
  $.fn.anim = function(properties, duration, ease){
    var transforms = [], opacity, key;
    for (key in properties)
      if (key === 'opacity') opacity = properties[key];
      else transforms.push(key + '(' + properties[key] + ')');

    return this.css({
      '-webkit-transition': 'all ' + (duration !== undefined ? duration : 0.5) + 's ' + (ease || ''),
      '-webkit-transform': transforms.join(' '),
      opacity: opacity
    });
  }
})(Zepto);
(function($){
  var touch = {}, touchTimeout;

  function parentIfText(node){
    return 'tagName' in node ? node : node.parentNode;
  }

  $(document).ready(function(){
    $(document.body).bind('touchstart', function(e){
      var now = Date.now(), delta = now - (touch.last || now);
      touch.target = parentIfText(e.touches[0].target);
      touchTimeout && clearTimeout(touchTimeout);
      touch.x1 = e.touches[0].pageX;
      if (delta > 0 && delta <= 250) touch.isDoubleTap = true;
      touch.last = now;
    }).bind('touchmove', function(e){
      touch.x2 = e.touches[0].pageX
    }).bind('touchend', function(e){
      if (touch.isDoubleTap) {
        $(touch.target).trigger('doubleTap');
        touch = {};
      } else if (touch.x2 > 0) {
        Math.abs(touch.x1 - touch.x2) > 30 && $(touch.target).trigger('swipe') &&
          $(touch.target).trigger('swipe' + (touch.x1 - touch.x2 > 0 ? 'Left' : 'Right'));
        touch.x1 = touch.x2 = touch.last = 0;
      } else if ('last' in touch) {
        touchTimeout = setTimeout(function(){
          touchTimeout = null;
          $(touch.target).trigger('tap')
          touch = {};
        }, 250);
      }
    }).bind('touchcancel', function(){ touch = {} });
  });

  ['swipe', 'swipeLeft', 'swipeRight', 'doubleTap', 'tap'].forEach(function(m){
    $.fn[m] = function(callback){ return this.bind(m, callback) }
  });
})(Zepto);
(function($){
  var jsonpID = 0, r20 = /%20/g;

  function empty() {}
  function isArray(obj) {
    return obj && (obj instanceof Array || typeof obj == "array");
  }
  function urlEncodePair(key, value) {
    if (typeof value == 'function') value = value();
    return encodeURIComponent(key) + "=" + encodeURIComponent(value);
  }
  function urlEncode(array) {
    return array.reduce(function(params, pair) {
      params.push(urlEncodePair(pair.name, pair.value));
      return params;
    }, []).join('&').replace(r20, '+');
  }

  $.ajaxJSONP = function(options){
    var jsonpString;
    jsonpString = 'jsonp' + ++jsonpID;
    window[jsonpString] = function(data){
      options.success(data);
      delete window.jsonpString;
    };
    var script = document.createElement('script');
    $(script).attr({ src: options.url.replace(/=\?/, '=' + jsonpString) });
    $('head').append(script);
  };

  $.ajaxSettings = {
    type: 'GET',
    beforeSend: empty, success: empty, error: empty, complete: empty,
    accepts: {
      script: 'text/javascript, application/javascript',
      json:   'application/json',
      xml:    'application/xml, text/xml',
      html:   'text/html',
      text:   'text/plain'
    }
  };

  $.ajax = function(options){
    options = options || {};
    var settings = $.extend({}, options);
    for (key in $.ajaxSettings) if (!settings[key]) settings[key] = $.ajaxSettings[key];

    if (/=\?/.test(settings.url)) return $.ajaxJSONP(settings);

    if (!settings.url) settings.url = window.location.toString();

    var mime = settings.accepts[settings.dataType],
        xhr = new XMLHttpRequest();

    settings.headers = $.extend({'X-Requested-With': 'XMLHttpRequest'}, settings.headers || {});
    if (mime) settings.headers['Accept'] = mime;

    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        var result, error = false;
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 0) {
          if (mime == 'application/json') {
            try { result = JSON.parse(xhr.responseText); }
            catch (e) { error = e; }
          }
          else result = xhr.responseText;
          if (error) settings.error(xhr, 'parsererror', error);
          else settings.success(result, 'success', xhr);
        } else {
          error = true;
          settings.error(xhr, 'error');
        }
        settings.complete(xhr, error ? 'error' : 'success');
      }
    };

    xhr.open(settings.type, settings.url, true);
    if (settings.beforeSend(xhr, settings) === false) {
      xhr.abort();
      return false;
    }
    if (isArray(settings.data)) {
      settings.data = urlEncode(settings.data);
      if (!settings.contentType) settings.contentType = 'application/x-www-form-urlencoded';
    }
    else if (settings.data instanceof Object) {
      settings.data = JSON.stringify(settings.data);
      if (!settings.contentType) settings.contentType = 'application/json';
    }
    if (settings.contentType) settings.headers['Content-Type'] = settings.contentType;
    for (name in settings.headers) xhr.setRequestHeader(name, settings.headers[name]);
    xhr.send(settings.data);
  };

  $.get = function(url, success){ $.ajax({ url: url, success: success }) };
  $.post = function(url, data, success, dataType){
    if (data instanceof Function) dataType = dataType || success, success = data, data = null;
    $.ajax({ type: 'POST', url: url, data: data, success: success, dataType: dataType });
  };
  $.getJSON = function(url, success){ $.ajax({ url: url, success: success, dataType: 'json' }) };

  $.fn.load = function(url, success){
    if (!this.length) return this;
    var self = this, parts = url.split(/\s/), selector;
    if (parts.length > 1) url = parts[0], selector = parts[1];
    $.get(url, function(response){
      self.html(selector ?
        $(document.createElement('div')).html(response).find(selector).html()
        : response);
      success && success();
    });
    return this;
  };
})(Zepto);
(function($){
  var cache = [], timeout;

  $.fn.remove = function(){
    return this.each(function(){
      if(this.tagName == 'IMG'){
        cache.push(this);
        this.src = 'data:image/gif;base64,R0lGODlhAQABAAAAADs=';
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(function(){ cache = [] }, 60000);
      }
      this.parentNode.removeChild(this);
    });
  }
})(Zepto);
