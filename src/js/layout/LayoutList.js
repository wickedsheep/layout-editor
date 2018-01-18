Ext.ns('Ix.layout');

Ix.layout.LayoutList = Ext.extend(Ext.grid.GridPanel, {
  stripeRows: true,
  _menu: null,
  _selRow: null,

  //#region lifecycle
  initComponent: function() {
    var me = this;

    me._menu = new Ext.menu.Menu({
      items: [
        {
          text: 'Edit',
          iconCls: 'icn_pencil',
          handler: me.onEdit.createDelegate(me)
        },
        {
          text: 'Delete',
          iconCls: 'icn_minus-small',
          handler: me.onDelete.createDelegate(me)
        }
      ]
    });

    me.tools = [
      {
        id: 'plus',
        handler: me.onAdd.createDelegate(me)
      }
    ];

    var data = [];
    var state = localStorage.getItem('state');
    if (state && state.length > 0)
      data = JSON.parse(state);

    me.store = new Ext.data.JsonStore({
      fields: [
        { name: 'name' },
        { name: 'items' }
      ],
      data: data
    });

    me.columns = [
      {
        header   : 'Name',
        sortable : true,
        dataIndex: 'name'
      }
    ];

    me.sm = new Ext.grid.RowSelectionModel({
      singleSelect: true,
      listeners: {
        rowselect: me.onRowSelect.createDelegate(me),
        rowdeselect: me.onRowDeselect.createDelegate(me)
      }
    });

    if (typeof me.viewConfig === 'undefined')
      me.viewConfig = {};

    me.viewConfig = Ext.apply(me.viewConfig, {
      forceFit: true,
      emptyText: 'No items ...',
      deferEmptyText: false,
      singleSelect: true
    });

    me.listeners = {
      rowcontextmenu: me.onRowCtxMenu.createDelegate(me)
    };

    Ix.layout.LayoutList.superclass.initComponent.call(me);

    me.addEvents([
      'select',
      'deselect'
    ]);
  },

  beforeDestroy: function () {
    var me = this;

    Ext.destroy(
      me._menu,
      me._selRow
    );

    Ix.layout.LayoutList.superclass.beforeDestroy.call(me);
  },
  //#endregion

  //#region methods
  //#endregion

  //#region event handlers
  onAdd: function() {
    var me = this,
      store = me.store;

    Ext.MessageBox.prompt('Layout', null, function(action, name) {
      if (action !== 'ok')
        return;

      var r = new store.recordType({name: name, items: [{ flex: 1, _id: 1 }]});
      store.add(r);
      store.commitChanges();

      me.getSelectionModel().selectLastRow();
    });
  },

  onEdit: function() {
    var me = this,
      r = me.getSelectionModel().getSelected();

    Ext.MessageBox.prompt('Layout', null, function(action, name) {
      if (action !== 'ok')
        return;

      r.set('name', name);
      r.commit();

      me.fireEvent('select', r);
    }, me, false, r.data.name);
  },

  onDelete: function() {
    var me = this,
      r = me.getSelectionModel().getSelected();

    me.store.remove(r);
    me.getSelectionModel().clearSelections();

    me.fireEvent('deselect');
  },

  onRowSelect: function (grid, ix, r) {
    this._selRow = ix;
    this.fireEvent('select', r);
  },

  onRowDeselect: function() {
    this._selRow = null;
    this.fireEvent('deselect');
  },
  
  onRowCtxMenu: function (grid, ix, e) {
    var me = this;

    e.preventDefault();
    e.stopPropagation();

    me.getSelectionModel().selectRow(ix);
    me._menu.showAt(e.getXY());
  }
  //#endregion
});
