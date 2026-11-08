import globalIcon from './images/globel.svg'
let scrollTop = null
const globalCss = `
.i18n_common_icon_form {
  position: relative;
  overflow: unset !important;
}
.i18n_common_icon_form:after, .i18n_common_icon_table:after {
  content: '';
  display: inline-block;
  width: 16px;
  height: 16px;
  background-size: contain;
  background-repeat: no-repeat; 
  background-position: center;
  background-image: url(${globalIcon});
  position: absolute;
  top: 0px;
  right: -18px;
  overflow: unset;
}

.i18n_common_icon_table:after {
  position: static
}
.i18n_common_label_style {
  padding-right: 22px;
}
`
let isInit = true
// 获取appName方法
function parentheses(str) {
  const regex = /\(([^)]+)\)/g
  const matches = str.match(regex)
  return matches ? matches.map((match) => match.substring(1, match.length - 1)) : []
}

// 表格请求参数
const tableFilter = (vm, params) => {
  params.args.filter = params.args.filter.filter((el) => el[0])
  // params.args.filter =  params.args.filter.filter(el => el[0] && el != '&')
  let currentData = window.Tech._cloneDeep(
    vm.$select('mutil_data_menu_tree_main_wrap_left').$ds.currentData
  )
  let appName = []
  const appNameFn = (data) => {
    data.forEach((el) => {
      // 获取appName
      if (el.appName.indexOf('(') != -1 && el.appName.indexOf(')') != -1) {
        let val = parentheses(el.appName)
        let len = val?.length || 1
        el.appName = val[len-1]
      }
      appName.push(el.appName + '.' + el.appTag)

      if (el?.children?.length) {
        appNameFn(el.children) // 递归
      }
    })
  }
  if (currentData?.appName && currentData?.appTag) {
    // 获取括号里面的内容
    if (currentData.appName.indexOf('(') != -1 && currentData.appName.indexOf(')') != -1) {
      let val = parentheses(currentData.appName)
      let len = val?.length || 1
      currentData.appName = val[len-1]
    }
    appName.push(currentData.appName + '.' + currentData.appTag)
  }

  if (currentData?.children?.length) {
    appNameFn(currentData.children)
  }
  // 去重
  appName = Array.from(new Set(appName))
  let filter = [
    '&',
    '&',
    ['type', '=', currentData?.type],
    ['id', '=', currentData?.id],
    ['appNameTag', 'in', appName]
  ]
  params.args.filter = vm.$cmd.meta.addSearch(params.args.filter, filter)
  return params
}
export default {
  // 国际化地球展示
  test_directive_custom_extend: {
    type: 'merge', // 在选中节点前面插入视图
    selector: {
      attr: 'id',
      value: 'page_meta_index' // 关于按钮
    },
    beforeOperate: (app, config, options) => {
      config.view = {
        def_directives: {
          t_i18_global: {
            activeFn: (vm) => {
              // 【可选配置】
              if (
                [
                  'table_main_table',
                  'detail_common_form',
                  'form_formpart',
                  'table_drawer_form',
                  'tree_main_wrap_left_dialog_form'
                ].includes(vm?.data?.className)
              ) {
                return true
              }
              return false
            },
            analyse: (vm, config) => {
              // 表格地球图标样式
              if (vm.data?.className == 'table_main_table') {
                if (vm.data?.css) {
                  vm.data.css = vm.data.css + globalCss
                } else {
                  vm.data.css = globalCss
                }
                setTimeout(() => {
                  let tableVm = tech_app.page.getNode(vm.data.id) // 获取登陆按钮
                  let idPre = tableVm.$cmd.getIdPre(tableVm)
                  let tableMain = tech_app.page.getNode(idPre + 'table_main_table')
                  let tableMainDataReactive = window.Tech.reactiveFn(tableMain?.data) // 登陆按钮data配置转响应式
                  if (tableMain.data._myWatchs) {
                    // 检查之前是否有对应watch 有则先销毁
                    tableMain.data._myWatchs()
                    tableMain.data._myWatchs = null
                  }
                  // 建watch
                  tableMain.data._myWatchs = window.Tech.watchFn(
                    () => tableMainDataReactive,
                    (val) => {
                      if (val) {
                        let mutilLangTranslate = JSON.parse(
                          localStorage.getItem('mutilLangTranslate')
                        )
                        setTimeout(() => {
                          let trMain = document.querySelector(
                            '#' + vm.data.id + '.table_main_table tr'
                          )
                          if (trMain) {
                            trMain.childNodes.forEach((el) => {
                              let span = el.querySelector('div span.vxe-cell--title')
                              if (span) {
                                let innerText = span?.innerText
                                if (innerText) {
                                  // innerText = innerText.replace(/\s/g, '')

                                  innerText = innerText.replace(/^\s+|\s+$/g, '')
                                }
                                let div = el.querySelector('div.c--ellipsis')
                                let isExist = vm.data.items.find(
                                  (item) =>
                                    item.displayName == innerText ||
                                    item.label == innerText ||
                                    item.text == innerText ||
                                    item.title == innerText
                                )
                                if (isExist && isExist?.isMultiLanguage && mutilLangTranslate) {
                                  div.classList.add('i18n_common_icon_table')
                                }
                              }
                            })
                          }
                        }, 300)
                      }
                    },
                    { deep: true, immediate: true }
                  )
                })
              }
              // 表单地球图标样式
              if (vm.data?.className == 'detail_common_form') {
                if (vm.data?.css) {
                  vm.data.css = vm.data.css + globalCss
                } else {
                  vm.data.css = globalCss
                }
                let ids = []
                const fn = (items) => {
                  items.forEach((el) => {
                    if (el?.items?.length) {
                      fn(el.items)
                    } else {
                      ids.push({ id: el.id, isMultiLanguage: el?.isMultiLanguage, name: el.name })
                    }
                  })
                }
                vm.data.items.forEach((el) => {
                  if (el?.items?.length) {
                    fn(el.items)
                  } else {
                    ids.push({ id: el.id, isMultiLanguage: el?.isMultiLanguage, name: el.name })
                  }
                })
                let mutilLangTranslate = JSON.parse(localStorage.getItem('mutilLangTranslate'))
                setTimeout(() => {
                  ids.forEach((el) => {
                    const curField = tech_app.page.getNode(el.id)
                    if (
                      mutilLangTranslate &&
                      curField?.data.disabled &&
                      curField?.data?.isMultiLanguage
                    ) {
                      curField.data.disabled = false
                    }
                    let span = document.querySelector(
                      '#' + el.id + '_form_item label span:last-child'
                    )
                    if (
                      curField &&
                      curField?.data?.isMultiLanguage &&
                      span &&
                      curField.$ds.clickType != 'add' &&
                      mutilLangTranslate
                    ) {
                      span.classList.add('i18n_common_icon_form')
                      let label = document.querySelector('#' + el.id + '_form_item label')
                      label.classList.add('i18n_common_label_style')
                    }
                  })
                })
              }
              // 子表的表单地球样式
              if (vm.data?.className == 'form_formpart') {
                if (vm.data?.css) {
                  vm.data.css = vm.data.css + globalCss
                } else {
                  vm.data.css = globalCss
                }
                let ids = []
                const fn = (items) => {
                  items.forEach((el) => {
                    if (el?.items?.length) {
                      fn(el.items)
                    } else {
                      ids.push({ id: el.id, isMultiLanguage: el?.isMultiLanguage, name: el.name })
                    }
                  })
                }
                vm.data.items.forEach((el) => {
                  if (el?.items?.length) {
                    fn(el.items)
                  } else {
                    ids.push({ id: el.id, isMultiLanguage: el?.isMultiLanguage, name: el.name })
                  }
                })
                let mutilLangTranslate = JSON.parse(localStorage.getItem('mutilLangTranslate'))
                setTimeout(() => {
                  ids.forEach((el) => {
                    const curField = tech_app.page.getNode(el.id)
                    if (
                      mutilLangTranslate &&
                      curField?.data.disabled &&
                      curField?.data?.isMultiLanguage
                    ) {
                      curField.data.disabled = false
                    }
                    let span = document.querySelector(
                      '#' + el.id + '_form_item label span:last-child'
                    )
                    if (
                      curField &&
                      curField?.data?.isMultiLanguage &&
                      span &&
                      curField.$ds.clickType != 'add' &&
                      mutilLangTranslate
                    ) {
                      span.classList.add('i18n_common_icon_form')
                    }
                  })
                })
              }
              // 抽屉表单地球样式
              if (vm.data?.className == 'table_drawer_form') {
                if (vm.data?.css) {
                  vm.data.css = vm.data.css + globalCss
                } else {
                  vm.data.css = globalCss
                }
                let ids = []
                vm.data.items[0].items.forEach((el) => {
                  ids.push({ id: el.id, isMultiLanguage: el?.isMultiLanguage, name: el.name })
                })
                let mutilLangTranslate = JSON.parse(localStorage.getItem('mutilLangTranslate'))
                setTimeout(() => {
                  ids.forEach((el) => {
                    const curField = tech_app.page.getNode(el.id)

                    if (
                      mutilLangTranslate &&
                      curField?.data.disabled &&
                      curField?.data?.isMultiLanguage
                    ) {
                      curField.data.disabled = false
                    }

                    let span = document.querySelector(
                      '#' + el.id + '_form_item label span:last-child'
                    )
                    if (
                      curField &&
                      curField?.data?.isMultiLanguage &&
                      span &&
                      curField.$ds.clickType !== 'add' &&
                      mutilLangTranslate
                    ) {
                      span.classList.add('i18n_common_icon_form')
                    }
                  })
                })
              }
              // 树的编辑弹窗地球样式
              if (vm.data?.className == 'tree_main_wrap_left_dialog_form') {
                if (vm.data?.css) {
                  vm.data.css = vm.data.css + globalCss
                } else {
                  vm.data.css = globalCss
                }
                let ids = []
                vm.data.items[0].items.forEach((el) => {
                  ids.push({ id: el.id, isMultiLanguage: el?.isMultiLanguage, name: el.name })
                })
                let mutilLangTranslate = JSON.parse(localStorage.getItem('mutilLangTranslate'))
                setTimeout(() => {
                  ids.forEach((el) => {
                    const curField = tech_app.page.getNode(el.id)

                    if (
                      mutilLangTranslate &&
                      curField?.data.disabled &&
                      curField?.data?.isMultiLanguage
                    ) {
                      curField.data.disabled = false
                    }

                    let span = document.querySelector(
                      '#' + el.id + '_form_item label span:last-child'
                    )
                    if (
                      curField &&
                      curField?.data?.isMultiLanguage &&
                      span &&
                      curField.$ds.clickType !== 'add' &&
                      mutilLangTranslate
                    ) {
                      span.classList.add('i18n_common_icon_form')
                    }
                  })
                })
              }
            }
          }
        }
      }
      return config.view
    },
    view: {}
  },

  // 数据翻译主表格请求扩展
  mutil_data_menu_container_main_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_data_menu_container_main'
    },
    type: 'merge',
    hook: {
      // 主表格
      grid: {
        // 查询前钩子
        beforeQuery: async (vm, params, options) => {
          params = tableFilter(vm, params)
          return params
        },
        queryCount: async (vm, params, options) => {
          params = tableFilter(vm, params)
          return await vm.super['grid.queryCount'](vm, params, options)
        },
        afterQuery: async (vm, params, options) => {
          return await vm.super['grid.afterQuery'](vm, params, options)
        },
        edit: {
          // 保存前 包括单行和多行的保存
          beforeSave: async (vm, params, options) => {
            let newParams = window.Tech._cloneDeep(params.params[0])
            let valuesList = []
            params.params.forEach((el) => {
              valuesList.push(el.args.values)
            })
            delete newParams.args.ids
            delete newParams.args.values
            newParams.service = newParams.service.replace('update', 'updateTranslate')
            newParams.args.valuesList = valuesList
            params.params = newParams
            return params // 返回调用接口时保存的数据
          }
        }
      }
    }
  },
  // 数据翻译属性主表格请求扩展
  mutil_model_store_mode_menu_container_main_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_model_store_mode_menu_container_main'
    },
    type: 'merge',
    hook: {
      // 主表格
      grid: {
        // 查询前钩子
        beforeQuery: async (vm, params, options) => {
          params = tableFilter(vm, params)
          return params
        },

        queryCount: async (vm, params, options) => {
          params = tableFilter(vm, params)
          let res = await vm.super['grid.queryCount'](vm, params, options)

          return res
        },
        // afterQuery: async (vm, params, options) => {
        //   return await vm.super['grid.afterQuery'](vm, params, options)
        // },

        edit: {
          // 保存前 包括单行和多行的保存
          beforeSave: async (vm, params, options) => {
            // params：要保存的数据
            // : valuesList

            let newParams = window.Tech._cloneDeep(params.params[0])
            let valuesList = []
            params.params.forEach((el, index) => {
              // delete el.args.values.id
              if (el.args?.values) {
                const row = el.args.values
                if (!row?.id) {
                  delete el.args.values.id
                } else {
                  if (row.id.startsWith('row') || row.id.startsWith('ROW')) {
                    delete el.args.values.id
                  }
                }
              }

              delete el.args.values.isEdit
              valuesList.push(el.args.values)
            })
            delete newParams.args.ids
            delete newParams.args.values
            // newParams.service = 'create'
            newParams.service = newParams.service.replace('update', 'create')
            newParams.args.valuesList = valuesList
            params.params = newParams
            return params // 返回调用接口时保存的数据
          },
          afterQuery: async (vm, params, options) => {
            // params: 查到的表格数据
            return await vm.super['grid.afterQuery'](vm, params, options)
          }
        }
      }
    }
  },

  mutil_model_store_mode_menu_table_main_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_model_store_mode_menu_table_main'
    },
    type: 'custom',
    beforeOperate: (app, operateItem, options) => {
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
            reqPrep: (vm, options, config) => {
              // 扩展请求前入参
              if (!options.params.args.filter.length) {
                options.params = tableFilter(vm, options.params)
              }

              return options
            }
          }
        ]
      }
    }
  },

  // 多语言属性主表格请求扩展
  mutil_model_property_menu_container_main_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_model_property_menu_container_main'
    },
    type: 'merge',
    hook: {
      // 主表格
      grid: {
        // 查询前钩子
        beforeQuery: async (vm, params, options) => {
          let property_container = vm.$select('mutil_model_property_container')
          let t = vm.$select('mutil_model_property_container')
          // 左边树的点击查询参数
          if (property_container.$ds?.clickStatus) {
            params = tableFilter(vm, params)
          } else {
            // 储存方式跳转过来的参数
            params.args.filter = vm.$cmd.meta.addSearch(params.args.filter, [
              ['id', '=', t.$ds.rowData.id],
              ['appNameTag', 'in', [t.$ds.rowData.appNameTag]],
              ['modelName', '=', t.$ds.rowData.modelName],
              ['type', '=', 'CurrentModel']
            ])
          }
          return params
        },
        queryCount: async (vm, params, options) => {
          let property_container = vm.$select('mutil_model_property_container')
          let t = vm.$select('mutil_model_property_container')
          // 左边树的点击查询参数
          if (property_container.$ds?.clickStatus) {
            params = tableFilter(vm, params)
          } else {
            // 储存方式跳转过来的参数
            params.args.filter = vm.$cmd.meta.addSearch(params.args.filter, [
              ['id', '=', t.$ds.rowData.id],
              ['appNameTag', 'in', [t.$ds.rowData.appNameTag]],
              ['modelName', '=', t.$ds.rowData.modelName],
              ['type', '=', 'CurrentModel']
            ])
          }
          return await vm.super['grid.queryCount'](vm, params, options)
        },
        afterQuery: async (vm, params, options) => {
          setTimeout(() => {
            if (scrollTop) {
              let table_main_table = vm.$select('mutil_model_property_menu_table_main_table')
              table_main_table.instance.$refs.xGrid.scrollTo(0, scrollTop)
              scrollTop = null
            }
          }, 200)
          return await vm.super['grid.afterQuery'](vm, params, options)
        }
      }
    }
  },

  mutil_model_property_menu_table_main_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_model_property_menu_table_main'
    },
    type: 'custom',
    beforeOperate: (app, operateItem, options) => {
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
            reqPrep: (vm, options, config) => {
              // 扩展请求前入参
              if (!options.params.args.filter.length) {
                let property_container = vm.$select('mutil_model_property_container')
                let t = vm.$select('mutil_model_property_container')
                // 左边树的点击查询参数
                if (property_container.$ds?.clickStatus) {
                  options.params = tableFilter(vm, options.params)
                } else {
                  // 储存方式跳转过来的参数
                  options.params.args.filter = vm.$cmd.meta.addSearch(options.params.args.filter, [
                    ['id', '=', t.$ds.rowData.id],
                    ['appNameTag', 'in', [t.$ds.rowData.appNameTag]],
                    ['modelName', '=', t.$ds.rowData.modelName],
                    ['type', '=', 'CurrentModel']
                  ])
                }
              }
              return options
            }
          }
        ]
      }
    }
  },

  // 数据多语言树点击
  mutil_data_menu_tree_main_wrap_left_extend_view: {
    selector: {
      attr: 'id',
      value: 'mutil_data_menu_tree_main_wrap_left'
    },
    type: 'custom',
    beforeOperate: (app, operateItem, options) => {
      if (!options.element._customRestClickFn) {
        let clickFn = options.element.bind_on_clickTreeNode
        options.element.bind_on_clickTreeNode = (params) => {
          const { self: vm, value } = params
          clickFn(params)
          // 多语言属性
          let property_container = vm.$select('mutil_model_property_container')
          if (property_container) {
            property_container.data.display = false
          }
          setTimeout(() => {
            // 储存方式
            let refreshBox = vm.$select('mutil_model_store_mode_menu_table_main_toolbar_refresh')
            let paging = vm.$select('mutil_model_store_mode_menu_table_main_paging')
            if (refreshBox && refreshBox?.instance) {
              paging.$ds.paging.currentPage = 1
              paging.$ds.paging.pageSize = 30
              paging.$ds.paging.pageStart = 0
              refreshBox.instance.click()
            } else {
              let store_mode_container = vm.$select('mutil_model_store_mode_container')
              if (store_mode_container) {
                store_mode_container.data.display = true
              }
            }
          }, 200)
        }
        options.element._customRestClickFn = true // 防止重复点击
      }
    }
  },

  // 储存方式和多语言属性切换
  mutil_model_store_mode_menu_container_table_search_extend_view: {
    type: 'before',
    selector: {
      attr: 'id',
      pre: ['mutil_model_store_mode_menu_', 'mutil_model_property_menu_'],
      value: 'container_table_search' //
    },
    view: {
      type: 'steps',
      id: 'mutil_model_store_mode_menu_container_steps',
      css: `
        #mutil_model_store_mode_menu_container_steps .el-step__title.is-process {
          color: #aaa;
          font-weight: normal;
        }
        #mutil_model_store_mode_menu_container_steps .el-step__head.is-process {
          color: #aaa;
          border-color: #aaa;
        }
        #mutil_model_store_mode_menu_container_steps .is-finish:first-child {
          cursor: pointer;
        }
        .search_dropdown.meta-dropdown-css-mutil_model_property_menu_dropdown_pop_form, .search_dropdown.meta-dropdown-css-mutil_model_store_mode_menu_dropdown_pop_form{
          z-index: 2000 !important;
        }
      `,
      style: {
        width: '50%',
        margin: '10px auto 0'
      },
      bind_active: '$ds.currentSteps',
      created: (vm) => {
        if (vm.$ds.currentSteps == 2) {
          setTimeout(() => {
            let setps = document.querySelector(
              '#mutil_model_store_mode_menu_container_steps>div:nth-child(1)'
            )
            if (setps) {
              setps.addEventListener('click', function () {
                vm.$select('mutil_model_store_mode_container').data.display = true
                // 放开多语言属性
                vm.$select('mutil_model_property_container').data.display = false
              })
            }
          }, 200)
        }
      },
      dataList: [
        {
          title: Tech.$t('mutilLang.storageMethod')
        },
        {
          title: Tech.$t('mutilLang.multilingualProperties')
        }
      ]
    }
  },

  // 多语言属性页面译文储存方式添加提醒
  mutil_model_store_mode_menu_table_main_table_column_translateStoreMode_ex: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'mutil_model_store_mode_menu_table_main_table_column_translateStoreMode' //
    },
    beforeOperate: (app, operateItem, options) => {
      options.element.css = `
        .mutil_model_store_mode_menu_table_main_table_column_translateStoreMode_icon {
          margin-left: 5px;
          color: #666;
        }
      `
      setTimeout(() => {
        let currentNode = document.querySelector(
          '#mutil_model_store_mode_menu_table_main thead tr th:nth-child(3) .c--ellipsis'
        )
        if (!currentNode) return
        let icon = currentNode.querySelector('.el-icon-info')
        if (currentNode && !icon) {
          var child = document.createElement('i')
          child.className =
            'el-icon-info mutil_model_store_mode_menu_table_main_table_column_translateStoreMode_icon'
          child.title = Tech.$t('mutilLang.migration')
          currentNode.appendChild(child)
        }
      }, 500)
    }
  },

  // 数据多语言tbs
  mutil_data_menu_table_main_wrap_extend_view: {
    type: 'replace',
    selector: {
      attr: 'id',
      value: 'mutil_data_menu_table_main_wrap' //
    },
    beforeOperate: (app, operateItem, options) => {
      options.originElement.displayName = Tech.$t('mutilLang.dataTranslation')
      operateItem.view.activeId = options.originElement.id
      operateItem.view.items.unshift(options.originElement)
      return operateItem.view
    },
    view: {
      type: 'tabs',
      bind_on_goto: (params) => {
        const { self: vm } = params
        let mode_container = vm.$select('mutil_model_store_mode_container')
        if (isInit) {
          isInit = false
          mode_container.data.display = false
          setTimeout(() => {
            mode_container.data.display = true
          }, 200)
        }
      },
      id: 'mutil_data_menu_tabs',
      activeId: '',
      lazy: true,
      close: false,
      items: [
        {
          type: 'container',
          id: 'mutil_model_store_mode_wrap',
          css: `
          #mutil_model_store_mode_wrap, #mutil_model_store_mode_container_view_created, #mutil_model_store_mode_container, #mutil_model_property_container_view_created, #mutil_model_property_container {
            height: 100%
          }
          `,
          displayName: Tech.$t('mutilLang.multilingualProperties'), // 选项卡标题
          items: [
            {
              type: 'container',
              display: false,
              id: 'mutil_model_store_mode_container',
              dataSource: {
                currentSteps: 1
              },
              items: [],
              view: {
                created: {
                  // 新视图节点定义
                  _parentId: 'mutil_model_store_mode_container', // 拷贝注册管理的视图
                  openView: {
                    showType: 'container',
                    app: 'sie-iidp-i18n',
                    preId: 'mutil_model_store_mode_menu_',
                    model: 'mutil_model_store_mode',
                    type: 'mutil_model_store_mode_form,mutil_model_store_mode_grid,mutil_model_store_mode_search'
                  }
                }
              }
            },
            {
              type: 'container',
              id: 'mutil_model_property_container',
              dataSource: {
                currentSteps: 2,
                rowData: {},
                clickStatus: false
              },
              display: false,
              items: [],
              view: {
                created: {
                  // 新视图节点定义
                  _parentId: 'mutil_model_property_container', // 拷贝注册管理的视图
                  openView: {
                    showType: 'container',
                    app: 'sie-iidp-i18n',
                    preId: 'mutil_model_property_menu_',
                    model: 'mutil_model_property',
                    type: 'mutil_model_property_form,mutil_model_property_grid,mutil_model_property_search'
                  }
                }
              }
            }
          ]
        }
      ]
    }
  },

  // 多语言属性页面--- 模型名称
  mutil_model_store_mode_menu_form_main_table_search_common_items_0_items_modelName_extend_view: {
    type: 'merge',
    selector: {
      attr: 'id',
      pre: [
        'mutil_model_store_mode_menu_form_main_table_search_common_items_0_items_modelName',
        'mutil_model_property_menu_form_main_table_search_common_items_0_items_propertyName',
        'mutil_model_property_menu_form_main_table_search_common_items_0_items_modelName',
        'mutil_model_property_menu_form_main_table_search_dropdown_items_0_items_modelName',
        'mutil_data_menu_form_main_table_search_common_items_0_items_propertyName',
        'mutil_data_menu_form_main_table_search_dropdown_items_0_items_propertyName',
        'mutil_data_menu_form_main_table_search_dropdown_items_0_items_modelName',
        'mutil_data_menu_form_main_table_search_common_items_0_items_languageCode',
        'mutil_data_menu_form_main_table_search_dropdown_items_0_items_status',
        'mutil_data_menu_form_main_table_search_common_items_0_items_status'
      ],
      value: ''
    },
    view: {
      reqPrep: (vm, params) => {
        let property_container = vm.$select('mutil_model_property_container')
        if (params.model == 'mutil_model_property' && !property_container?.$ds?.clickStatus) {
          // 储存方式跳转过来的参数
          params.args.filter = vm.$cmd.meta.addSearch(params.args.filter, [
            ['id', '=', property_container.$ds.rowData.id],
            ['appNameTag', 'in', [property_container.$ds.rowData.appNameTag]],
            ['modelName', '=', property_container.$ds.rowData.modelName],
            ['type', '=', 'CurrentModel']
          ])
        } else {
          params = tableFilter(vm, params)
        }
        return params
      } // 请求前钩子
    }
  },

  // 多语言属性表格扩展
  mutil_model_store_mode_menu_table_main_table_extend: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'mutil_model_store_mode_menu_table_main_table'
    },
    beforeOperate: (app, operateItem, options) => {
      options.element.bind_on_clickOptionBtn = (res) => {
        const { self: vm, value } = res

        if (!value.scope.row.translateStoreMode) {
          window.ELEMENT.Message.error(Tech.$t('mutilLang.selectstorageTranslation'))
          return
        }

        if (value.scope.row.isEdit) {
          window.ELEMENT.Message.error(Tech.$t('mutilLang.saveData'))
          return
        }

        vm.$select('mutil_model_store_mode_container').data.display = false
        let propertyContainer = vm.$select('mutil_model_property_container')
        propertyContainer.$ds.rowData = value.scope.row
        setTimeout(() => {
          propertyContainer.data.display = true
        })
        propertyContainer.$ds.clickStatus = false
      }
    }
  },

  // 多属性表格扩展
  mutil_model_property_menu_table_main_table_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'mutil_model_property_menu_table_main_table'
    },
    beforeOperate: (app, operateItem, options) => {
      // 定位到表格的操作列
      if (!options.element._reset_bind_on_cellClick) {
        options.element.bind_on_cellClick = async (res) => {
          const { self: vm } = res
          const field = res.value?.column?.field
          let row = res.value.row
          if (!row?.id) {
            delete row.id
          } else {
            if (row.id.startsWith('row') || row.id.startsWith('ROW')) {
              delete row.id
            }
          }
          if (field == 'isMutilLanguage') {
            const param = {
              args: {
                valuesList: [row],
                useDisplayForModel: true
              },
              app: 'sie-iidp-i18n',
              service: 'createOrUpdate',
              context: {
                uid: '',
                lang: window.Tech?.LANG?.locale || 'zh_CN'
              },
              model: 'mutil_model_property',
              tag: 'master'
            }

            scrollTop = vm.instance.$refs.xGrid.getScroll().scrollTop
            let result = await window.Tech.httpMeta({
              data: {
                params: param
              }
            })
            if (result?.data) {
              window.ELEMENT.Message.success(Tech.$t('mutilLang.modificationSuccessful'))
              const refresh = vm.$select(vm.$ds.idPre + 'table_main_toolbar_refresh')
              refresh.instance.click()
            }
          }
        }
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
  }
}
