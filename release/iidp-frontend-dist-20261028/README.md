# iidp-demo 前端运行包

本包用于在**不安装 Node.js、不运行 npm** 的前提下运行 IIDP 前端，由 nginx 托管构建好的 `dist` 产物，并把接口反向代理到后端引擎与授权服务。

```
iidp-frontend-dist-20261028/
├── dist/                      # 前端构建产物（webpack 生产构建）
├── nginx/conf/nginx.conf      # nginx 配置（相对路径，随包移动无需修改）
├── nginx/conf/mime.types      # MIME 类型表
├── grant/grant-dev.mac        # 开发模式授权服务（macOS arm64）
├── grant/grant-dev.exe        # 开发模式授权服务（Windows x64）
├── sql/platform-web-app-init.sql # 平台前端应用关联 SQL（首次必须执行，见第七章）
├── scripts/mac/               # macOS 启停脚本
├── scripts/windows/           # Windows 启停脚本
├── logs/                      # nginx 日志与 pid（运行时生成）
└── README.md
```

---

## 一、端口与依赖

| 组件 | 端口 | 说明 |
| --- | --- | --- |
| nginx（本包） | **30666** | 托管前端，同时反代后端与授权服务 |
| 后端引擎（sie-iidp-demo-start） | **8061** | 需另行启动，本项目端口被 aios 占用故用 8061 |
| 授权服务（grant-dev） | **8080** | 本包附带，开发模式，免数据库 |

访问地址：<http://localhost:30666/iidp/>

默认账号：

| 账号 | 密码 | 说明 |
| --- | --- | --- |
| `implementer` | `Implementer_2023` | 平台管理员 |
| `admin_000001` | `Admin_000001` | 租户管理员（租户 000001） |

---

## 二、环境要求

**本包已内置 nginx，无需另行安装**：

- macOS arm64：`nginx/sbin/nginx`
- Windows x64：`nginx/nginx.exe`

脚本会**优先使用包内 nginx**；包内缺失时回退到系统 `PATH` 中的 nginx（Linux 请自行安装 nginx，或把可执行文件放到 `nginx/sbin/nginx`）。

> 注意：`nginx/conf/nginx.conf` 使用相对路径（`dist`、`logs`），脚本以本包根目录作为 nginx prefix（`-p`）启动，因此整个目录可以随意搬移、重命名。

---

## 三、启动前端（nginx）

### macOS

```bash
cd scripts/mac
./start.sh      # 启动（已在运行则 reload）
./reload.sh     # 重新加载配置
./status.sh     # 查看状态
./stop.sh       # 停止
```

首次执行如提示没有权限：

```bash
chmod +x scripts/mac/*.sh
```

### Windows

双击或在命令行执行（`scripts\windows\` 目录下）：

```bat
start.bat       :: 启动（已在运行则 reload）
reload.bat      :: 重新加载配置
status.bat      :: 查看状态
stop.bat        :: 停止
```

启动后浏览器访问 <http://localhost:30666/iidp/>。

---

## 四、nginx 配置要点

配置文件：`nginx/conf/nginx.conf`。各段作用如下，按需修改即可（改完执行 `reload` 脚本）。

> 注意：`dist/config/nginx/nginx.conf` 是前端构建产物里自带的样例配置，**不参与运行**，请勿修改，以免改错文件。

### 1. 前端静态资源

```nginx
# 根路径跳转到前端入口
location = / {
    return 302 /iidp/;
}

# 前端产物：前端资源前缀是 /iidp/，SPA 路由回退到 index.html
location /iidp/ {
    alias dist/;
    index index.html;
    try_files $uri $uri/ /iidp/index.html;
}
```

要点：

- `dist` 是相对路径，相对于 nginx 的 **prefix**（即本包根目录），不是 nginx 安装目录。
- 前端 `publicPath` 是 `/iidp/`，所以 URL `/iidp/js/xxx.bundle.js` 必须映射到 `dist/js/xxx.bundle.js`；用 `alias dist/` 完成这个映射。
- `try_files ... /iidp/index.html` 是 SPA 回退，菜单类路由（如 `/iidp/base/tenants/tenant_management_menu`）刷新页面时不会 404。

### 2. 应用包与站点级静态目录

```nginx
location /umdComps/      { root dist/views; }   # → dist/views/umdComps/
location /config/        { root dist; }         # → dist/config/
location /resource/      { root dist; }
location /static-resource/ { root dist; }
location /views/         { root dist; }
location /model-views/   { root dist; }
```

要点：

- 前端把应用包、`config/apps.json` 等按**站点根路径**引用（`/umdComps/...`、`/config/apps.json`），不是 `/iidp/` 前缀，因此必须单独映射，否则会命中 SPA 回退返回 `index.html`，表现为"页面出来了但功能按钮无响应"。
- `root dist/views` + URI `/umdComps/...` 得到 `dist/views/umdComps/...`。

### 3. 后端与授权服务反向代理

```nginx
# 后端引擎
location /api/ {
    proxy_pass http://127.0.0.1:8061/;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;
}

# 授权服务
location /register/ {
    proxy_pass http://127.0.0.1:8080/;
}

# 文件服务（走本机后端）
location /fileSystem/ {
    proxy_pass http://127.0.0.1:8061/fileSystem/;
}

# 引擎消息推送（websocket）
location /ws {
    proxy_pass http://127.0.0.1:8061/ws;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

要点：

- `proxy_pass` 结尾带 `/` 会**剥掉匹配到的前缀**：`/api/root/rpc/...` → 后端收到 `/root/rpc/...`。反过来，如果后端地址本身带路径（如 `http://host:8061/api/`），结尾斜杠的写法要相应调整。
- 前端 `apiHost` 固定为 `/api`，所以后端换端口/换机器时**只需改这里的 `proxy_pass`**，前端产物无需重新构建。
- `client_max_body_size 500m`：上传大文件需要，已在 `http` 块设置。

### 4. 换后端地址

```nginx
location /api/ {
    proxy_pass http://192.168.1.10:8061/;   # 改成目标后端
}
```

改完执行 `reload` 脚本即可，不用重新打包。

---

## 五、开发模式授权服务

`grant/grant-dev.*` 是**本地开发版**授权服务，特点：

- **不需要数据库**（配置与设备信息都在内存）
- 任何引擎注册都放行，不校验 CPU / 内存 / 节点数
- 授权恒为有效期 **2099-12-31**，应用全放行
- 可执行文件名含 `dev` 即自动进入开发模式（也支持环境变量 `GRANT_MODE=dev` 或启动参数 `-dev`）

### macOS

```bash
cd scripts/mac
./start-grant-dev.sh    # 启动，监听 8080
./stop-grant-dev.sh     # 停止
```

### Windows

```bat
cd scripts\windows
start-grant-dev.bat
stop-grant-dev.bat
```

启动后可用以下地址自检（浏览器直接访问）：

- `http://127.0.0.1:8080/api/v1/app/expired` → `{"code":0,"err":"","data":[]}`
- 后端启动日志出现 `引擎注册结果：true` 即表示授权已通过

> 生产环境请改用正式版授权服务（`sie-grant` 用 `make build_grant_*` 构建），它需要 MySQL 且按 license 限制资源。

---

## 六、启动顺序

1. 授权服务：`start-grant-dev.sh` / `start-grant-dev.bat`（8080）
2. 后端引擎：`java -jar sie-iidp-demo-start-1.0-SNAPSHOT.jar`（8061）
3. nginx：`start.sh` / `start.bat`（30666）
4. 浏览器打开 <http://localhost:30666/iidp/>

顺序不是强制的，但后端启动时要访问授权服务（8080），所以建议先起授权服务。

---

## 七、平台前端应用关联 SQL（首次必须执行）

初始化数据库后需执行下面 SQL，把平台侧五个前端应用关联到本地 umdComps 包名：

```sql
-- 一、租户授权依赖（三条）
UPDATE meta_app SET view_file = 'sie-iidp-app-store-web' WHERE name = 'sie-iidp-app-store';
UPDATE meta_app SET view_file = 'sie-iidp-iam-web'       WHERE name = 'sie-iidp-iam';
UPDATE meta_app SET view_file = 'sie-iidp-tenant-web'    WHERE name = 'sie-iidp-tenant';

-- 二、开发者中心（「模型管理 → 生成视图」依赖）
UPDATE meta_app SET view_file = 'sie-iidp-dev-center-web' WHERE name = 'sie-iidp-dev-center';

-- 三、国际化（右上角语言切换入口依赖，需后端已安装 sie-iidp-i18n 应用）
UPDATE meta_app SET view_file = 'sie-iidp-i18n-web' WHERE name = 'sie-iidp-i18n';
```

**为什么需要**：这些页面的自定义动作（授权弹窗、生成视图结果框、语言切换等）是由对应的 web 应用注册的。`view_file` 为空时前端拿不到应用包，动作不会注册，表现就是**按钮点了完全没反应、控制台也不报错**——但后端接口其实是正常的（例如 `buildDefaultViews` 会正常返回视图 JSON，只是没人展示）。这些语句只影响前端应用与后端记录的关联，不涉及权限数据，重复执行无副作用。

**执行方式**（本包已附带脚本 `sql/platform-web-app-init.sql`，数据库名以实际为准）：

```bash
# 命令行导入
mysql -h127.0.0.1 -P3306 -uroot -p iidp_demo_v3 < sql/platform-web-app-init.sql

# 或在 mysql 客户端内
# USE iidp_demo_v3;
# SOURCE sql/platform-web-app-init.sql;
```

校验（应返回 5 行，`view_file` 均不为空）：

```sql
SELECT name, view_file FROM meta_app
WHERE name IN ('sie-iidp-app-store', 'sie-iidp-iam', 'sie-iidp-tenant',
               'sie-iidp-dev-center', 'sie-iidp-i18n');
```

执行完成后刷新前端页面，再按以下步骤授权：

1. 用 `implementer` 登录 → 「多租户 → 租户管理」
2. 选中目标租户，点该行的「授权」
3. 在应用树里勾选需要的产品线/应用（含 `生产制造MES-APP(mes)` 可让租户看到 MES 菜单），点「confirm」保存
4. 用该租户的管理员账号（如 `admin_000001`）登录，即可看到已授权应用的菜单与功能

> 注：`sql/` 目录在发布包根目录下；源码工程内的同名文件位于 `iidp-backend-demo/sql/platform-web-app-init.sql`。

---

## 八、常见问题

**页面白屏或空白**
打开浏览器开发者工具 Console / Network。若 `index.html` 200 但 JS 404，多半是 `location /iidp/` 的 `alias` 路径不对（应为相对本包根目录的 `dist/`）。

**页面能打开，但菜单点不动 / 功能按钮无反应**
先确认第七章的 SQL 已执行；再检查 `/umdComps/*/config/app.json` 是否 200。返回 `index.html`（HTML）说明该 location 没匹配上，被 SPA 回退吞掉了。

**界面显示英文 / 标签直接显示成 `functionalPermission` 这样的原始键**
两种不同原因，按表现区分：

- 显示**原始键**（`functionalPermission`，无空格）：语言包文件没加载。检查 Network 里 `resource/<应用>/langs/zh-CN/lang.json` 是否 404。若是 404，看请求路径里的应用目录名是否与 `dist/views/umdComps/` 下的实际目录一致——前端用 `config/apps.json` 里 `apps.<应用>.master` 的 **KEY** 作为资源目录名，键名多写或少写 `tech-` 前缀都会导致 404。
- 显示**英文短语**（`Functional permission`，有空格）：语言包已加载，只是当前 locale 是 `en-US`。点右上角「language / 中文(简体)」切换即可；若无该入口，说明后端未安装 `sie-iidp-i18n` 应用（切换器由该应用的前端包提供）。

**登录报"用户名或密码错误"**
前端会把密码做 MD5 后提交，服务端再按 `sha256(md5 + salt)` 校验。手工用接口测试时，`password` 字段要传 **MD5 值**，不是明文。

**登录后看不到某个应用的菜单**
需要在「多租户 → 租户管理 → 授权」里给该租户勾选对应应用。另注意侧边栏按**路由所属产品线**显示菜单：访问 `/iidp/MES/...` 显示 MES 菜单，访问 `/iidp/base/...` 显示平台菜单，不是菜单丢失。

**8080 / 30666 被占用**
改 `nginx/conf/nginx.conf` 的 `listen`，或改授权服务端口（`grant-dev` 默认读环境变量 `PORT`，未设置则用 8080；也可直接改脚本里的启动参数）。

**日志位置**
`logs/error.log`、`logs/access.log`（nginx）；授权服务日志在 `logs/grant-dev.log`。
