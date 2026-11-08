export default {
  type: 'dialog',
  id: 'translation_management_export_dialog',
  width: '60%',
  title: Tech.$t('translationManagement.exportDialogTitle'),
  confirmText: Tech.$t('translationManagement.exportDialogConfirmTxt'),
  display: false,
  ds_config: {
    list: [
      {
        type: 'meta', // 调用元模型引擎API获取数据
        name: 'languageDict', // 数据源标识，获取数据后将根据此名称存入dataSource.data1中
        autoRequest: true, // 在节点渲染后，是否自动触发请求，默认false
        options: {
          params: {
            // 参考元模型api传参规范
            args: {
              filter: [['enable', '=', '1']],
              properties: ['name', 'code'],
              useDisplayForModel: true
            },
            context: {
              uid: '',
              zoneOffset: 8,
              lang: 'zh-CN'
            },
            service: 'search',
            app: 'sie-iidp-i18n',
            model: 'mutil_language',
            tag: 'master'
          }
        },
        reqAfter: (vm, res, config) => {
          //   code: "zh_CN"id: "defaultLanguage"name: "中文(简体)"
          function getName(val) {
            if (typeof val === 'object') {
              return val.label || val.value;
            } else {
              return val;
            }
          }
          return res.data?.map((item) => ({ text: getName(item.name), value: getName(item.name) }));
        }
      },
      {
        type: 'meta', // 调用元模型引擎API获取数据
        name: 'tableData', // 数据源标识，获取数据后将根据此名称存入dataSource.data1中
        autoRequest: true, // 在节点渲染后，是否自动触发请求，默认false
        options: {
          params: {
            args: {},
            model: 'mutil_transnate',
            tag: 'master',
            service: 'getExportExeclRangeInfo',
            app: 'sie-iidp-i18n'
          }
        },
        reqAfter: (vm, res, config) => {
          vm.$ds.submitKeys = res.data.filter((i) => i.existStatus).map((i) => i.id);
          setTimeout(() => {
            const table = tech_app.page.getNode(vm.$ds.idPre + 'export_dialog_table');
            const instance = table.instance.getInstance();
            instance.setCheckboxRow(
              table.$ds.submitKeys.map((id) => table.$ds.tableData.find((i) => i.id === id)),
              true
            );
            instance.setAllTreeExpand(true);
          }, 0);
          return res.data;
        }
      }
    ]
  },
  dataSource: {
    tableData: [],
    checkedKeys: [],
    submitKeys: []
  },
  bind_on_opreates: async (params) => {
    const { self: vm, value } = params;
    if (value.type === 'cancel') {
      value.close();
    } else {
      const formVm = vm.$select(vm.$ds.idPre + 'exprot_form');
      await formVm.instance.submit();
      let loadingInstance = null;
      loadingInstance = window.ELEMENT.Loading.service({ text: Tech.$t('detailView.saveLoading') });
      const appInfo = vm.$ds.submitKeys
        .map((id) => vm.$ds.tableData.find((i) => i.id === id))
        .filter((i) => i.resourceFlag)
        .map((i) => ({ appName: i.parentAppName, resourceType: i.resourceType }));
      const exprotParam = {
        args: {
          properties: ['appName', 'resourceType', 'key', 'originalText', 'transnateText', 'status'],
          appInfo: appInfo,
          languageNameList: formVm.$ds.form.languageNameList,
          offset: 0,
          limit: 99999
        },
        model: 'mutil_transnate',
        tag: 'master',
        service: 'exportExecl',
        app: 'sie-iidp-i18n'
      };
      await window.Tech.metaApi
        .metaServe(exprotParam, { base: params.self.tech.apiHost }, 'service', true, true, '', {
          responseType: 'arraybuffer',
          returnHeaders: true
        })
        .then((data) => {
          const fileName = data.headers['download-filename'];
          const link = document.createElement('a');
          let blob = new Blob([data.data], { type: 'application/vnd.ms-excel' }); // 类型excel
          link.style.display = 'none';
          link.href = URL.createObjectURL(blob);
          link.setAttribute('download', decodeURI(fileName));
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          loadingInstance.close();
          value.close();
        })
        .catch((err) => {
          window.ELEMENT.Message(Tech.$t('toolbar.importFailure'));
          loadingInstance.close();
        });
    }
  },
  items: [
    {
      type: 'container',
      style: {
        height: '100%'
      },
      items: [
        {
          type: 'container',
          style: {
            overflowY: 'auto'
          },
          items: [
            {
              type: 'form',
              id: 'exprot_form',
              dataSource: {},
              formConfig: {
                labelPosition: 'top'
              },
              style: {
                width: '50%',
                paddingBottom: '20px'
              },
              form: {
                view_file: ''
              },
              items: [
                {
                  type: 'select',
                  multiple: true,
                  text: Tech.$t('translationManagement.languageName'),
                  name: 'languageNameList',
                  placeholder: Tech.$t('tenant.pleaseSelect'),
                  rules: [
                    {
                      required: true,
                      trigger: 'blur',
                      message: Tech.$t('tenant.pleaseSelect')
                    }
                  ],
                  bind_options: '$ds.languageDict'
                }
              ]
            },
            {
              type: 'tabs',
              name: 'tab',
              activeId: '',
              keepAlive: false,
              items: [
                {
                  // id: '',
                  name: Tech.$t('translationManagement.exportRange'),
                  lazy: false,
                  disabled: false,
                  close: false,
                  /**
                   * // 此tab下显示的内容，任意组件内容
                   * type:'container',
                   * items:[]
                   */
                  type: 'container',

                  items: [
                    {
                      type: 'table',
                      id: 'export_dialog_table',
                      style: {
                        height: '200px'
                      },
                      gridOptions: {
                        'tree-config': {
                          expandAll: true,
                          transform: true,
                          rowField: 'id',
                          parentField: 'parent_id'
                        },
                        checkboxConfig: {
                          labelField: '',
                          checkField: ''
                        }
                      },
                      bind_tableData: '$ds.tableData',
                      items: [
                        {
                          label: '',
                          width: 120,
                          type: 'checkbox_origin',
                          treeNode: true,
                          prop: ''
                        },
                        {
                          prop: 'name',
                          label: Tech.$t('translationManagement.productName'),
                          type: 'text'
                        }
                      ],
                      bind_on_select: (params) => {
                        params.self.$ds.submitKeys = params.value.selection.map((i) => i.id);
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
