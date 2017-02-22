'use strict';

goog.provide('Blockly.FieldMeta');


goog.require('Blockly.Field');
goog.require('Blockly.Icon');
goog.require('goog.dom');
goog.require('goog.style');


Blockly.FieldMeta = function (metas, opt, validator) {
    opt.addMeta = opt.addMeta !== undefined ? opt.addMeta : true;
    //required fields should at least exist to prevent undefined values
    for(var i=0; i < opt.required.length; ++i){
        if(!metas.hasOwnProperty(opt.required[i]))
            metas[opt.required[i]] = null;
    }
    this.options = opt;
    Blockly.FieldMeta.superClass_.constructor.call(this, metas, validator);
    this.size_ = new goog.math.Size(0, 0);
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
    Blockly.utils.createSvgElement('rect',
        {
            'class': 'blocklyIconShape',
            'rx': '4', 'ry': '4',
            'height': this.ICON_SIZE_, 'width': this.ICON_SIZE_
        },
        this.fieldGroup_);
    // Gear teeth.
    Blockly.utils.createSvgElement('path',
        {
            'x': '4', 'y': '4',
            'class': 'blocklyIconSymbol',
            'd': 'M13.8,8.9V7.2H12c-0.1-0.5-0.3-1-0.6-1.5l1.3-1.2l-1.2-1.2l-1.3,1.2C9.8,4.2,9.3,4,8.8,3.9V2.1H7.1v1.8 C6.5,4,6,4.2,5.6,4.5L4.4,3.3L3.2,4.5l1.2,1.3C4.1,6.2,3.9,6.7,3.8,7.2H2v1.7h1.8c0.1,0.5,0.3,1,0.6,1.5l-1.2,1.2l1.2,1.2l1.3-1.3        c0.4,0.3,0.9,0.5,1.5,0.6v1.8h1.7v-1.8c0.5-0.1,1-0.3,1.5-0.6l1.2,1.3l1.2-1.2l-1.4-1.3c0.3-0.4,0.5-0.9,0.6-1.5h1.8V8.9z M5.3,8 c0-1.4,1.2-2.6,2.6-2.6s2.6,1.2,2.6,2.6c0,1.4-1.2,2.6-2.6,2.6S5.3,9.5,5.3,8z'
        },
        this.fieldGroup_);
};

Blockly.FieldMeta.prototype.showLabel_ = function () {
    if (this.options.label) {
        this.setText(this.metas_[this.options.label]);
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
        // Metas has already been initialized once.
        return;
    }
    this.fieldGroup_ = Blockly.utils.createSvgElement('g', {
        'class': 'blocklyEditableField',
    }, null);
    if (!this.visible_) {
        this.fieldGroup_.style.display = 'none';
    }
    this.textElement_ = Blockly.utils.createSvgElement('text',
        {
            'x': '20', 'y': this.ICON_SIZE_ - 3.5,
            'class': 'blocklyText'
        },
        this.fieldGroup_);

    this.drawIcon_();
    this.updateEditable();
    this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);
    this.mouseUpWrapper_ =
        Blockly.bindEvent_(this.fieldGroup_, 'mouseup', this, this.onMouseUp_);
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
    var newMetas = {};
    var oldMetas = this.metas_;
    if (typeof metas === 'string')
        newMetas = JSON.parse(metas);
    else newMetas = metas;
    if (newMetas === oldMetas)
        return;
    if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
        Blockly.Events.fire(new Blockly.Events.Change(
            this.sourceBlock_, 'field', this.name, oldMetas, newMetas));
    }
    this.metas_ = newMetas;
    this.showLabel_();
};

Blockly.FieldMeta.prototype.getValue = function () {
    return JSON.stringify(this.metas_);
};

Blockly.FieldMeta.prototype.addFieldset_ = function (label, field, readOnly) {
    var fieldSet = goog.dom.createDom('fieldset');
    var labelField = goog.dom.createDom('input', 'blocklyInput');
    var value = goog.dom.createDom('input', 'blocklyInput');

    goog.dom.setProperties(labelField, {value: label});
    goog.dom.setProperties(value, {value: field});
    fieldSet.appendChild(labelField);
    fieldSet.appendChild(value);

    //We can delete a field not required
    if (!readOnly) {
        var minus = goog.dom.createDom('button', 'blocklyMinus');
        goog.dom.setTextContent(minus, '-');
        fieldSet.appendChild(minus);
        var thisField = this;
        goog.events.listen(minus,
            goog.events.EventType.CLICK,
            function (event) {
                goog.dom.removeNode(fieldSet);
                thisField.setModalMetrics_();
                //delete thisField.metas_[label.value];
            });
    }
    if(readOnly){//We can't change the label of a required field
        goog.dom.setProperties(labelField, {readOnly: true, tabIndex: '-1'});
    }
    if(this.options.readOnly){
        goog.dom.setProperties(value, {readOnly: true, tabIndex: '-1'});
    }
    this.form.appendChild(fieldSet);
};

/**
 * Create the editor for the fiedlMeta's modal.
 * @private
 */
Blockly.FieldMeta.prototype.createEditor_ = function () {

    var dragHandle = goog.dom.createDom('div', 'blocklyDragHandle');
    this.modalDiv.appendChild(dragHandle);
    //goog.events.listen(dragHandle, goog.events.EventType.DRAG, function (event) {
    //    event;
    //});

    var title = goog.dom.createDom('span', 'blocklyText');
    goog.dom.setProperties(title, {textContent: "Modification de " + this.sourceBlock_.type});
    dragHandle.appendChild(title);

    var close = goog.dom.createDom('a', 'blocklyCloseModal');
    goog.dom.setProperties(close, {textContent: "×"});
    goog.events.listen(close,
        goog.events.EventType.CLICK,
        function (event) {
            Blockly.FieldMeta.widgetDispose_();
        });
    dragHandle.appendChild(close);

    this.form = goog.dom.createDom('form');
    goog.dom.setProperties(this.form, {name: 'metas'});

    //show required fields first
    if (this.options.required) {
        for (var i = 0; i < this.options.required.length; ++i) {
            this.addFieldset_(this.options.required[i], this.metas_[this.options.required[i]] /*|| ""*/, true);
        }
    }

    //show metadatas
    for (var key in this.metas_) {
        //We don't show required field again
        if (!this.metas_.hasOwnProperty(key) || ~this.options.required.indexOf(key))
            continue;
        this.addFieldset_(key, this.metas_[key]);
    }
    this.modalDiv.appendChild(this.form);

    function confirmation(event) {
        if (event.type === goog.events.EventType.KEYDOWN && event.keyCode !== 13)
            return;
        var metas = {};
        var fields = thisField.form.getElementsByTagName('fieldset');
        for (var i = 0; i < fields.length; ++i) {
            metas[fields[i].children[0].value] = fields[i].children[1].value;
        }
        thisField.validator_ && thisField.validator_(metas);
        thisField.setValue(metas);
        Blockly.FieldMeta.widgetDispose_();
    }

    if (!this.options.readOnly) {
        var thisField = this;
        if (this.options.addMeta) {
            var plus = goog.dom.createDom('button', 'blocklyButton');
            goog.dom.setTextContent(plus, '+');

            goog.events.listen(plus,
                goog.events.EventType.CLICK,
                function (event) {
                    thisField.addFieldset_('default', 'default');
                    thisField.setModalMetrics_();
                });
            this.modalDiv.appendChild(plus);
        }

        var confirm = goog.dom.createDom('button', {class: 'blocklyButton', type: 'submit'});
        goog.dom.setTextContent(confirm, 'Valider');

        goog.events.listen(confirm, goog.events.EventType.CLICK, confirmation);
        goog.events.listen(this.modalDiv, goog.events.EventType.KEYDOWN, confirmation);
        this.modalDiv.appendChild(confirm);
    }
};

/**
 * Show or hide the field widgetDiv.
 */
Blockly.FieldMeta.prototype.showEditor_ = function () {
    Blockly.WidgetDiv.show(this, this.sourceBlock_.RTL,
        Blockly.FieldMeta.widgetDispose_);

    var div = goog.dom.createDom('DIV');
    Blockly.WidgetDiv.DIV.appendChild(div);
    this.modalDiv = goog.dom.createDom('DIV', 'blocklyMetaModal');

    //Create an overlay on the workspace
    var svg = this.sourceBlock_.workspace.getParentSvg();
    var svgPosition = goog.style.getPageOffset(svg);
    var svgSize = Blockly.svgSize(svg);
    var scrollOffset = goog.style.getViewportPageOffset(document);

    Blockly.WidgetDiv.position(svgPosition.x, svgPosition.y, svgSize, scrollOffset,
        this.sourceBlock_.RTL);

    div.style.height = svgSize.height + "px";
    div.style.width = svgSize.width + "px";
    div.style.backgroundColor = 'rgba(205, 205, 205, 0.5)';
    Blockly.WidgetDiv.DIV.style.backgroundColor = 'rgba(0, 0, 0, 0)';

    div.appendChild(this.modalDiv);
    this.createEditor_();
    this.setModalMetrics_();

    var thisField = this;
    // Configure event handler. Backdrop
    Blockly.FieldMeta.changeEventKey_ = goog.events.listen(div,
        goog.events.EventType.CLICK,
        function (event) {
            if (event.target === thisField.modalDiv.parentElement) {
                Blockly.FieldMeta.widgetDispose_();
                thisField.modalDiv = null;
                return;
            }
        });
};

//TODO delete this method and add a draggable
/**
 * Set the modal location
 * @private
 */
Blockly.FieldMeta.prototype.setModalMetrics_ = function () {
    this.modalDiv.style.top = '40%';
    this.modalDiv.style.left = '50%';
    this.modalDiv.style.transform = 'translate(-50%,-50%)';
};

Blockly.FieldMeta.prototype.dispose = function () {
    Blockly.FieldMeta.superClass_.dispose.call(this);
    this.modalDiv = null;
    this.form = null;
};

/**
 * Hide the overlay meta.
 * @private
 */
Blockly.FieldMeta.widgetDispose_ = function () {
    if (Blockly.FieldMeta.changeEventKey_) {
        goog.events.unlistenByKey(Blockly.FieldMeta.changeEventKey_);
    }

    Blockly.WidgetDiv.hide();
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
    '}',

    '.blocklyWidgetDiv .blocklyMetaModal{',
    '   position : absolute;',
    '   padding : 14px;',
    '   transform : translate(-50%,-50%);',
    '   background-color : rgba(140, 140, 140, 0.9);',
    '   box-shadow : 5px 5px 5px rgba(140, 140, 140, 0.7);',
    '   border-radius : 10px;',
    '}',

    '.blocklyWidgetDiv .blocklyMetaModal .blocklyButton{',
    '   float : right;',
    '}',

    '.blocklyWidgetDiv .blocklyMetaModal .blocklyCloseModal{',
    '   float : right;',
    '}',
];
