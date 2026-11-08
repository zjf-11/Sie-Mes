

import globalIcon from './images/globel.svg'
export default {

  // 登录页多语种下拉
  login_langs_change_extend_view: {
    type: 'before',
    selector: {
      attr: 'id',
      value: 'row_meta_login_row2' // 模型名字+_table_main
    },
    beforeOperate: (app, operateItem, options) => {
      const view = {
        type: 'container',
        span: 12,
        items: [
          {
            type: 'form',
            id: 'meta_login_lang_form',
            dataSource: {
              form: {
                lang: 'zh-CN'
              },
              langOptions: []
            },
            formConfig: {
              inline: true,
              labelPosition: 'top'
            },
            style: {
              marginTop: '4px'
            },
            created: async (vm) => {
              let defaultLang =
                window.navigator.language ||
                navigator.userLanguage ||
                navigator.browserLanguage ||
                navigator.systemLanguage ||
                '';
              // 获取默认语言设置为下拉选中
              if (window.Tech?.LANG?.locale) {
                defaultLang = window.Tech?.LANG?.locale;
              }
              // 获取缓存的默认语言设置为下拉选中
              if (window.localStorage?.getItem('defaultLang')) {
                defaultLang = window.localStorage.getItem('defaultLang');
              }
              window.localStorage.setItem('defaultLang', defaultLang);
              vm.$ds.form.lang = defaultLang;
              // 获取多语言下拉框数据
              window.Tech.httpMeta({
                url: '/rpc/open/service',
                data: {
                  // 参考元模型后端的传参规范
                  params: {
                    args: {},
                    service: 'searchLanguageOfLogin',
                    model: 'mutil_language',
                    app: 'sie-iidp-i18n'
                  }
                }
              }).then((res) => {
                const langs = res;
                // 补充到支持语言全局变量
                if (langs?.data?.length && window?.tech?.supportLangs) {
                  langs.data.map((item) => {
                    window.tech.supportLangs[item.value] = {
                      name: item.label
                    };
                  });
                }
                vm.$ds.langOptions =
                  langs.data && langs.data.length > 0
                    ? langs.data
                    : [{ value: 'zh-CN', label: '中文' }];
              });
            },
            items: [
              {
                type: 'select',
                name: 'lang',
                id: 'meta_login_lang',
                bind_options: '$ds.langOptions',
                span: 12,
                clearable: false,
                style: {
                  marginTop: '5px',
                  minWidth: '120px'
                },
                bind_on_changeHandler: (params) => {
                  window.localStorage.setItem('defaultLang', params.value);
                  const href = vm.$cmd.meta.changeURLArg(
                    window.location.href,
                    'lang',
                    params.value
                  );
                  window.location.href = href;
                }
              }
            ]
          }
        ]
      };
      options.element.items.unshift(view);
    }
  },
  // 登录接口参数修改
  login_change_params_extend_view: {
    type: 'custom',
    selector: {
      attr: 'id',
      value: 'button_meta_login_btn' // 模型名字+_table_main
    },
    beforeOperate: (app, operateItem, options) => {
      let tableDataDsConfig = options.element.ds_config;
      tableDataDsConfig.reqPrep = operateItem.view.ds_config.list[0].reqPrep;
      tableDataDsConfig.reqAfter = operateItem.view.ds_config.list[0].reqAfter;
    },
    view: {
      ds_config: {
        list: [
          {
            name: 'form',
            reqPrep: (vm, options, config) => {
              // 扩展请求前入参
              const langForm = vm.$select('meta_login_lang_form');
              options.params.languageFavorite = langForm.$ds.form.lang;
              vm.data.loading = true;
              return options;
            },
            reqAfter: async (vm, res, config) => {
              // 扩展请求后数据
              const langForm = vm.$select('meta_login_lang_form');
              if (res.result) {
                // 获取多语言下拉框数据
                const resObj = res.result.data;
                window.Tech.token.set(resObj.token);
                const params = {
                  url: '/rpc/open/service',
                  args: {
                    values: {
                      userId: resObj.id,
                      languageFavorite: langForm.$ds.form.lang
                    }
                  },
                  service: 'createOrUpdateLanguageFavorite',
                  model: 'user_language_favorite',
                  app: 'sie-iidp-i18n'
                };
                sessionStorage.setItem('userId', resObj.id);
                const loginVm = vm.$select('page_meta_login');
                await loginVm.request('changeLangs', params);
              }
              vm.data.loading = false;
              return res;
            }
          }
        ]
      }
    }
  },
  // 右上角多语言切换
  dropdown_meta_header_lang_extend_view: {
    type: 'before',
    selector: {
      attr: 'id',
      value: 'dropdown_meta_header_skin'
    },
    view: {
      type: 'container',
      created: async (vm) => {
        let res = await window.Tech.httpMeta({
          data: {
            // 参考元模型后端的传参规范
            params: {
              args: {
                apps: [
                  {
                    appName: 'sie-iidp-i18n',
                    appTag: 'master'
                  }
                ],
                type: 'all'
              },
              service: 'queryCustomPermissionV2',
              model: 'custom_view_model',
              app: 'sie-iidp-iam'
            }
          }
        })
        let mutilLangTranslate = JSON.parse(localStorage.getItem('mutilLangTranslate'))
        let interpretive = vm.$select('header_interpretive_scheme_button')
        const isDisplay = res?.data[0]?.views[0]?.Custom[0]?.isDisplay;
        if (isDisplay) {
          interpretive.data.display = true
        } else {
          interpretive.data.display = false
        }
      
        if (!isDisplay && mutilLangTranslate) {
          // 如果有开启过翻译模式，关闭翻译模式
          localStorage.setItem('mutilLangTranslate', false);
          return;
        }
        if (mutilLangTranslate) {
          interpretive.data.value = Tech.$t('mutilLang.closeTranslation')
        } else {
          interpretive.data.value = Tech.$t('mutilLang.openTranslation')
        }
        window.tech.langEdit = mutilLangTranslate

        // let newParagraph = document.createElement("img");
        // newParagraph.className = 'iconfont icon-diqiu'
        // let parentElement = document.getElementById("header_interpretive_scheme_button");
        // parentElement.appendChild(newParagraph);

      },
      items: [
        {
          type: 'button',
          id: 'header_interpretive_scheme_button',
          className: 'header_interpretive_scheme_button',
          css: `
            #header_interpretive_scheme_button {
              position: relative;
              margin-right: 17px;
              margin-left: 7px;
              color: #fff;
             
            }
            #header_interpretive_scheme_button .icon-diqiu {
              position: absolute;
              top: 7px;
              margin-left: 3px
            }

            #header_interpretive_scheme_button span span {
              position: relative;
            }
            #header_interpretive_scheme_button  span span:after {
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
          `,
          value: Tech.$t('mutilLang.openTranslation'),
          bind_on_click: (params) => {
            let vm = params.self;
            let mutilLangTranslate = JSON.parse(localStorage.getItem('mutilLangTranslate'));
            if (mutilLangTranslate) {
              let label = vm.$select('tabs_meta_main_content_labels')
              let isNotSave = false;
              label.data.items.forEach((item) => {
                let table_detail = vm.$select(item.idPre + 'table_detail')
                if (table_detail?.data.display && table_detail?.$ds?.isNotSave) {
                  isNotSave = true
                }
              })
              if (isNotSave) {
                window.Tech.confirmbox({
                  width: '45%',
                  title: Tech.$t('mutilLang.pointOut'),
                  items: [
                    {
                      value: Tech.$t('mutilLang.whetherCloseTranslation'),
                      type: 'text',
                    },
                  ],
                  options: {
                    confirm: (close) => {
                      localStorage.setItem('mutilLangTranslate', false);
                      vm.data.value = Tech.$t('mutilLang.openTranslation')
                      window.location.reload()
                      //确定按钮
                      close();
                    },
                    cancel: (close) => {
                      //取消按钮
                      close();
                    },
                  },
                });
              } else {
                localStorage.setItem('mutilLangTranslate', false);
                vm.data.value = Tech.$t('mutilLang.openTranslation')
                setTimeout(() => {
                  window.location.reload()
                })

              }
            } else {
              window.ELEMENT.Message.success(Tech.$t('mutilLang.openSuccessful'));
              localStorage.setItem('mutilLangTranslate', true);
              vm.data.value = Tech.$t('mutilLang.closeTranslation')
              setTimeout(() => {
                window.location.reload()
              }, 200)

            }
          },
          display: false,
          options: {
            type: 'text'
          }
        },
        {
          type: 'meta-dropdown', // 切换语言环境组件
          id: 'dropdown_meta_header_lang',
          className: 'dropdown_change_lang',
          dropdownClassName: 'dropdown_change_lang_select',
          css: `
            .dropdown_change_lang{margin: 0 10px}
            .dropdown_change_lang .el-button--text{color: #fff} 
            .dropdown_change_lang_select .el-dropdown-menu__item {padding: 0;}
            .dropdown_change_lang_select .el-button{
              height: 0.36rem;
              width: 100%;
              display: block;
              padding: 0 0.05rem;
              margin: 0rem;
              border: 0rem;
              line-height: 0.36rem;
              color: rgb(102, 102, 102);
              font-size: 0.14rem;
              background-color: rgb(255, 255, 255);
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
            }
          `,
          style: {
            position: 'relative'
          },
          dropdownStyle: {
            // 弹窗的style样式
            width: '1.5rem',
            padding: '0.1rem 0',
            textAlign: 'center'
          },
          dataSource: {
            langVal: Tech.$t('header.lang')
          },
          ds_config: {
            list: [
              {
                name: 'settingLang',
                type: 'meta',
                autoRequest: false,
                method: 'save',
                options: {
                  params: {
                    args: {},
                    service: 'languageSwitch',
                    model: 'mutil_language',
                    app: 'sie-iidp-i18n'
                  }
                }
              }
            ]
          },
          placement: 'bottom',
          created: (vm) => {
            // 获取多语言数据，整理后赋值给下拉选择
            window.Tech.httpMeta({
              url: '/root/rpc/service',
              data: {
                // 参考元模型后端的传参规范
                params: {
                  args: {},
                  service: 'selectLangAfterLogin',
                  model: 'mutil_language',
                  app: 'sie-iidp-i18n'
                }
              }
            }).then((res) => {
              const langs = res;
              // 补充到支持语言全局变量
              if (langs?.data?.length && window?.tech?.supportLangs) {
                langs.data.map((item) => {
                  window.tech.supportLangs[item.value] = {
                    name: item.label
                  };
                });
              }
              const langOptions =
                langs.data && langs.data.length > 0
                  ? langs.data
                  : [{ value: 'zh-CN', label: '中文简体' }];
              if (langOptions.length === 1 && langOptions[0].value === 'zh-CN') {
                window.localStorage.setItem('defaultLang', 'zh-CN');
                const curUrlLang = window.location.href.match(/[\?&]lang=([^&#]*)/)?.[1] || 'zh-CN';
                if (curUrlLang !== 'zh-CN') {
                  const href = vm.$cmd.meta.changeURLArg(window.location.href, 'lang', 'zh-CN');
                  window.location.href = href;
                }
              }
              const curLang = window.localStorage.getItem('defaultLang');
              window.Tech.LANG.locale = curLang;
              if (langOptions) {
                const dropdownVm = vm.$select('dropdown_meta_header_lang_buttons');
                dropdownVm.data.items = [];

                setTimeout(() => {
                  for (let i = 0; i < langOptions.length; i++) {
                    const element = langOptions[i];
                    const ele = {
                      id: 'lang_item_' + element.value,
                      type: 'button',
                      value: element.label,
                      dataV: element.value,
                      title: element.label,
                      bind_on_click: async (param) => {
                        const { self: vm } = param
                        const href = vm.$cmd.meta.changeURLArg(
                          window.location.href,
                          'lang',
                          vm.data.dataV
                        );
                        // console.log(vm.data.dataV)
                        // 获取用户信息传入设置语言接口
                        const userInfo = window.tech.userInfo;
                        const params = {
                          args: {
                            values: {
                              languageFavorite: vm.data.dataV,
                              userId: userInfo.id,
                            },
                          },
                        }
                        window.localStorage.setItem('defaultLang', vm.data.dataV)
                        // const langData = await vm.request('settingLang', params)
                        // sessionStorage.setItem('langData', JSON.stringify(langData.data))
                        // 切换语言后只保留一个菜单
                        // let labels = vm.$select('tabs_meta_main_content_labels')
                        // let activeId = labels.data.activeId
                        // let cache = JSON.parse(sessionStorage.getItem('tabs_meta_main_content_labels'));
                        // cache.menus = cache.menus.filter(i => i.id == activeId)
                        // sessionStorage.setItem('tabs_meta_main_content_labels', JSON.stringify(cache))
                        setTimeout(() => {
                          window.location.href = href
                        })
                      },
                    }
                    vm.app.updatePageNode(ele, dropdownVm, (node) => {
                      dropdownVm.data.items.push(window.Tech._cloneDeep(ele));
                    });
                    if (element.value === curLang) {
                      vm.$ds.langVal = element.label;
                    }
                  }
                });
                // 获取当前用户选择的语种
              }
            });
          },
          items: [
            {
              name: 'defaultBtn', // 'customBtn',自定义的按钮，可以是任意的组件
              buttonClose: {
                bind_text: '${$ds.langVal}',
                icon: 'el-icon-arrow-down'
              },
              buttonOpen: {
                bind_text: '${$ds.langVal}',
                icon: 'el-icon-arrow-up'
              }
            },
            {
              type: 'container',
              id: 'dropdown_meta_header_lang_buttons',
              items: [],
            },
          ],
        },
      ],
    },
  },
}
