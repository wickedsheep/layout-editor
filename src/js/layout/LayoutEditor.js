Ext.ns('Ix.layout');

Ix.layout.LayoutEditor = Ext.extend(Ext.Window, {
  //#region properties
  title: 'Layout Editor',
  width: 640,
  height: 300,
  //draggable: false,
  //resizable: false,
  modal: true,
  //closeAction: 'hide',
  closable: false,
  layout: 'border',
  border: false,
  _menu: null,
  _rootNode: null,
  _selNode: null,
  _cnt: null,
  _data: null,
  //#endregion

  //#region lifecycle
  constructor: function (cfg) {
    var me = this;

    Ix.layout.LayoutEditor.superclass.constructor.call(me, cfg);
  },

  initComponent: function () {
    var me = this;

    me._menu = new Ext.menu.Menu({
      items: [
        {
          text: 'Split Horizontal',
          ref: 'SplitHorizontal',
          iconCls: 'icn_ui-split-panel-vertical',
          handler: me.onSplitHorizontalClick.createDelegate(me)
        },
        {
          text: 'Split Vertical',
          ref: 'SplitVertical',
          iconCls: 'icn_ui-split-panel',
          handler: me.onSplitVerticalClick.createDelegate(me)
        },
        '-',
        {
          text: 'Add Flex',
          ref: 'FlexAdd',
          iconCls: 'icn_plus',
          handler: me.onFlexAddClick.createDelegate(me)
        },
        {
          text: 'Remove Flex',
          ref: 'FlexRemove',
          iconCls: 'icn_minus',
          handler: me.onFlexRemoveClick.createDelegate(me)
        },
        '-',
        {
          text: 'Add Layer',
          ref: 'Add',
          iconCls: 'icn_layer--plus',
          handler: me.onAddClick.createDelegate(me)
        },
        {
          text: 'Remove Layer',
          ref: 'Remove',
          iconCls: 'icn_layer--minus',
          handler: me.onRemoveClick.createDelegate(me)
        }
      ]
    });

    me._rootNode = new Ext.tree.TreeNode({
      id: -1,
      text: 'Root',
      leaf: true
    });

    me.items = [
      {
        xtype: 'container',
        region: 'center',
        layout: 'border',
        items: [
          new Ix.layout.LayoutList({
            xtype: 'panel',
            title: 'Layouts',
            ref: '../Layouts',
            region: 'west',
            width: 175,
            listeners: {
              select: me.onLayoutSelect.createDelegate(me),
              deselect: me.onLayoutDeselect.createDelegate(me)
            }
          }),
          {
            xtype: 'panel',
            title: 'Preview',
            ref: '../Canvas',
            region: 'center',
            margins: '0 4px',
            padding: '4px',
            layout: 'fit'
          },
          {
            xtype: 'container',
            region: 'east',
            width: 175,
            layout: 'vbox',
            layoutConfig: {
              align: 'stretch'
            },
            items: [
              {
                xtype: 'treepanel',
                title: 'Layers',
                ref: '../../Layers',
                rootVisible: false,
                root: me._rootNode,
                flex: 3
              },
              {
                xtype: 'propertygrid',
                title: 'Properties',
                ref: '../../Properties',
                margins: '4px 0 0 0',
                flex: 2,
                enableHdMenu: false,
                stripeRows: true,
                trackMouseOver: false,
                listeners: {
                  beforeedit: me.onBeforeEdit.createDelegate(me),
                  propertychange: me.onEdit.createDelegate(me)
                }
              }
            ]
          }
        ]
      }
    ];

    me.buttons = [
      {
        xtype: 'button',
        text: '5 mins of fame',
        iconCls: 'icn_bug',
        handler: me.onFame.createDelegate(me)
      },
      {
        xtype: 'button',
        text: 'Save',
        disabled: true,
        ref: '../Save',
        iconCls: 'icn_disk',
        handler: me.onSaveClick.createDelegate(me)
      }
    ];

    Ix.layout.LayoutEditor.superclass.initComponent.call(me);
  },

  beforeDestroy: function () {
    var me = this;

    Ext.destroy(
      me._menu,
      me._rootNode,
      me._selNode,
      me._cnt,
      me._data
    );

    Ix.layout.LayoutEditor.superclass.beforeDestroy.call(me);
  },
  //#endregion

  //#region methods
  setData: function (data) {
    var me = this;

    // clear
    me._data = null;
    me._cnt = 0;
    me._selNode = null;
    while (me._rootNode.firstChild)
      me._rootNode.removeChild(me._rootNode.firstChild);
    me.Canvas.removeAll();

    if (!data || !Ext.isDefined(data.items))
      return;

    // build
    for (var i = 0; i < data.items.length; ++i)
      me.buildLayoutFn(data.items[i]);

    me.Canvas.doLayout();
    me._data = data;
  },

  getData: function () {
    return {
      name: this._data.name,
      items: [
        this._rootNode.firstChild.attributes._settings
      ]
    };
  },

  /**
   * @private
   */
  buildLayoutFn: function (item, cfg) {
    var me = this;

    // defaults
    if (!Ext.isDefined(cfg)) cfg = {};
    Ext.applyIf(cfg, {
      ptrTree: me._rootNode,
      ptrCanvas: me.Canvas
    });

    // auto-gen id if !exists
    item._id = (Ext.isDefined(item._id)) ? item._id : ++me._cnt;
    if (item._id > me._cnt)
      me._cnt = item._id;

    // auto-gen name if !exists
    item.text = (Ext.isDefined(item.text)) ? item.text : 'Layer ' + item._id;

    // create canvas panel
    var pnlCfg = {text: item.text};
    if (item.split) pnlCfg.split = item.split;
    if (item.flex) pnlCfg.flex = item.flex;

    var nodeCanvas = new Ix.layout.LayoutLayer(pnlCfg);
    cfg.ptrCanvas.add(nodeCanvas);
    cfg.ptrCanvas.doLayout();

    // hide parent panel, except if first
    if (me._cnt > 1)
      cfg.ptrCanvas.sendToBack();

    // create tree node
    cfg.ptrTree.leaf = false;
    var nodeTree = cfg.ptrTree.appendChild({
      _settings: item,
      _pnl: nodeCanvas,
      id: item._id,
      text: item.text,
      leaf: true,
      expanded: true,
      listeners: {
        click: me.onNodeClick.createDelegate(me),
        contextmenu: me.onContextMenuClick.createDelegate(me)
      }
    });

    // traverse
    if (!item.items)
      return;

    for (var i = 0; i < item.items.length; ++i) {
      cfg.ptrTree = nodeTree;
      cfg.ptrCanvas = nodeCanvas;
      this.buildLayoutFn(item.items[i], cfg);
    }
  },

  selectNode: function (node) {
    var me = this;

    if (me._selNode !== null)
      me._selNode.attributes._pnl.unselect();

    node.select();
    node.attributes._pnl.select();
    me._selNode = node;

    me.Properties.setSource(node.attributes._settings);
  },

  getNode: function (id) {
    return this.Layers.getNodeById(id);
  },

  /**
   * Flex (stretch or shrink) the item.
   * @param {object} node Layer.
   * @param {string} mode 'add' or 'remove'.
   */
  flexItem: function (node, mode) {
    var me = this,
      cfg = node.attributes._settings;

    switch (mode) {
      case 'add':
        cfg.flex++;
        break;
      case 'remove':
        cfg.flex--;
        break;
    }

    if (cfg.flex < 1)
      cfg.flex = 1;

    var data = me.getData();
    me.setData(data);

    // keep selection
    var n = me.getNode(node.id);
    me.selectNode(n);
  },

  /**
   * Split the item horizontally or vertically.
   * @param {object} node Layer.
   * @param {string} mode 'horizontal' or 'vertical'.
   */
  splitItem: function (node, mode) {
    var me = this;

    switch (mode) {
      case 'horizontal':
      case 'vertical':
        node.attributes._settings.split = mode;
        node.attributes._settings.items = [
          { _id: ++me._cnt, flex: 1 },
          { _id: ++me._cnt, flex: 1 }
        ];
        break;
    }

    var data = me.getData();
    me.setData(data);

    // keep selection
    var n = me.getNode(node.id);
    me.selectNode(n);
  },

  addItem: function(node) {
    var me = this;

    node.attributes._settings.items.push({
      _id: ++me._cnt,
      flex: 1
    });

    var data = me.getData();
    me.setData(data);

    // keep selection
    var n = me.getNode(node.id);
    me.selectNode(n);
  },

  removeItem: function (node) {
    var me = this,
      items;

    items = node.parentNode.attributes._settings.items;
    items.remove(node.attributes._settings);

    var data = me.getData();
    me.setData(data);

    me.Properties.setSource({});
  },
  //#endregion

  //#region event handlers
  onNodeClick: function (node) {
    this.selectNode(node);
  },

  onContextMenuClick: function (node, e) {
    var me = this,
      menu = me._menu;

    e.preventDefault();
    e.stopPropagation();

    me.selectNode(node);
    menu.showAt(e.getXY());

    // defaults
    menu.SplitHorizontal.enable();
    menu.SplitVertical.enable();
    menu.FlexAdd.enable();
    menu.FlexRemove.enable();
    menu.Add.enable();
    menu.Remove.enable();

    // root ops
    if (node.id === 1) {
      menu.FlexAdd.disable();
      menu.FlexRemove.disable();
      menu.Remove.disable();
    }

    // leaf ops
    if (node.leaf)
      menu.Add.disable();
    else
    {
      menu.SplitHorizontal.disable();
      menu.SplitVertical.disable();
    }

    return false;
  },

  onSplitHorizontalClick: function () {
    this.splitItem(this._selNode, 'horizontal');
  },

  onSplitVerticalClick: function () {
    this.splitItem(this._selNode, 'vertical');
  },

  onFlexAddClick: function () {
    this.flexItem(this._selNode, 'add');
  },

  onFlexRemoveClick: function () {
    this.flexItem(this._selNode, 'remove');
  },

  onAddClick: function () {
    this.addItem(this._selNode);
  },

  onRemoveClick: function () {
    this.removeItem(this._selNode);
  },

  onLayoutSelect: function (r) {
    this.setData(r.data);
    this.Save.enable();
  },

  onLayoutDeselect: function () {
    this.setData(null);
    this.Save.disable();
  },

  //onCancelClick: function () {
  //  this.hide();
  //},

  onBeforeEdit: function(e) {
    // no editing of the id
    if (e.record.id === '_id')
      return false;
  },

  onEdit: function(source) {
    var me = this,
      node,
      data = me.getData();

    me.setData(data);
    node = me.getNode(source._id);
    me.selectNode(node);
  },

  onFame: function () {
    var items = this.Layouts.store.getRange(),
      state = [];

    for (var i=0; i<items.length; ++i)
      state.push(items[i].data);

    console.log('state');
    console.log(state);
    console.log(JSON.stringify(state));
  },

  onSaveClick: function () {
    var items = this.Layouts.store.getRange(),
      state = [];

    for (var i=0; i<items.length; ++i)
      state.push(items[i].data);

    localStorage.setItem('state', JSON.stringify(state));
  }
  //#endregion
});
