'use strict';

goog.provide('Blockly.Search');

goog.require('Blockly.Icon');
goog.require('goog.dom');
goog.require('goog.style');


Blockly.Search = function (workspace) {
  this.workspace_ = workspace;

  /**
   * Is RTL vs LTR.
   * @type {boolean}
   */
  this.RTL = workspace.options.RTL;

  /**
   * Whether the toolbox will be laid out horizontally.
   * @type {boolean}
   * @private
   */
  this.horizontalLayout_ = workspace.options.horizontalLayout;

  /**
   * Position of the toolbox and flyout relative to the workspace.
   * @type {number}
   */
  this.toolboxPosition = workspace.options.toolboxPosition;

  this.matchingBlocks_ = [];
};

Blockly.Search.prototype.highlightedBlock_ = null;

Blockly.Search.prototype.UP = true;

Blockly.Search.prototype.DOWN = false;

Blockly.Search.prototype.init = function () {
  var workspace = this.workspace_;
  var svg = this.workspace_.getParentSvg();

  /**
   * HTML container for the search menu.
   * @type {Element}
   */
  this.HtmlDiv =
    goog.dom.createDom(goog.dom.TagName.DIV, 'blocklySearchDiv');
  this.HtmlDiv.setAttribute('dir', workspace.RTL ? 'RTL' : 'LTR');
  svg.parentNode.insertBefore(this.HtmlDiv, svg);
  this.HtmlDiv.style.minWidth = '10px';

  /**
   * HTML input of search menu.
   * @type {Element}
   */
  this.searchInput_ = goog.dom.createDom(goog.dom.TagName.INPUT, 'blocklySearchInput');
  this.HtmlDiv.appendChild(this.searchInput_);

  /**
   * HTML results.
   * @type {Element}
   */
  this.searchResult_ = goog.dom.createDom(goog.dom.TagName.SPAN, 'blocklySearchResult');
  this.HtmlDiv.appendChild(this.searchResult_);

  /**
   * HTML previous.
   * @type {Element}
   */
  var previousButton = goog.dom.createDom(goog.dom.TagName.BUTTON, 'blocklyPreviousButton', '˄');
  this.HtmlDiv.appendChild(previousButton);

  /**
   * HTML next.
   * @type {Element}
   */
  var nextButton = goog.dom.createDom(goog.dom.TagName.BUTTON, 'blocklyNextButton', '˅');
  this.HtmlDiv.appendChild(nextButton);

  // input on search will  start a search action.
  Blockly.bindEventWithChecks_(this.HtmlDiv, 'input', this,
    function (e) {
      e.stopPropagation();
      this.startSearch();
    });

  Blockly.bindEventWithChecks_(previousButton, 'click', this,
    function (e) {
      this.nextBlock_(this.UP);
    });

  Blockly.bindEventWithChecks_(nextButton, 'click', this,
    function (e) {
      this.nextBlock_(this.DOWN);
    });

  this.position();
};

/**
 * Move the toolbox to the edge.
 */
Blockly.Search.prototype.position = function () {
  var treeDiv = this.HtmlDiv;
  if (!treeDiv) {
    // Not initialized yet.
    return;
  }

  treeDiv.style.zIndex = 70;
  treeDiv.style.position = 'absolute';
  treeDiv.style.height = 'auto';

  if (this.horizontalLayout_) {
    treeDiv.style.right = '20 px';
    treeDiv.style.width = 'auto';
    this.height = treeDiv.offsetHeight;
    if (this.toolboxPosition == Blockly.TOOLBOX_AT_TOP) {  // Top
      treeDiv.style.top = (workspace.toolboxHeight + 10) + 'px';
    } else {  // Bottom
      treeDiv.style.top = '0';
    }
  } else {
    if (this.toolboxPosition == Blockly.TOOLBOX_AT_RIGHT) {  // Right
      treeDiv.style.left = '20px';
    } else {  // Left
      treeDiv.style.right = '20px';
    }
    this.width = treeDiv.offsetWidth;
  }
};

Blockly.Search.prototype.setSearchFunction = function (searchFunction) {
  if (!goog.isFunction(searchFunction)) {
    throw "Search callback should be a function.";
  }
  this.searchFunction_ = searchFunction;
};

Blockly.Search.prototype.updateResult = function () {
  var message = this.searchInput_.value;
  if (message) {
    this.searchResult_.innerHTML = Math.abs(~this.matchingBlocks_.indexOf(Blockly.selected)) + '/' + this.matchingBlocks_.length;
  } else this.searchResult_.innerHTML = '';
};

Blockly.Search.prototype.searchFunction_ = function (block, message) {
  return block === message;
};

Blockly.Search.prototype.startSearch = function () {
  var message = this.searchInput_.value;
  var blocks = this.workspace_.getAllBlocks();
  this.matchingBlocks_ = [];

  var that = this;
  blocks.map(function (elem) {
    if (!message) {
      that.removeMatchSearch(elem);
    } else {
      elem.search = that.searchFunction_(elem, message);
      if (elem.search) {
        that.matchingBlocks_.push(elem);
        that.addMatchSearch(elem);
      } else that.removeMatchSearch(elem);
    }
  });
  this.nextBlock_(this.DOWN, true);
};

Blockly.Search.prototype.nextBlock_ = function (direction, search) {
  //We dont do anything if there is no match
  if (this.matchingBlocks_.length) {
    var selected = Blockly.selected;
    // If there is no block selected we get the first matching block
    // Or last in case we go UP
    if (!selected) {
      this.matchingBlocks_[direction === this.DOWN ? 0 : (this.matchingBlocks_.length - 1)].select();
    } else {
      // get blocks
      var blocks = this.workspace_.getAllBlocks();
      // Reverse them if we go UP
      if (direction === this.UP) blocks.reverse();
      // We offsets the blocks to make the search for next block easier
      var start = search ? blocks.indexOf(selected) : blocks.indexOf(selected) + 1;
      var startBlocks = blocks.splice(0, start);
      var tmpBlocks = blocks.concat(startBlocks);
      // find block and select it
      for (var i = 0; i < tmpBlocks.length; ++i) {
        if (tmpBlocks[i].search) {
          tmpBlocks[i].select();
          this.workspace_.centerViewOnBlock(tmpBlocks[i]);
          break;
        }
      }
    }
  }
  this.updateResult();
};

/**
 * Dispose of this Search Input.
 */
Blockly.Search.prototype.dispose = function () {
  goog.dom.removeNode(this.HtmlDiv);
  this.workspace_ = null;
};

/**
 * Highlight a block.  Highlight it visually.
 */
Blockly.Search.prototype.addMatchSearch = function (block) {
  Blockly.utils.addClass(/** @type {!Element} */ (block.svgGroup_),
    'blocklyMatchSearch');
};

/**
 * Highlight a block.  Remove its highlighting.
 */
Blockly.Search.prototype.removeMatchSearch = function (block) {
  Blockly.utils.removeClass(/** @type {!Element} */ (block.svgGroup_),
    'blocklyMatchSearch');
};

Blockly.Search.CSS = [
  '.blocklyMatchSearch > .blocklyPath {',
  'stroke: #BDB720;',
  'stroke-width: 3px;',
  '}',
  '.blocklyMatchSearch > .blocklyPathLight {',
  'display: none',
  '}',
  '.blocklySearchDiv {',
  'margin-top: 10px;',
  'border: 1px solid #ccc;',
  'padding: 3px;',
  'background-color: white;',
  'border-radius : 3px;',
  'height: 15px;',
  '}',
  '.blocklySearchDiv .blocklySearchInput {',
  'border: 0 none transparent;',
  'outline: none;',
  '}',
  '.blocklySearchDiv .blocklySearchResult {',
  'display: inline-block;',
  'height: 22px;',
  'min-width: 14px;',
  'padding-right:5px;',
  'margin-right: 5px;',
  'border-right: 1px solid #cdcdcd;',
  '}',
  '.blocklyPreviousButton, .blocklyNextButton {',
  'border: none;',
  'background-color: white;',
  'outline: none;',
  '}',
  '.blocklyPreviousButton:hover, .blocklyNextButton:hover{',
  'background-color: #ccc;',
  '}'
];
