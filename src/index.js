var Hammer = require("hammerjs");
var HandtrackTouch = require("./jammer");
var reqAnimationFrame = (function() {
  return (
    window[Hammer.prefixed(window, "requestAnimationFrame")] ||
    function(callback) {
      setTimeout(callback, 1000 / 60);
    }
  );
})();

function dirProp(direction, hProp, vProp) {
  return direction & Hammer.DIRECTION_HORIZONTAL ? hProp : vProp;
}

/**
 * Carousel
 * @param container
 * @param direction
 * @constructor
 */
function HammerCarousel(container, direction) {
  this.container = container;
  this.direction = direction;

  this.panes = Array.prototype.slice.call(this.container.children, 0);
  this.containerSize = this.container[
    dirProp(direction, "offsetWidth", "offsetHeight")
  ];

  this.currentIndex = 0;

  this.hammer = new Hammer.Manager(this.container, {
    inputClass: Hammer.TouchInput
  });
  this.hammer.add(new Hammer.Pan({ direction: this.direction, threshold: 1 }));
  this.hammer.on(
    "panstart panmove panend pancancel",
    Hammer.bindFn(this.onPan, this)
  );

  this.show(this.currentIndex);
  console.log('Number of panes:', this.panes.length);
console.log('Container size:', this.containerSize);

}

HammerCarousel.prototype = {
  /**
   * show a pane
   * @param {Number} showIndex
   * @param {Number} [percent] percentage visible
   * @param {Boolean} [animate]
   */
  show: function(showIndex, percent, animate) {
    showIndex = Math.max(0, Math.min(showIndex, this.panes.length - 1));
    percent = percent || 0;

    var className = this.container.className;
    if (animate) {
      if (className.indexOf("animate") === -1) {
        this.container.className += " animate";
      }
    } else {
      if (className.indexOf("animate") !== -1) {
        this.container.className = className.replace("animate", "").trim();
      }
    }

    var paneIndex, pos, translate;
    for (paneIndex = 0; paneIndex < this.panes.length; paneIndex++) {
      pos =
        (this.containerSize / 100) * ((paneIndex - showIndex) * 100 + percent);
      if (this.direction & Hammer.DIRECTION_HORIZONTAL) {
        translate = "translate3d(" + pos + "px, 0, 0)";
      } else {
        translate = "translate3d(0, " + pos + "px, 0)";
      }
      this.panes[paneIndex].style.transform = translate;
      this.panes[paneIndex].style.mozTransform = translate;
      this.panes[paneIndex].style.webkitTransform = translate;
    }

    this.currentIndex = showIndex;
  },

  /**
   * handle pan
   * @param {Object} ev
   */
  onPan: function(ev) {
    var delta = dirProp(this.direction, ev.deltaX, ev.deltaY);
    var percent = (100 / this.containerSize) * delta;
    var animate = false;

    if (ev.type == "panend" || ev.type == "pancancel") {
      if (Math.abs(percent) > 20 && ev.type == "panend") {
        this.currentIndex += percent < 0 ? 1 : -1;
      }
      percent = 0;
      animate = true;
    }

    this.show(this.currentIndex, percent, animate);
  }
};

// the horizontal pane scroller
var outer = new HammerCarousel(
  document.querySelector(".panes.wrapper"),
  Hammer.DIRECTION_HORIZONTAL
);

// each pane should contain a vertical pane scroller
Hammer.each(document.querySelectorAll(".pane .panes"), function(container) {
  // setup the inner scroller
  var inner = new HammerCarousel(container, Hammer.DIRECTION_VERTICAL);

  // only recognize the inner pan when the outer is failing.
  // they both have a threshold of some px
  outer.hammer.get("pan").requireFailure(inner.hammer.get("pan"));
});

var video = document
  .getElementById("handtrackjs")
  .getElementsByTagName("video")[0];
video.width = 320;
video.height = 240;
var canvas = document
  .getElementById("handtrackjs")
  .getElementsByTagName("canvas")[0];
const context = canvas.getContext("2d");

var options = {
  transform: function(prediction, video, target) {
    return {
      x: ((prediction.bbox[0] + 0.5 * prediction.bbox[2]) / video.width) * 1920,
      y:
        ((prediction.bbox[1] + 0.5 * prediction.bbox[3]) / video.height) * 1200,
      target: target
    };
  }
};
HandtrackTouch.start(outer.container, video, canvas, options);

  