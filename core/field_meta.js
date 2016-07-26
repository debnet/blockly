'use strict';

goog.provide('Blockly.FieldMeta');


goog.require('Blockly.Field');
goog.require('Blockly.Bubble');
goog.require('Blockly.Icon');
goog.require('goog.dom');
goog.require('goog.style');


Blockly.FieldMeta = function (obj, opt_validator) {
    //Blockly.FieldMeta.superClass_.constructor.call(this, '', opt_validator);
    this.size_ = new goog.math.Size(0, 0);
    this.setValue('');
    this.setMetas_ = obj;
};
goog.inherits(Blockly.FieldMeta, Blockly.Field);

/**
 * Cursor type.
 * @private
 */
Blockly.FieldMeta.prototype.CURSOR = "pointer";

/**
 * Width of bubble.
 * @private
 */
Blockly.FieldMeta.prototype.width_ = 160;

/**
 * Height of bubble.
 * @private
 */
Blockly.FieldMeta.prototype.height_ = 80;

/**
 * Icon size.
 * @private
 */
Blockly.FieldMeta.prototype.ICON_SIZE_ = 16;

/**
 * Absolute coordinate of icon's center.
 * @type {goog.math.Coordinate}
 * @private
 */
Blockly.FieldMeta.prototype.iconXY_ = null;

/**
 * Draw the cog icon.
 * @private
 */
Blockly.FieldMeta.prototype.drawIcon_ = function () {
    // Square with rounded corners.
    Blockly.createSvgElement('rect',
        {
            'class': 'blocklyFieldMetaShape',
            'rx': '4', 'ry': '4',
            'height': this.ICON_SIZE_, 'width': this.ICON_SIZE_
        },
        this.fieldGroup_);
    // Gear teeth.
    Blockly.createSvgElement('path',
        {
            'x': '4', 'y': '4',
            'class': 'blocklyFieldMetaSymbol',
            'd': 'M13.8,8.9V7.2H12c-0.1-0.5-0.3-1-0.6-1.5l1.3-1.2l-1.2-1.2l-1.3,1.2C9.8,4.2,9.3,4,8.8,3.9V2.1H7.1v1.8 C6.5,4,6,4.2,5.6,4.5L4.4,3.3L3.2,4.5l1.2,1.3C4.1,6.2,3.9,6.7,3.8,7.2H2v1.7h1.8c0.1,0.5,0.3,1,0.6,1.5l-1.2,1.2l1.2,1.2l1.3-1.3        c0.4,0.3,0.9,0.5,1.5,0.6v1.8h1.7v-1.8c0.5-0.1,1-0.3,1.5-0.6l1.2,1.3l1.2-1.2l-1.4-1.3c0.3-0.4,0.5-0.9,0.6-1.5h1.8V8.9z M5.3,8 c0-1.4,1.2-2.6,2.6-2.6s2.6,1.2,2.6,2.6c0,1.4-1.2,2.6-2.6,2.6S5.3,9.5,5.3,8z'
        },
        this.fieldGroup_);
};

/**
 * Install this field on a block.
 */
Blockly.FieldMeta.prototype.init = function () {
    if (this.fieldGroup_) {
        // Checkbox has already been initialized once.
        return;
    }
    this.fieldGroup_ = Blockly.createSvgElement('g', {
        'class': 'blocklyEditableField',
    }, null);
    this.drawIcon_();
    this.updateEditable();
    this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);
    this.mouseUpWrapper_ =
        Blockly.bindEvent_(this.fieldGroup_, 'mouseup', this, this.onMouseUp_);
};

Blockly.FieldMeta.prototype.updateEditable = function () {
    if (!this.EDITABLE || !this.sourceBlock_) {
        return;
    }
    if (this.sourceBlock_.isEditable()) {
        Blockly.addClass_(/** @type {!Element} */ (this.fieldGroup_),
            'blocklyEditableField');
        Blockly.removeClass_(/** @type {!Element} */ (this.fieldGroup_),
            'blocklyNoNEditableField');
        this.fieldGroup_.style.cursor = this.CURSOR;
    } else {
        Blockly.addClass_(/** @type {!Element} */ (this.fieldGroup_),
            'blocklyNonEditableField');
        Blockly.removeClass_(/** @type {!Element} */ (this.fieldGroup_),
            'blocklyEditableField');
        this.fieldGroup_.style.cursor = '';
    }
};


/**
 * Check to see if the contents of the editor validates.
 * Style the editor accordingly.
 * @private
 */
Blockly.FieldMeta.prototype.validate_ = function () {
    console.log('validate_')
};

Blockly.FieldMeta.prototype.isVisible = function () {
    return !!this.bubble_;
};

/**
 * Create the editor for the fiedlMeta's bubble.
 * @return {!Element} The top-level node of the editor.
 * @private
 */
Blockly.FieldMeta.prototype.createEditor_ = function () {
    /* Create the editor.  Here's the markup that will be generated:
      <foreignObject x="8" y="8" width="164" height="164">
        <body xmlns="http://www.w3.org/1999/xhtml" class="blocklyMinimalBody">

        </body>
      </foreignObject>
    */
    this.foreignObject_ = Blockly.createSvgElement('foreignObject',
        {'x': Blockly.Bubble.BORDER_WIDTH, 'y': Blockly.Bubble.BORDER_WIDTH},
        null);
    var body = document.createElementNS(Blockly.HTML_NS, 'body');
    body.setAttribute('xmlns', Blockly.HTML_NS);
    body.className = 'blocklyMinimalBody';
    return this.foreignObject_;
};

/**
 * Set the icon location
 * @private
 */
Blockly.FieldMeta.prototype.setIconLocation_ = function () {
    var blockXY = this.sourceBlock_.getRelativeToSurfaceXY();
    var iconXY = Blockly.getRelativeXY_(this.fieldGroup_);
    var newXY = new goog.math.Coordinate(
        blockXY.x + iconXY.x + this.ICON_SIZE_ / 2,
        blockXY.y + iconXY.y + this.ICON_SIZE_ / 2);
    this.iconXY_ = newXY;
};

/**
 * Show or hide the field bubble.
 * @param {boolean} visible True if the bubble should be visible.
 */
Blockly.FieldMeta.prototype.showEditor_ = function () {
    if (!this.isVisible()) {
        var blockXY = this.sourceBlock_.getRelativeToSurfaceXY();
        var iconXY = Blockly.getRelativeXY_(this.fieldGroup_);
        var newXY = new goog.math.Coordinate(
            blockXY.x + iconXY.x + this.ICON_SIZE_ / 2,
            blockXY.y + iconXY.y + this.ICON_SIZE_ / 2);

        this.bubble_ = new Blockly.Bubble(
            /** @type {!Blockly.WorkspaceSvg} */ (this.sourceBlock_.workspace),
            this.createEditor_(), this.sourceBlock_.svgPath_,
            newXY, this.width_, this.height_);
    } else {
        this.bubble_.dispose();
        this.bubble_ = null;
    }
};


Blockly.FieldMeta.prototype.dispose = function () {
    if (this.isVisible()) {
        this.bubble_.dispose();
    }
};
