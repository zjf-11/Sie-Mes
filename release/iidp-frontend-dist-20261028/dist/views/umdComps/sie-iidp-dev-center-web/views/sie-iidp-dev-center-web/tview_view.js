export default {
  view_formPage_switch_extend_view: {
    selector: {
      attr: 'id',
      value: 'ui-view_form_main_detail_top_common_items_0_items_body'
    },
    type: 'before',
    view: {
      type: 'row',
      span: 24,
      items: [
        {
          type: 'switch',
          name: 'toJson',
          model: {
            toJson: false
          },
          text: Tech.$t('common.change'),
          activeValue: true,
          inactiveValue: false,
          created: (vm) => {
            vm.data.model.toJson = false
          },
          bind_on_changeHandler: (data) => {
            const vm = data.self
            const codeEditorVm = vm.$select(
              'ui-view_form_main_detail_top_common_items_0_items_body'
            )
            if (vm.data.model.toJson) {
              // 转Json
              function convertFunctionsToString(obj) {
                for (let key in obj) {
                  if (typeof obj[key] === 'object') {
                    convertFunctionsToString(obj[key]) // 递归调用以处理内部对象
                  } else if (typeof obj[key] === 'function') {
                    obj[key] = obj[key].toString()
                  }
                }
              }
              // 定义一个空对象
              let newBody = {}
              // 将字符串转换为对象
              eval(`newBody = ${codeEditorVm.$ds.form.body}`)
              convertFunctionsToString(newBody)
              codeEditorVm.$ds.form.body = JSON.stringify(newBody)
            } else {
              // 转回js
              const obj = window.Tech.jsonToJs(codeEditorVm.$ds.form.body)
              codeEditorVm.$ds.form.body = JSON.stringify(obj)
            }
          }
        }
      ]
    }
  },
  model_table_main_table_build_views_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'model_table_main_table'
    },
    beforeOperate: (app, operateItem, options) => {
      let operate = options.element.columns.find(
        (item) => item.prop === 'operate'
      )
      let buildDefaultViews = operate?.btns?.find(
        (item) => item.action === 'buildDefaultViews'
      )
      buildDefaultViews.click = (vm, rowData) => {
        const tableMain = vm.$select('model_table_main')
        const dialog = {
          type: 'dialog',
          id: 'build_default_views_dialog_meta_set_codeeditor',
          width: '80%',
          title: Tech.$t('seniorTable.dataViewing'),
          display: false,
          hasFooter: true,
          confirmText: Tech.$t('toolbar.dialogConfirm'),
          cancelText: Tech.$t('toolbar.dialogCancle'),
          css: `
            #build_default_views_dialog_meta_set_codeeditor .el-form-item--small .el-form-item__content{
              margin-left: 0 !important;
            }
          `,
          items: [
            {
              type: 'form',
              created: async (vm) => {
                const idPre = vm.$cmd.getIdPre(vm)
                let params = {
                  app: 'sie-iidp-dev-center',
                  model: 'meta_model',
                  service: 'buildDefaultViews',
                  args: {
                    ids: [rowData.row.id],
                    modelName: rowData.row.name
                  }
                }
                await window.Tech.httpMeta({
                  data: { params }
                }).then((res) => {
                  if (res.error) {
                  } else {
                    vm.$ds.form.codeeditor = JSON.stringify(res.data)
                  }
                })
              },
              dataSource: {
                codeeditor: ''
              },
              items: [
                {
                  type: 'codeeditor',
                  id: 'dialog_meta_set_codeeditor_form_item',
                  name: 'codeeditor',
                  height: '500px'
                }
              ]
            }
          ]
        }
        const dialogVm = vm.$select(
          'build_default_views_dialog_meta_set_codeeditor'
        )
        if (dialogVm) {
          const index = tableMain.data.items.findIndex((item) => {
            return item.id === 'build_default_views_dialog_meta_set_codeeditor'
          })
          tableMain.data.items.splice(index, 1)
        }
        vm.app.updatePageNode(dialog, tableMain, () => {
          tableMain.data.items.push(dialog)
        })
        const viewDialogVm = vm.$select(
          'build_default_views_dialog_meta_set_codeeditor'
        )
        viewDialogVm.data.display = true
      }
    }
  }
}
