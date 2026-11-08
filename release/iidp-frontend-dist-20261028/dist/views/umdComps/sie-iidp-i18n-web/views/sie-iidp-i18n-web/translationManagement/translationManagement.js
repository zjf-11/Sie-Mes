import importDialog from './importDialog';
import exportDialog from './exportDialog';

const isIcon = () => {
  const activeTab =
    tech_app.page.getNode('mutil_transnate_menu_tabs_search')?.data?.activeId ?? 'resource';
  return activeTab === 'icon';
};
export default {
  // 导入按钮扩展
  translation_management_import_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_transnate_menu_table_toolbar_import'
    },
    type: 'custom',
    beforeOperate: (app, operateItem, options) => {
      options.element.bind_on_click = (vm) => {
        const self = vm.self;
        let tenant_management_menu_accredit_dialog = self.$select(
          self.$ds.idPre + 'translation_management_import_dialog'
        );
        if (tenant_management_menu_accredit_dialog?.instance) {
          tenant_management_menu_accredit_dialog.data.display = true;
          return;
        }
        let accreditDiolg = window.Tech._cloneDeep(operateItem.view);
        accreditDiolg.display = true;

        // 弹窗节点不存在，动态添加弹窗
        self.$cmd.meta.popupView(self, accreditDiolg, self.$ds.idPre);
      };
      return operateItem.view;
    },
    view: importDialog
  },
  translation_management_export_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_transnate_menu_table_toolbar_export'
    },
    type: 'custom',
    beforeOperate: (app, operateItem, options) => {
      options.element.bind_on_click = (vm) => {
        const self = vm.self;
        let tenant_management_menu_accredit_dialog = self.$select(
          self.$ds.idPre + 'translation_management_export_dialog'
        );
        if (tenant_management_menu_accredit_dialog?.instance) {
          tenant_management_menu_accredit_dialog.data.display = true;
          return;
        }
        let accreditDiolg = window.Tech._cloneDeep(operateItem.view);
        accreditDiolg.display = true;

        // 弹窗节点不存在，动态添加弹窗
        self.$cmd.meta.popupView(self, accreditDiolg, self.$ds.idPre);
      };
      return operateItem.view;
    },
    view: exportDialog
  },
  // 翻译管理-顶部tabs栏以及切换交互
  mutil_transnate_menu_main_table_search_container_before_extend_view: {
    type: 'before',
    selector: {
      attr: 'id',
      value: 'mutil_transnate_menu_main_table_search_container'
    },
    view: {
      type: 'container',
      items: [
        {
          type: 'tabs',
          id: 'mutil_transnate_menu_tabs_search',
          activeId: 'resource',
          close: false,
          items: [
            {
              id: 'resource',
              name: Tech.$t('translationManagement.resource'), // 选项卡标题
              lazy: false, // Boolean标签是否延迟渲染
              type: 'container',
              closable: false,
              items: []
            },
            {
              id: 'tip',
              name: Tech.$t('translationManagement.tip'), // 选项卡标题
              lazy: false, // Boolean标签是否延迟渲染
              type: 'container',
              closable: false,
              items: []
            },
            {
              id: 'log',
              name: Tech.$t('translationManagement.log'), // 选项卡标题
              lazy: false, // Boolean标签是否延迟渲染
              type: 'container',
              closable: false,
              items: []
            },
            {
              id: 'icon',
              name: Tech.$t('translationManagement.iconTab'), // 选项卡标题
              lazy: false, // Boolean标签是否延迟渲染
              type: 'container',
              closable: false,
              items: []
            }
          ],
          bind_on_goto: (params) => {
            const { self: vm } = params;
            // 重置搜索条件
            const refresh = tech_app.page.getNode(
              'mutil_transnate_menu_container_table_search_wrap_items_1'
            );
            refresh?.instance?.click();
            const tablemain = vm.$select('mutil_transnate_menu_table_main');
            tablemain.data.display = false;
            // 切换tab时重新渲染表格、图形tab需要拓展取消行内编辑，原文和译文要走自定义组件
            setTimeout(() => {
              tablemain.data.display = true;
            }, 10);
          }
        }
      ]
    }
  },
  // 翻译管理表格输入框失去焦点事件、切换tab时重新渲染表格
  mutil_transnate_menu_table_main_table_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'mutil_transnate_menu_table_main_table'
    },
    beforeOperate: (app, operateItem, options) => {
      options.element.bind_on_rowDblclick = (res) => {};
      options.element.bind_on_editChange = async (scope) => {
        // 某项改变设置默认值
        if (scope.value.column.field === 'transnateText') {
          const { self: vm } = scope;
          const { fields, views } = vm.$ds.tableView.data;
          let row = scope.value.row;
          row = vm.$cmd.formmatRow(row); // 格式化拼接主表行数据
          // 转换日期格式的数据
          row = vm.$cmd.formatDateField(row, fields);
          row = await vm.$cmd.mergeErFiledValue(vm, row);
          for (const key in row) {
            if (Object.hasOwnProperty.call(row, key)) {
              if (key.indexOf('filter_') > -1 || key === 'rowIndex') {
                delete row[key];
              }
              // 保存时删除保留的辅助字段
              const reserveProps = window.techUi?.VxeTable?.$TABLE_ROW_RESERVE_PROPS;
              if (reserveProps && Object.values(reserveProps).includes(key)) {
                delete row[key];
              }
            }
          }
          let distRow = vm.$cmd.meta.formFormat.transformParams(vm, row);
          vm.$ds.tech_authId = vm.$ds.tech_authId;
          vm.request('formUpdate', {
            model: 'mutil_transnate',
            service: 'update',
            args: {
              values: distRow,
              ids: [distRow.id],
              useDisplayForModel: true
            }
          }).then((res) => {
            const idPre = vm.$ds.idPreTab ?? vm.$ds.idPre;
            const refresh = vm.$select(idPre + 'table_main_toolbar_refresh');
            refresh.instance.click();
            // 清除当前行的保存按钮
            vm.$cmd.clearRowEditSaveButton(vm);
          });
        }
      };
      options.element.bind_on_handleActived = () => {
      };
      // 获取译文列
    },
    view: {
      ds_config: {
        list: [
          {
            name: 'formUpdate',
            type: 'meta',
            method: 'service',
            autoRequest: false,
            options: {}
          }
        ]
      }
    }
  },
  // 翻译管理-初始将tabs条件添加到表格请求参数内
  // mutil_transnate_menu_table_main_extend_view: {
  //   type: 'custom',
  //   selector: {
  //     attr: 'id',
  //     value: 'mutil_transnate_menu_table_main' // 模型名字+_table_main
  //   },
  //   beforeOperate: (app, operateItem, options) => {
  //     let tableDataDsConfig = options.element.ds_config.list.find(
  //       (item) => item.name === 'tableData'
  //     );
  //     tableDataDsConfig.reqPrep = operateItem.view.ds_config.list[0].reqPrep;
  //     tableDataDsConfig.reqAfter = operateItem.view.ds_config.list[0].reqAfter;

  //     let tableDataDsConfigCount = options.element.ds_config.list.find(
  //       (item) => item.name === 'tableDataCount'
  //     );
  //     tableDataDsConfigCount.reqPrep = operateItem.view.ds_config.list[1].reqPrep;
  //   },
  //   view: {
  //     ds_config: {
  //       list: [
  //         {
  //           name: 'tableData',
  //           reqPrep: (vm, options, config) => {
  //             // 扩展请求前入参
  //             // 例如:
  //             const tabs = vm.$select('mutil_transnate_menu_tabs_search');
  //             options.params.args.filter.push(['resourceType', '=', tabs.data.activeId]);
  //             options.params.args.filter.unshift('&');
  //             return options;
  //           },
  //           reqAfter: (vm, res, config) => {
  //             // 扩展请求后数据
  //             // 例如:
  //             return res;
  //           }
  //         },
  //         {
  //           name: 'tableDataCount',
  //           reqPrep: (vm, options, config) => {
  //             // 扩展请求前入参
  //             // 例如:
  //             debugger
  //             // const tabs = vm.$select('mutil_transnate_menu_tabs_search');
  //             // options.params.args.filter.push(['resourceType', '=', tabs.data.activeId]);
  //             // options.params.args.filter.unshift('&');
  //             return options;
  //           }
  //         }
  //       ]
  //     }
  //   }
  // },

  // 翻译管理-初始将tabs条件添加到表格请求参数内
  mutil_transnate_menu_container_main_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_transnate_menu_container_main'
    },
    type: 'merge',
    hook: {
      // 主表格
      grid: {
        // 查询前钩子
        beforeQuery: async (vm, params, options) => {
          const tabs = vm.$select('mutil_transnate_menu_tabs_search');
          params.args.filter.push(['resourceType', '=', tabs.data.activeId]);
          params.args.filter.unshift('&');
          return params
        },
        queryCount: async (vm, params, options) => {
          let hasType =  params.args.filter.some(el => el[0] == 'resourceType')
          if (!hasType) {
            const tabs = vm.$select('mutil_transnate_menu_tabs_search');
            params.args.filter.push(['resourceType', '=', tabs.data.activeId]);
            params.args.filter.unshift('&');
          }
          return await vm.super['grid.queryCount'](vm, params, options)
        }
      }
    }
  },

  // 翻译管理-隐藏行内编辑状态的取消编辑按钮
  mutil_transnate_menu_table_toolbar_rowEdit_cancel_extend_view: {
    type: 'merge',
    selector: {
      attr: 'id',
      value: 'mutil_transnate_menu_table_toolbar_rowEdit_cancel'
    },
    view: {
      created: (vm) => {
        vm.data.display = false;
      },
      mounted: (vm) => {
        if (isIcon()) {
          // 图形tab取消行内编辑
          let tableVm = vm.$select(`${vm.$cmd.getIdPre(vm)}table_main_table`);
          tableVm.data.isEdit = tableVm.$ds.tableIsEdit = false;
        }
      }
    }
  },

  // 翻译管理表格视图-图形tab表格-系统译文和原文列拓展
  mutil_transnate_menu_table_icon_tab_compontent_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      pre: [
        'mutil_transnate_menu_table_main_table_column_originalText',
        'mutil_transnate_menu_table_main_table_column_transnateText'
      ],
      value: ''
    },
    beforeOperate: (app, operateItem, options) => {
      // 图形tab表格
      if (isIcon()) {
        options.element.type = 'icon_upload';
      }
    }
  },

  // 翻译管理图标tab暂时取消工具栏按钮
  mutil_transnate_menu_table_icon_tab_toolbar_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      pre: [
        'mutil_transnate_menu_table_toolbar_staticDownload',
        'mutil_transnate_menu_table_toolbar_export',
        'mutil_transnate_menu_table_toolbar_import'
      ],
      value: ''
    },
    beforeOperate: (app, operateItem, options) => {
      // 图形tab表格
      if (isIcon()) {
        options.element.display = false;
      }
    }
  },

  // 翻译管理-search视图-图标tab不显示系统原文字段
  mutil_transnate_menu_table_icon_tab_search_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      pre: [
        'mutil_transnate_menu_form_main_table_search_dropdown',
        'mutil_transnate_menu_form_main_table_search_common'
      ],
      value: ''
      // value: 'mutil_transnate_menu_form_main_table_search_dropdown'
    },
    beforeOperate: (app, operateItem, options) => {
      let fieldList = options?.element?.items?.[0]?.items;
      let originalText = fieldList.find((item) => item.name === 'originalText');
      if (originalText && isIcon()) {
        originalText.display = false;
      }
    }
  }
};
