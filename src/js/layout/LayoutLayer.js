Ext.ns('Ix.layout');

Ix.layout.LayoutLayer = Ext.extend(Ext.Container, {
  //#region properties
  selectedColor: '#333',
  defaultColor: '#99bbe8',
  //#endregion

  //#region lifecycle
  constructor: function (cfg) {
    var me = this;

    if (cfg.split) {
      cfg.layout = (cfg.split === 'horizontal') ? 'vbox' : 'hbox';
      cfg.layoutConfig = {
        align: 'stretch'
      };
    }

    Ix.layout.LayoutLayer.superclass.constructor.call(me, cfg);
  },

  initComponent: function () {
    var me = this;

    Ix.layout.LayoutLayer.superclass.initComponent.call(me);
  },

  beforeDestroy: function() {
    var me = this;

    Ext.destroy(
      me.selectedColor,
      me.defaultColor
    );

    Ix.layout.LayoutLayer.superclass.beforeDestroy.call(me);
  },
  //#endregion

  //#region methods
  showOutline: function (show) {
    var me = this,
      el = me.el,
      label = me._label,
      border = '0 none';

    if (show) {
      border = '1px solid #99bbe8';
      label.show();
    } else {
      label.hide();
    }

    el.setStyle('border', border);

    me.syncSize();
  },

  select: function () {
    this.setSelection(true);
  },

  unselect: function() {
    this.setSelection(false);
  },

  /**
   * @private
   */
  setSelection: function(select) {
    var me = this,
      color = (select) ? me.selectedColor : me.defaultColor,
      font = (select) ? '#fff' : '#000',
      el = me.el,
      label = me._label;

    label.setStyle('background-color', color);
    label.setStyle('color', font);
    el.setStyle('border-color', color);
  },

  sendToFront: function () {
    var me = this;

    // show outline
    me.showOutline(true);

    // hide children?
    // ...
  },

  sendToBack: function () {
    var me = this;

    // hide outline
    me.showOutline(false);

    // show children?
    // ...
  },

  onRender: function(ct, position) {
    var me = this,
      el = null,
      labelDom = null,
      cfg = me.initialConfig;

    Ix.layout.LayoutLayer.superclass.onRender.call(me, ct, position);

    el = me.el;
    labelDom = Ext.DomHelper.append(el, {
      tag: 'div',
      html: cfg.text,
      style: 'position:absolute;top:0;left:0;background:#99bbe8;color:#000;padding:2px;'
    });
    me._label = Ext.get(labelDom);

    el.setStyle('border', '1px solid #99bbe8');
  }
  //#endregion

  //#region event handlers
  //#endregion
});
