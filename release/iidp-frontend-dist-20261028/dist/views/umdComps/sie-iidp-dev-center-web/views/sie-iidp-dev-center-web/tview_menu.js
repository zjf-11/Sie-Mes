export default {
  // 菜单管理——是否禁用列——switch 扩展
  menu_main_table_switch_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'menu_table_main_table_column_active'
    },
    beforeOperate: (app, operateItem, options) => {
      options.element.type = 'switch'
      options.element.activeValue = true
      options.element.inactiveValue = false
      // '菜单管理'不支持修改
      options.element.formatItem = (row, item) => {
        if (row.id === 'sie-iidp-dev-center.meta_menu_menu@Menu:master') {
          item.disabled = true
        }
        return item
      }
      // 判定是否为平台租户管理员
      let userId = window?.tech?.userInfo?.id ?? ''
      options.element.disabled =
        userId === 'rbac_user_implementer' ? false : true
      options.element.bind_on_changeHandler = async (options) => {
        const { self: vm } = options
        let params = {
          args: {
            ids: [options.value.row.id],
            values: {
              app_ids: options.value.row.app_ids.value,
              app_name: options.value.row.app_name,
              display_name: options.value.row.display_name,
              icon: options.value.row.icon,
              name: options.value.row.name,
              model: options.value.row.model,
              view: options.value.row.view,
              active: options.value.row.active,
              parent_ids: options.value.row?.parent_ids?.value,
              id: options.value.row.id
            }
          },
          context: {
            uid: '',
            lang: window.Tech?.LANG?.locale || 'zh_CN'
          },
          model: 'meta_menu',
          service: 'update',
          tag: 'master',
          app: 'sie-iidp-dev-center'
        }
        window.Tech.httpMeta({
          data: {
            params
          }
        })
          .then((res) => {
            const refreshBtn = vm.$select(
              vm.$ds.idPre + 'table_main_toolbar_refresh'
            )
            refreshBtn?.instance?.click()
          })
          .catch((err) => {
            setTimeout(() => {
              if (vm?.$ds?.mainTableRowData?.hasOwnProperty('active')) {
                vm.$ds.mainTableRowData.active =
                  !options?.value?.row?.active ??
                  !vm?.$ds?.mainTableRowData?.active
              }
            }, 100)
          })
      }
      return operateItem.view
    }
  },

  // 编辑和详情 更换接口
  menu_main_table_operation_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'menu_table_main'
    },
    beforeOperate: (app, operateItem, options) => {
      // 数据源-获取主表格
      let tableDataDsConfig = options.element.ds_config.list.find(
        (item) => item.name === 'tableData'
      )
      tableDataDsConfig.reqPrep = operateItem.view.ds_config.list[0].reqPrep
    },
    view: {
      ds_config: {
        list: [
          {
            name: 'tableData',
            // 请求执行前-可获取当前请求的所有参数
            reqPrep: (vm, options, config) => {
              // 通过筛选条件里是否含有id判断是否是编辑和详情
              let filter = options?.params?.args?.filter
              let need_search2 = filter.some((item) => {
                return item.includes('id') && item.includes('=')
              })
              if (need_search2) {
                options.params.service = 'mainTableSearch'
              }
              return options
            },
            // 调用接口后执行，可修改数据格式，必须返回res
            reqAfter: (vm, res, config) => {
              return res
            }
          }
        ]
      }
    }
  },

  // 菜单详情页上传组件限制大小和文件类型
  preview_upload_component_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'menu_form_main_detail_top_common'
    },
    beforeOperate: (app, operateItem, options) => {
      let itemList = options.element.items
      // 获取表单视图的view_id
      let formViewId = options.parent?.dataSource?.formViewId
      const findIconInItems = (itemList) => {
        let result = []
        // 适配高级组件的字段行组调整，元素的位置会变化
        for (let row of itemList) {
          if (row && Array.isArray(row.items) && row.items.length > 0) {
            for (let item of row.items) {
              if (item.name === 'icon') {
                result.push(item)
              }
            }
          }
        }
        return result[0]
      }
      // let icon = itemList.find((item) => item.name === 'icon')
      let icon = findIconInItems(itemList)
      if (icon) {
        // 更改提示tip
        icon.tip = Tech.$t('customPermission.uploadTip')
        // 限制文件类型
        icon.accept = '.png,.jpg'
        icon.uploadApi = (param, uploadProgressEvent) => {
          const file = param.file
          // 验证上传的文件大小
          if (file.size / 1024 / 1024 > 1) {
            return Promise.reject(Tech.$t('customPermission.maxSize'))
          }
          const fileUid = file.uid
          let paramsData = new FormData()
          paramsData.append('file', file)
          paramsData.append('model_id', 'ui_menu')
          paramsData.append('uid', fileUid)
          paramsData.append('description', '')
          // 判断是否上传到公共桶
          if (window?.$tech?.uploadPublicViews?.includes(formViewId)) {
            paramsData.append('bucketType', 'public')
          }
          return window.Tech.metaApi.metaUpload(
            paramsData,
            window.tech.apiHost,
            uploadProgressEvent
          )
        }
      }
    }
  },

  // 菜单管理详情页 保存时调接口更新 图标原文
  menu_form_originIcon_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'menu_form_main_detail_top_common'
    },
    beforeOperate: (app, operateItem, options) => {
      let formDataDsConfig = options.element.ds_config.list.find(
        (item) => item.name === 'formUpdate'
      )
      formDataDsConfig.reqPrep = operateItem.view.ds_config.list[0].reqPrep
    },
    view: {
      ds_config: {
        list: [
          {
            name: 'formUpdate',
            reqPrep: (vm, options, config) => {
              if (window?.techUseMultiLang) {
                // 编辑时 上传图标作为 图标国际化-初始图标
                if (options?.params?.service === 'update') {
                  let param = options?.params?.args?.values
                  let data = {
                    params: {
                      app: 'sie-iidp-i18n',
                      service: 'uploadOfIcon',
                      model: 'mutil_transnate',
                      args: {
                        values: {
                          menuId: param?.id,
                          display_name: param?.display_name,
                          originIcon: param?.icon
                        }
                      }
                    }
                  }
                  // 调接口保存上传的文件
                  window.Tech.httpMeta({ data })
                }
              }
              return options
            }
          }
        ]
      }
    }
  },
  base_menu_detail_extend: {
    type: 'before',
    selector: {
      attr: 'id',
      pre: ['ui_menu_menu', 'menu'],
      value: '_form_main_detail_top_common_items_0_items_view'
    },
    beforeOperate: (app, operate, options) => {
      operate.view.items[0].innerLabel = options.element.innerLabel
        ? true
        : false
      return operate.view
    },
    view: {
      type: 'form-container',
      items: [
        {
          type: 'select',
          name: 'viewType',
          text: Tech.$t('common.viewType'),
          placeholder: Tech.$t('common.viewTypeHint'),
          defaultValue: 'sysView',
          innerLabel: false,
          options: [
            { text: Tech.$t('common.blankPage'), value: 'empty' },
            { text: Tech.$t('common.systemView'), value: 'sysView' },
            { text: 'iframe', value: 'iframe' },
            { text: 'wujie', value: 'wujie' },
            { text: 'URL - _blank', value: '_blank' },
            { text: 'URL - _self', value: '_self' },
            { text: 'URL - _top', value: '_top' },
            { text: 'URL - _parent', value: '_parent' },
            { text: Tech.$t('common.customView'), value: 'custom' }
          ],
          rules: [
            {
              required: true,
              trigger: 'blur',
              message: Tech.$t('common.viewTypeHint')
            }
          ],
          dataSource: {
            originView: ''
          },
          created: (vm) => {
            const curView = vm.$ds.form.view
            vm.$ds.originView = curView
            const curOption = vm.data.options.find(
              (item) => curView?.indexOf(item.value) > -1
            )
            vm.$ds.form.viewType = 'sysView'
            if (curOption) {
              // 给下拉选项默认值
              vm.$ds.form.viewType = curOption.value
              const viewInput = vm.$select(
                vm.$ds.idPre + 'form_main_detail_top_common_items_0_items_view'
              )
              viewInput.data.disabled = true
              if (curOption.value == 'wujie') {
                const viewCode = vm.$select('menu_form_codeeditor')
                viewCode.data.display = true
                viewInput.data.display = false
                if (vm.$ds.form.view.indexOf('wujie') === -1) {
                  vm.$ds.form.view = '{"wujie":{}}'
                }
              }
            }
          },
          bind_on_changeHandler: (params) => {
            const { self: vm, value } = params
            const viewInput = vm.$select(
              vm.$ds.idPre + 'form_main_detail_top_common_items_0_items_view'
            )
            const viewCode = vm.$select('menu_form_codeeditor')

            // 先重置显示
            viewInput.data.display = false
            viewInput.data.disabled = true
            viewCode.data.display = false

            switch (value) {
              case 'empty':
                vm.$ds.form.view = 'empty'
                viewInput.data.type = 'input'
                viewInput.data.display = true
                break
              case 'sysView':
                vm.$ds.form.view = vm.$ds.originView || 'grid,form,search'
                viewInput.data.display = true
                viewInput.data.disabled = false
                break
              case 'iframe':
                viewInput.data.display = true
                vm.$ds.form.view = 'iframe'
                break
              case 'wujie':
                viewCode.data.display = true
                vm.$ds.form.view = '{"wujie":{}}'
                break
              case '_blank':
                viewInput.data.display = true
                vm.$ds.form.view = '_blank'
                break
              case '_self':
                vm.$ds.form.view = '_self'
                viewInput.data.display = true
                break
              case '_top':
                viewInput.data.display = true
                vm.$ds.form.view = '_top'
                break
              case '_parent':
                viewInput.data.display = true
                vm.$ds.form.view = '_parent'
                break
              case 'custom':
                viewInput.data.display = true
                vm.$ds.form.view = 'custom'
                break
            }
          }
        }
      ]
    }
  },
  base_menu_detail_code_extend: {
    type: 'after',
    selector: {
      attr: 'id',
      pre: ['ui_menu_menu', 'menu'],
      value: '_form_main_detail_top_common_items_0_items_filter'
    },
    view: {
      type: 'codeeditor',
      span: 24,
      rowSpan: 3,
      text: Tech.$t('common.view'),
      name: 'view',
      id: 'menu_form_codeeditor',
      display: false
    }
  },
  base_menu_form_url_extend23434545645076: {
    type: 'after',
    selector: {
      attr: 'id',
      pre: ['ui_menu_menu', 'menu'],
      value: '_form_main_detail_top_common_items_0_items_url'
    },
    beforeOperate: (app, operate, options) => {
      options.element.rules.push({
        required: true,
        trigger: 'blur',
        message: Tech.$t('common.requiredHint')
      })
      options.element.bind_display =
        '${$ds.form.viewType !== "empty" && $ds.form.viewType !== "sysView" && $ds.form.viewType !== "custom"}'
    }
  }
}
