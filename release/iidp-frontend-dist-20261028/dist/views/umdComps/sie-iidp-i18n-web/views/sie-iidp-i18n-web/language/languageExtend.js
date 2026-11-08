const changeStatusFn = async (vm, rowObj, serviceName) => {
  const tableVm = vm.$select(vm.$ds.idPre + 'table_main_table');
  const param = {
    args: {
      ids: [rowObj.id],
      values: rowObj,
      useDisplayForModel: true
    },
    app: 'sie-iidp-i18n',
    service: serviceName,
    context: {
      uid: '',
      lang: window.Tech?.LANG?.locale || 'zh_CN'
    },
    model: 'mutil_language',
    tag: 'master'
  };
  await tableVm.request('formUpdate', param);
  const refresh = vm.$select(vm.$ds.idPre + 'table_main_toolbar_refresh');
  refresh.instance.click();
};
export default {
  // 多语言管理-切换启用状态和默认语种
  mutil_language_menu_table_main_table_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'mutil_language_menu_table_main_table'
    },
    beforeOperate: (app, operateItem, options) => {
      // 定位到表格的操作列
      if (!options.element._reset_bind_on_cellClick) {
        options.element._reset_bind_on_cellClick = true;
        let srcFn = options.element.bind_on_cellClick;
        options.element.bind_on_cellClick = async (res) => {
          await srcFn(res);
          const { self: vm } = res;
          const rowObj = res.value.row;
          if (rowObj.rowIndex !== 0) {
            const mainTable = vm.$select(vm.$ds.idPre + 'table_main');
            vm.$ds.tech_authId = mainTable.$ds.saveAuthId;
            const field = res.value?.column?.field;
            const curLang = window.Tech.LANG.locale;
            if (field === 'enable') {
              if (!rowObj.enable && curLang === rowObj.code) {
                window.Tech.confirmbox({
                  width: '45%',
                  title: '操作提示',
                  items: [
                    {
                      id: vm.$ds.idPre + 'cancelEdit_confirmbox',
                      // value: rowObj.name + ' 正在使用中，禁用后将使用默认语言，是否禁用？',
                      value: rowObj.name + Tech.$t('translationManagement.banedTips'),
                      type: 'text'
                    }
                  ],
                  options: {
                    confirm: async (close) => {
                      let defLang = 'zh-CN';
                      let curLang = localStorage.getItem('defaultLang');
                      // 获取用户默认语言
                      let tableData = vm?.data?.tableData ?? [];
                      if (tableData?.length > 0) {
                        let isDefault = tableData.find((item) => item.isDefault === true);
                        defLang = isDefault.code ?? 'zh-CN';
                      }
                      // 确认禁用之后，需要把当前语种切换为默认语言
                      const href = vm.$cmd.meta.changeURLArg(window.location.href, 'lang', defLang);
                      // 若果禁用的是当前语种，后端保存提示
                      if (curLang === defLang) {
                        changeStatusFn(vm, rowObj, 'updateOfEnable');
                      } else {
                        changeStatusFn(vm, rowObj, 'updateOfEnable');
                        window.localStorage.setItem('defaultLang', defLang);
                        window.location.href = href;
                      }
                      close();
                    },
                    cancel: (close) => {
                      const refresh = vm.$select(vm.$ds.idPre + 'table_main_toolbar_refresh');
                      refresh.instance.click();
                      close();
                    }
                  }
                });
              } else {
                changeStatusFn(vm, rowObj, 'updateOfEnable');
              }
            } else if (field === 'isDefault') {
              if (!rowObj.enable) {
                window.Tech.confirmbox({
                  width: '45%',
                  title: '操作提示',
                  items: [
                    {
                      id: vm.$ds.idPre + 'cancelEdit_confirmbox',
                      value: rowObj.name + '未启用，是否启用' + rowObj.name,
                      type: 'text'
                    }
                  ],
                  options: {
                    confirm: async (close) => {
                      changeStatusFn(vm, rowObj, 'updateOfDefault');
                      close();
                    },
                    cancel: (close) => {
                      const refresh = vm.$select(vm.$ds.idPre + 'table_main_toolbar_refresh');
                      refresh.instance.click();
                      close();
                    }
                  }
                });
              } else {
                changeStatusFn(vm, rowObj, 'updateOfDefault');
              }
            }
          }
        };
      }
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
  mutil_language_menu_table_toolbar_delete_extend_view: {
    type: 'merge',
    selector: {
      attr: 'id',
      value: 'mutil_language_menu_table_toolbar_delete'
    },
    view: {
      bind_on_click: (params) => {
        const { self: vm } = params;
        const table = vm.$select(vm.$ds.idPre + 'table_main_table');
        const rowData = table.$ds.selectedTableData[0];
        if (rowData.isDefault) {
          window.Tech.confirmbox({
            width: '45%',
            title: '操作提示',
            items: [
              {
                id: vm.$ds.idPre + 'cancelEdit_confirmbox',
                // value: rowData.name + '为默认语种，不能删除！',
                value: rowData.name + Tech.$t('translationManagement.cancelTips'),
                type: 'text'
              }
            ],
            options: {
              confirm: async (close) => {
                close();
              },
              cancel: (close) => {
                close();
              }
            }
          });
        } else {
          let selectedTableData = vm.$cmd.meta.getCheckDataList(vm);
          const delIds = selectedTableData?.map((item) => item.id) || [];
          if (!delIds.length)
            return window.ELEMENT.Message(
              vm.data?.btnConfig?.rewriteDelTips || Tech.$t('toolbar.deleteHint')
            );
          const idPre = vm.$ds.idPreTab ?? vm.$ds.idPre;
          const delDialog = vm.$select(`${idPre}table_main_del_dialog`);
          const delconfirm = (close) => {
            const treeEle = vm.$select(vm.$ds.idPre + 'tree_main_wrap_left');
            const treeView = treeEle?.$ds?.treeViewRes?.data?.views?.tree;
            let requestModel = vm.$ds.menuConfig.model;
            if (vm.$ds._viewType == 'singleGrid') {
              // 上下表格模板
              requestModel = vm.$ds.tabConfig.model;
            }

            vm.request('delTableData', {
              model: requestModel,
              args: {
                ids: delIds
              }
            }).then((res) => {
              close();
              if (res.error || res.response?.data?.error || res.data?.error) {
                return;
              }
              if (treeView?.body?.props?.isUpdateTree) {
                treeEle.$cmd.initTree(treeEle);
              } else {
                const tableVm = vm.$select(vm.$cmd.getIdPre(vm) + 'table_main_table');
                const pagEle = vm.$select(idPre + 'table_main_paging');
                pagEle.instance.showTotal();
                pagEle.instance.reset();
                vm.$ds.tech_authId = tableVm.data.tech_authId;
                vm.request('tableData', {
                  args: {
                    filter: vm.$cmd.meta.tableFormat.getTableFilter(vm, vm.$ds.tableFilter, idPre),
                    properties: vm.$cmd.meta.toProperty(
                      vm.$ds.tableView?.data?.views?.grid?.body?.columns || [],
                      vm.$ds.tableView?.data?.fields || {}
                    )
                  },
                  model: requestModel
                });
              }
              vm.$ds.selectedTableData = [];
              vm.$ds.checkedDataIds = [];
              vm.$ds.checkedDataList = [];
            });
          };
          delDialog.data.display = true;
          delDialog.data.options.confirm = delconfirm;
        }
      }
    }
  }
};
