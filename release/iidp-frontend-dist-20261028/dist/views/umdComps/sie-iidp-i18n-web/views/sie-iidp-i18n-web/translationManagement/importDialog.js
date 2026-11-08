// 多租户——租户管理——授权弹框
export default {
  type: 'dialog',
  id: 'translation_management_import_dialog',
  width: '60%',
  title: Tech.$t('translationManagement.importDialogTitle'),
  confirmText: Tech.$t('translationManagement.importDialogConfirmTxt'),
  display: false,
  ds_config: {
    list: [
      {
        type: 'meta',
        name: 'tableData',
        options: {
          params: {
            args: {
              useDisplayForModel: true
            },
            service: 'getImportExeclRangeInfo',
            app: 'sie-iidp-i18n',
            context: {
              uid: '',
              lang: 'zh_CN'
            },
            model: 'mutil_transnate',
            tag: 'master'
          }
        },
        reqAfter: (vm, res, config) => {
          if (!res.data) {
            // window.ELEMENT.Message.error(res.message)
            return [];
          }
          return res.data;
        }
      },
      {
        type: 'meta',
        name: 'importExecl',
        options: {
          params: {
            args: {
              useDisplayForModel: true,
              fileId: '',
              appInfo: []
            },
            service: 'importExecl',
            app: 'sie-iidp-i18n',
            context: {
              uid: '',
              lang: 'zh_CN'
            },
            model: 'mutil_transnate',
            tag: 'master'
          }
        }
        // reqAfter: (vm, res, config) => {
        //   //   code: "zh_CN"id: "defaultLanguage"name: "中文(简体)"
        //   return res
        // }
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
      const formVm = vm.$select(vm.$ds.idPre + 'improt_form');
      await formVm.instance.submit();
      let loadingInstance = null;
      loadingInstance = window.ELEMENT.Loading.service({ text: Tech.$t('detailView.saveLoading') });
      const appInfo = vm.$ds.submitKeys
        .map((id) => vm.$ds.tableData.find((i) => i.id === id))
        .filter((i) => i.resourceFlag)
        .map((i) => ({ appName: i.parentAppName, resourceType: i.resourceType }));
      const key = formVm.$ds.form.upload_field_upload?.[0]?.key;
      const improtParam = {
        args: {
          appInfo: appInfo,
          fileId: key
        }
      };
      try {
        const response = await vm.request('importExecl', improtParam);
        loadingInstance.close();
        if (!response.error) {
          value.close();
          window.ELEMENT.Message.success(Tech.$t('translationManagement.importSuccess'));
          const search = vm.$select('mutil_transnate_menu_form_main_table_search_btn');
          search.instance.click();
        }
      } catch (error) {
        window.ELEMENT.Message(Tech.$t('toolbar.importFailure'));
        loadingInstance.close();
      }
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
              id: 'improt_form',
              dataSource: {},
              formConfig: {
                // labelWidth: '0px',
                // inline: true,
                // minWidth: 400,
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
                  type: 'upload',
                  name: 'upload',
                  content: Tech.$t('translationManagement.unlaodBtnTxt'),

                  multiple: false,
                  limit: 1,
                  size: 'small',
                  'auto-upload': false,
                  canDownload: false,
                  autoUpload: true,
                  rules: [
                    {
                      required: true,
                      trigger: 'change',
                      message: Tech.$t('translationManagement.uploadPlaceholder')
                    }
                  ],
                  bind_on_handleSuccess: (response, file, fileList) => {
                    const key = response?.value?.response?.result?.data?.[0]?.key;
                    response.self.request('tableData', {
                      args: {
                        fileId: key
                      }
                    });
                  },
                  handleError: (err, file, fileList) => {},
                  uploadApi: (param, uploadProgressEvent) => {
                    const maxSize = '2';
                    if (maxSize) {
                      if (maxSize.indexOf('KB') > -1 || maxSize.indexOf('kb') > -1) {
                        if (param.file.size / 1024 > parseFloat(maxSize))
                          return Promise.reject(
                            Tech.$t('translationManagement.maxSizeTxt') + maxSize
                          );
                      } else {
                        if (param.file.size / 1024 / 1024 > parseFloat(maxSize)) {
                          return Promise.reject(
                            Tech.$t('translationManagement.maxSizeTxt') + parseFloat(maxSize) + 'Mb'
                          );
                        }
                      }
                    }
                    const paramsData = new FormData();
                    paramsData.append('file', param.file);
                    paramsData.append('userId', 'rbac_user_admin');
                    paramsData.append('uid', param.file.uid);
                    paramsData.append('description', '');
                    return window.Tech.metaApi.metaUpload(
                      paramsData,
                      window.tech.apiHost,
                      uploadProgressEvent
                    );
                  },
                  downloadApi: (id) => {
                    // 返回下载地址
                    // id: 文件id
                  }
                }
              ]
            },
            // {
            //   type: 'container',
            //   style: {
            //     height: '10px',
            //     background: '#e1e7ec'
            //   }
            // },
            {
              type: 'tabs',
              name: 'tab',
              activeId: '',
              keepAlive: false,
              items: [
                {
                  id: '',
                  name: Tech.$t('translationManagement.importRange'), // 选项卡标题
                  lazy: false, // Boolean标签是否延迟渲染
                  disabled: false, // 是否禁用
                  /**
                   * // 此tab下显示的内容，任意组件内容
                   * type:'container',
                   * items:[]
                   */
                  type: 'container',

                  items: [
                    {
                      type: 'table',
                      id: 'import_dialog_table',
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
