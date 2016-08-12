'use strict';

goog.provide('Blockly.FieldMeta');


goog.require('Blockly.Field');
goog.require('Blockly.Bubble');
goog.require('Blockly.Icon');
goog.require('goog.dom');
goog.require('goog.style');


Blockly.FieldMeta = function (metas, opt_validator) {
    //Blockly.FieldMeta.superClass_.constructor.call(this, '', opt_validator);
    this.size_ = new goog.math.Size(0, 0);
    this.setValue(metas);
    this.options = opt_validator;
};
goog.inherits(Blockly.FieldMeta, Blockly.Field);

/**
 * Cursor type.
 * @private
 */
Blockly.FieldMeta.prototype.CURSOR = "pointer";

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

Blockly.FieldMeta.prototype.showLabel_ = function () {
    if (this.options.label) {
        if (!this.textElement_) {
            this.textElement_ = Blockly.createSvgElement('text',
                {
                    'x': '20', 'y': this.ICON_SIZE_ - 3.5,
                    'class': 'blocklyText'
                },
                this.fieldGroup_);
        }
        this.setText(this.metas_[this.options.label]);
        this.updateTextNode_();
    }
};

/**
 * Compute the width form the label length and the icon size.
 * @returns {goog.math.Size|*}
 */
Blockly.FieldMeta.prototype.getSize = function () {
    Blockly.FieldMeta.superClass_.getSize.call(this);
    var widthText = 0;
    if (this.textElement_) {
        try {
            widthText = this.textElement_.getComputedTextLength();
        } catch (e) {
            // MSIE 11 is known to throw "Unexpected call to method or property
            // access." if Blockly is hidden.
            widthText = this.textElement_.textContent.length * 8;
        }
    }
    this.size_.width = widthText + this.ICON_SIZE_;
    return this.size_;
};

/**
 * Install this field on a block.
 */
Blockly.FieldMeta.prototype.init = function () {
    //Blockly.FieldMeta.superClass_.init.call(this);
    if (this.fieldGroup_) {
        // Checkbox has already been initialized once.
        return;
    }
    this.fieldGroup_ = Blockly.createSvgElement('g', {
        'class': 'blocklyEditableField',
    }, null);
    if (!this.visible_) {
        this.fieldGroup_.style.display = 'none';
    }

    this.drawIcon_();
    this.showLabel_();
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
    console.log('validate_');
};

Blockly.FieldMeta.prototype.isVisible = function () {
    return !!this.modalDiv;
};

Blockly.FieldMeta.prototype.setValue = function (metas) {
    if (typeof metas === 'string')
        this.metas_ = JSON.parse(metas);
    else this.metas_ = metas;
};

Blockly.FieldMeta.prototype.getValue = function () {
    return JSON.stringify(this.metas_);
};

/**
 * Create the editor for the fiedlMeta's modal.
 * @private
 */
Blockly.FieldMeta.prototype.createEditor_ = function () {
    /* Create the editor.  Here's the markup that will be generated:
      <foreignObject x="8" y="8" width="164" height="164">
        <body xmlns="http://www.w3.org/1999/xhtml" class="blocklyMinimalBody">
        </body>
      </foreignObject>
    */
    var title = goog.dom.createDom('p', 'blocklyText');
    goog.dom.setProperties(title, {textContent: "Modification de " + this.sourceBlock_.type});

    var close = goog.dom.createDom('a', 'blocklyCloseModal');
    goog.dom.setProperties(close, {textContent: "×"});

    this.modalDiv.appendChild(title);
    this.modalDiv.appendChild(close);

    for (var key in this.metas_) {
        var label = goog.dom.createDom('p', 'blocklyText');
        var truc = goog.dom.createDom('input', 'blocklyInput');

        goog.dom.setProperties(label, {textContent: key});
        goog.dom.setProperties(truc, {value: this.metas_[key]});
        this.modalDiv.appendChild(label);
        this.modalDiv.appendChild(truc);
    }

};

/**
 * Show or hide the field bubble.
 * @param {boolean} visible True if the bubble should be visible.
 */
Blockly.FieldMeta.prototype.showEditor_ = function () {
    Blockly.WidgetDiv.show(this, this.sourceBlock_.RTL,
        Blockly.FieldMeta.widgetDispose_);

    var div = Blockly.WidgetDiv.DIV;
    this.modalDiv = goog.dom.createDom('DIV', 'blocklyMetaModal');
    this.setModalMetrics_();

    //Create an overlay on the workspace
    var svg = this.sourceBlock_.workspace.getParentSvg();
    var svgPosition = goog.style.getPageOffset(svg);
    var svgSize = Blockly.svgSize(svg);
    var scrollOffset = goog.style.getViewportPageOffset(document);

    Blockly.WidgetDiv.position(svgPosition.x, svgPosition.y, svgSize, scrollOffset,
        this.sourceBlock_.RTL);
    Blockly.WidgetDiv.DIV.style.height = svgSize.height;
    Blockly.WidgetDiv.DIV.style.width = svgSize.width;

    Blockly.WidgetDiv.DIV.style.backgroundColor = 'rgba(205, 205, 205, 0.5)';

    div.appendChild(this.modalDiv);
    this.createEditor_();

    var that = this;
    // Configure event handler.
    Blockly.FieldMeta.changeEventKey_ = goog.events.listen(div,
        goog.events.EventType.CLICK,
        function (event) {
            if (event.target === Blockly.WidgetDiv.DIV) {
                that.widgetDispose_();
                return;
            }
        });
};

/**
 * Set the modal location
 * @private
 */
Blockly.FieldMeta.prototype.setModalMetrics_ = function () {

    this.modalDiv.style.position = 'absolute';
    this.modalDiv.style.top = '40%';
    this.modalDiv.style.left = '50%';
    this.modalDiv.style.width = '200px';
    this.modalDiv.style.height = '200px';
    this.modalDiv.style.transform = 'translate(-50%,-50%)';
    this.modalDiv.style.backgroundColor = 'rgba(140, 140, 140, 0.9)';
    this.modalDiv.style.boxShadow = 'rgba(140, 140, 140, 0.9)';
};

Blockly.FieldMeta.prototype.dispose = function () {
    Blockly.FieldMeta.superClass_.getSize.call(this);
    this.widgetDispose_();
};

/**
 * Hide the overlay meta.
 * @private
 */
Blockly.FieldMeta.widgetDispose_ = function () {
    if (Blockly.FieldMeta.changeEventKey_) {
        goog.events.unlistenByKey(Blockly.FieldMeta.changeEventKey_);
    }
    Blockly.WidgetDiv.hideIfOwner(this);
    this.modalDiv = null;
};


/**
 * CSS for date picker.  See css.js for use.
 */
Blockly.FieldMeta.CSS = [
  /* Copied from: goog/css/datepicker.css */
  /**
   * Copyright 2009 The Closure Library Authors. All Rights Reserved.
   *
   * Use of this source code is governed by the Apache License, Version 2.0.
   * See the COPYING file for details.
   */


  '.blocklyWidgetDiv {',
  '  background: #9ab;',
  '  font-weight: bold !important;',
  '  border-color: #246 #9bd #9bd #246;',
  '  background-color: #fff;',
  '}'
];
