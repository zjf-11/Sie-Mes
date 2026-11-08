# MES 应用设计文档

| 项目 | 内容 |
|------|------|
| 应用名称 | `mes`（生产制造管理） |
| 平台 | IIDP 3.0（SDK 应用开发模式） |
| 代码位置 | `iidp-backend-demo/sie-iidp-demo-apps/sie-snest-mes` |
| 数据库 | MySQL 8 — `iidp_demo_v3` |
| 版本 | 1.0 |
| 日期 | 2026-11-08 |

---

## 1. 文档说明

### 1.1 目的

本文档针对 MES 应用的 7 项功能需求，给出需求分析、总体设计、数据设计、详细设计、接口设计、界面设计、部署与测试方案，作为开发、验收和后续维护的依据。

### 1.2 范围

覆盖产品管理、物料管理、产品 BOM、编码规则与编码服务五个功能域，以及它们涉及的模型、视图、服务与数据库变更。

### 1.3 术语

| 术语 | 说明 |
|------|------|
| 模型（Model） | IIDP 中的业务实体定义，Java 类 + 注解，对应一张业务表 |
| 视图（View） | 以 JSON 描述的界面元数据，分 `grid`（列表）、`form`（表单）、`search`（查询）三类 |
| 服务（Service） | 模型上的方法，通过 RPC 暴露给前端；`@MethodService` 声明 |
| 编码规则 | 定义业务编码构成方式的配置项：前缀 + 日期段 + 流水号 |
| 标签页（tab） | 表单内嵌的子表区域，用于维护主从数据（如产品的 BOM 明细） |

---

## 2. 需求分析

### 2.1 功能需求

| 编号 | 需求描述 | 验收要点 |
|------|----------|----------|
| R1 | 产品管理页面，含产品名称、规格等信息 | 列表可查看名称/规格/编码/状态；可新增、编辑、删除产品 |
| R2 | 物料管理页面，含物料名称、物料编码，编码唯一 | 编码重复时保存失败并给出明确提示 |
| R3 | 产品 BOM 标签页，显示产品关联的物料，BOM 有数量属性 | 打开产品表单可见"产品BOM"标签页，列出物料与数量 |
| R4 | 产品 BOM 的添加、删除 | 标签页内可新增一行 BOM、可删除选中行，数据落库 |
| R5 | 用 IIDP 实现编码规则功能，具备增删改查 | 有独立的编码规则菜单与列表/表单，可维护规则 |
| R6 | 编码规则包含前缀、流水号位数、日期格式 | 三个字段均可配置并影响生成结果 |
| R7 | 提供按指定编码规则生成编码的服务，并用于业务模型 | 存在可调用的编码服务；产品/物料创建时自动取号 |

### 2.2 角色与用例

| 角色 | 用例 |
|------|------|
| 生产管理员 | 维护产品、维护物料、维护产品 BOM、维护编码规则 |
| 系统（后台） | 创建产品/物料时调用编码服务取号；删除产品时清理 BOM 明细 |

### 2.3 非功能需求

| 类别 | 要求 |
|------|------|
| 数据一致性 | 编码全局唯一（同租户内），BOM 不允许出现孤儿记录 |
| 并发 | 同一规则并发取号不得产生重复编码 |
| 可配置性 | 编码格式不写死在代码中，由规则数据驱动 |
| 多租户 | 所有业务表带 `tenant_id`，唯一约束按租户隔离 |
| 可维护性 | 新增业务模型只需加模型类 + 视图 JSON，不改引擎 |

---

## 3. 总体设计

### 3.1 技术架构

IIDP 采用"模型 + 视图 + 服务"的元数据驱动架构，应用以 SDK 形式打成 jar 放入 `apps/modules`，由引擎在启动时扫描注册：

```
┌─────────────────────────────────────────────────────────┐
│  浏览器（Vue 前端，由 nginx 托管 /iidp/）                │
└───────────────┬─────────────────────────────────────────┘
                │ HTTP /api → JSON-RPC 2.0
┌───────────────▼─────────────────────────────────────────┐
│  nginx :30666  静态资源 + 反向代理 /api → 127.0.0.1:8061 │
└───────────────┬─────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────┐
│  IIDP 引擎 sie-iidp-demo-start :8061                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ 元数据/视图   │ │ 服务派发      │ │ 数据访问（ORM）   │ │
│  └──────────────┘ └──────────────┘ └──────────────────┘ │
│  ┌──────────────────────────────────────────────────┐   │
│  │ mes 应用 jar：model/*.java + views/*.json          │   │
│  └──────────────────────────────────────────────────┘   │
└───────┬─────────────────────────────┬───────────────────┘
        │                             │
┌───────▼────────┐          ┌─────────▼─────────┐
│ MySQL 3306     │          │ Redis 6379 (db5)  │
│ iidp_demo_v3   │          │ 会话/缓存          │
└────────────────┘          └───────────────────┘
```

### 3.2 模块划分

| 模块 | 职责 | 主要文件 |
|------|------|----------|
| 产品管理 | 产品主数据与自动编码 | `model/Product.java`、`views/mes-product-view.json` |
| 物料管理 | 物料主数据、编码唯一性 | `model/Material.java`、`views/mes-material-view.json` |
| 产品 BOM | 产品与物料的用量关系 | `model/ProductBom.java`（视图并入产品表单标签页） |
| 编码规则 | 规则配置与 CRUD | `model/CodeRule.java`、`views/mes-code-rule-view.json` |
| 编码服务 | 按规则生成编码 | `util/CodeRuleGenerator.java`、`CodeRule.generateCode` |
| 菜单 | 应用导航 | `views/menus.json`、`app.json` |

### 3.3 分层职责

- **视图层**：只描述"显示什么"，不含业务规则；通过 `model` 字段绑定模型，通过 `auth` 字段绑定权限动作。
- **服务层**：承载业务规则（取号、查重、级联删除），通过 `@MethodService` 暴露；未覆写的标准服务（search/read/create/update/delete/count）由引擎提供。
- **数据层**：引擎 ORM，按模型注解映射表与字段；租户字段由引擎自动写入。

---

## 4. 数据设计

### 4.1 实体关系

```
        ┌──────────────┐          ┌──────────────────┐
        │  supplier    │1        N│    material      │
        │  供应商       ├──────────┤    物料           │
        └──────────────┘          └────────┬─────────┘
                                           │1
                                           │
                                           │N
        ┌──────────────┐          ┌────────▼─────────┐
        │   product    │1        N│   product_bom    │
        │   产品        ├──────────┤   产品BOM         │
        └───────┬──────┘          └──────────────────┘
                │
                │ 编码由
        ┌───────▼──────┐
        │  code_rule   │   编码规则（独立配置表）
        └──────────────┘
```

- 产品 1 : N 产品 BOM，产品 BOM N : 1 物料；
- 供应商 1 : N 物料（既有关系，本次未改动）；
- 编码规则与业务表之间是"引用关系"而非外键：业务表存生成的编码，规则表存生成算法参数。

### 4.2 表结构

#### 4.2.1 `product`（产品）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | varchar(64) | PK | 主键 |
| `name` | varchar(240) | 非空 | 产品名称 |
| `spec` | varchar(240) | 可空 | 规格（本次新增） |
| `code` | varchar(240) | 唯一 | 产品编码，自动生成 |
| `status` | varchar(256) | 默认 `1` | 1 设计中 / 2 生产中 / 3 已完成 |
| `tenant_id` | varchar(64) | 索引 | 租户 |
| `create_user/create_date/update_user/update_date` | — | — | 审计字段 |

唯一键：`uk_product_tenant_code (tenant_id, code)`。

#### 4.2.2 `ems_material`（物料）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | varchar(64) | PK | 主键 |
| `name` | varchar(240) | 非空 | 物料名称 |
| `code` | varchar(240) | 唯一 | 物料编码，自动生成 |
| `type` | varchar(80) | 字典 `material_type` | 物料类型 |
| `unit` | varchar(80) | 字典 `material_unit` | 计量单位 |
| `description` | varchar(240) | 可空 | 描述 |
| `stock_quantity` | int | 可空 | 库存量 |
| `price` | decimal(22,3) | 可空 | 单价 |
| `supplier` | varchar(64) | 外键 → `supplier.id` | 供应商 |

唯一键：`uk_material_tenant_code (tenant_id, code)`。

#### 4.2.3 `product_bom`（产品 BOM）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | varchar(64) | PK | 主键 |
| `product` | varchar(64) | 外键 → `product.id` | 所属产品 |
| `material` | varchar(64) | 外键 → `material.id` | 用料 |
| `amount` | int | 1–999999 | 数量 |
| `tenant_id` | varchar(64) | — | 租户 |

#### 4.2.4 `code_rule`（编码规则，本次新增）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | varchar(64) | PK | 主键 |
| `name` | varchar(240) | 非空 | 规则名称（显示字段） |
| `code` | varchar(240) | 唯一 | 规则编码，业务侧按此调用 |
| `prefix` | varchar(64) | 可空 | 前缀 |
| `seq_length` | int | 默认 5，1–18 | 流水号位数 |
| `date_format` | varchar(64) | 默认 `yyyyMMdd` | 日期段格式，空表示无日期段 |
| `current_seq` | int | 默认 0 | 当前流水号 |
| `seq_date` | varchar(64) | 可空 | 当前流水号所属日期段 |
| `remark` | varchar(240) | 可空 | 备注 |
| `tenant_id` + 审计字段 | — | — | 同其他业务表 |

唯一键：`(tenant_id, code)`。

### 4.3 字典与枚举

| 用途 | 类型 | 取值 |
|------|------|------|
| 产品状态 | `@Selection`（视图下拉） | 1 设计中、2 生产中、3 已完成 |
| 物料类型 | `@Dict(typeCode="material_type")` | 由字典应用维护 |
| 物料单位 | `@Dict(typeCode="material_unit")` | 由字典应用维护 |

---

## 5. 详细设计

### 5.1 编码规则

#### 5.1.1 编码构成

```
编码 = 前缀 + 日期段 + 流水号
        │      │        └─ 按 seqLength 左补零，如 00001
        │      └────────── 按 dateFormat 格式化当天日期，可留空
        └───────────────── 业务前缀，如 P / M / C
```

示例：`P` + `20261108` + `00001` → `P2026110800001`。

#### 5.1.2 生成算法

```
输入：ruleCode（规则编码）
输出：新编码

1. 查规则：select * from code_rule where code = ruleCode
   1.1 不存在且 ruleCode ∈ {PRODUCT, MATERIAL}
        → 用内置默认值补建规则（名称、前缀），继续
   1.2 否则抛 ValidationException("编码规则不存在：…")
2. 计算日期段 datePart
   - dateFormat 为空 → datePart = ""
   - 否则 datePart = format(dateFormat, now)
3. 计算新流水号
   - datePart 与规则 seqDate 不同 → newSeq = 1
   - 相同 → newSeq = currentSeq + 1
4. 上限检查：max = 10^seqLength - 1，newSeq > max 则抛异常
5. 组装 code = prefix + datePart + 左补零(newSeq, seqLength)
6. 回写规则：currentSeq = newSeq，seqDate = datePart
7. 返回 code
```

#### 5.1.3 状态与归零

规则表只有一条记录承载流水状态，用 `seq_date` 记录"当前流水属于哪个日期段"。日期段变化即自动归零，无需定时任务。

| 场景 | seqDate | 当天 datePart | 结果 |
|------|---------|---------------|------|
| 当日首次取号 | 20261107 | 20261108 | 流水 = 1 |
| 当日连续取号 | 20261108 | 20261108 | 流水 +1 |
| 无日期段规则 | 空 | 空 | 流水持续累加 |

#### 5.1.4 并发与边界

- **并发**：`CodeRuleGenerator.nextCode` 使用 `synchronized`，保证单实例内串行；多实例部署需改为数据库行锁或号段表（见 §11 限制）。
- **位数上限**：`seqLength` 限制 1–18，超过 `10^len - 1` 抛"流水号已达到上限"，避免生成溢出编码。
- **日期格式非法**：`SimpleDateFormat` 会抛 `IllegalArgumentException`，由平台包成校验异常返回前端。
- **规则缺失**：内置 `PRODUCT`/`MATERIAL` 自动补建，保证首次部署即可用；自定义规则缺失则明确报错，不做静默兜底。

#### 5.1.5 关键类

```java
public class CodeRule extends BaseModel<CodeRule> {
    @Validate.NotBlank @Property(displayForModel = true) private String name;
    @Validate.Unique(properties = {"code"}, message = "规则编码已存在！")
    @Property(unique = true) private String code;
    private String prefix;
    private Integer seqLength;   // 默认 5
    private String dateFormat;   // 默认 yyyyMMdd
    private Integer currentSeq;
    private String seqDate;
    private String remark;

    @MethodService(name = "generateCode", auth = "read")
    public String generateCode(String ruleCode) {
        return CodeRuleGenerator.nextCode(ruleCode);
    }
}
```

### 5.2 编码服务

#### 5.2.1 接口契约

| 项 | 内容 |
|----|------|
| 服务定位 | `app=mes, model=code_rule, service=generateCode` |
| 入参 | `ruleCode`：编码规则的 `code`，字符串 |
| 返回 | 生成的编码字符串 |
| 权限 | `read` |
| 异常 | 规则不存在、流水号超上限、日期格式非法 |

调用示例：

```json
{"jsonrpc":"2.0","id":"1","params":{
  "context":{"lang":"zh_CN","timeZone":"Asia/Shanghai"},
  "app":"mes","model":"code_rule","service":"generateCode",
  "args":{"ruleCode":"PRODUCT"}}}
```

返回：`{"result":{"data":"P2026110800001"}}`

#### 5.2.2 业务模型接入时序

```
用户新增产品
   │
   ├─ 前端 POST /api/root/rpc/service/  (model=product, service=create, args.valuesList=[...])
   │
   ├─ Product.create(rs, valuesList)
   │     ├─ code 为空？
   │     │     └─ CodeRuleGenerator.nextCode("PRODUCT")
   │     │           ├─ 查规则 → 日期段 → 流水 +1 → 回写规则
   │     │           └─ 返回 P202611080000N
   │     ├─ item.setCode(code)
   │     └─ rs.callSuper(Product.class, "create", valuesList)
   │
   └─ 落库，返回新 id
```

物料创建同理，规则编码为 `MATERIAL`，并额外做一次显式查重。

#### 5.2.3 参数名约定（重要）

IIDP 引擎按**方法参数名**从 RPC `args` 中取值。覆写标准服务时参数名必须与引擎一致：

| 服务 | 正确参数名 | 错误写法后果 |
|------|------------|--------------|
| `create` | `valuesList` | 传 `values`/`valueList` 得到 `null` → NPE |
| `delete` | 由 `RecordSet` 携带 ids（`rs.getIds()`） | — |

### 5.3 产品管理

- **字段**：名称（必填）、规格、编码（唯一，自动生成）、状态（默认"设计中"）。
- **页面**：列表展示名称/规格/编码/状态；表单同列；查询区支持按名称、规格、编码、状态过滤。
- **校验**：`@Validate.NotBlank` 名称；`@Validate.Unique` 编码；数据库唯一键兜底。
- **自动编码**：创建时 `code` 为空则取 `PRODUCT` 规则；用户显式填写则保留（仍受唯一约束）。
- **删除**：级联删除该产品的 BOM 明细（见 §5.5.3）。

### 5.4 物料管理

物料编码唯一性采用**三重保障**：

| 层次 | 手段 | 作用 |
|------|------|------|
| 声明式 | `@Validate.Unique(properties={"code"})` | 保存前统一校验，返回友好提示 |
| 服务层 | `create` 中 `DbUtils.count(Filter.equal("code", code)) > 0` 抛 `ValidationException` | 覆盖并发与批量场景 |
| 数据库 | `uk_material_tenant_code (tenant_id, code)` | 最终一致性保证 |

编码为空时按 `MATERIAL` 规则自动生成，因此正常流程不会触碰重复校验。

### 5.5 产品 BOM

#### 5.5.1 关系映射

```java
// Product 侧：一对多，指向 product_bom 的 product 字段
@OneToMany(targetModel = "product_bom", targetProperty = "product", displayName = "产品BOM")
private List<ProductBom> productBomList;
```

引擎据此在模型元数据中生成 `RelateModel=product_bom`、`InverseName=product`，前端标签页据此独立请求子表数据（不依赖主记录的嵌套查询）。

#### 5.5.2 标签页设计

| 元素 | 配置 |
|------|------|
| 标题 | 产品BOM |
| 关联字段 | `productBomList` |
| 列 | 数量 `amount`、物料 `material` |
| 工具栏 | 创建 `createEr`、删除 `deleteEr` |
| 行操作 | 编辑 `updateEr` |
| 编辑态 | `type: form`，列同上 |

新增时前端自动带入当前产品 id，用户只需选择物料、填写数量；删除按选中行 id 调 `product_bom.delete`。

#### 5.5.3 级联删除

删除产品时，其 BOM 明细必须先清理，否则产生孤儿数据：

```java
@MethodService(name = "delete", auth = "delete")
public boolean delete(RecordSet rs) {
    String[] ids = rs.getIds();
    if (ids != null && ids.length > 0) {
        DbUtils.delete(Filter.in("product", Arrays.asList(ids)), ProductBom.class);
    }
    return (boolean) rs.callSuper(Product.class, "delete");
}
```

> **设计要点**：覆写 `delete` 时不能调用 `rs.delete()`——它会再次派发到本方法，造成无限递归（实测 `StackOverflowError`）。必须用 `callSuper` 调用平台基础实现。

#### 5.5.4 数量校验

`@Validate.Range(min = 1, max = 999999, message = "数量必须大于 0！")`，保存 0 或负数时返回"数量[0]超过取值范围"。

---

## 6. 接口设计

### 6.1 协议

- 传输：HTTP POST，`Content-Type: application/json`
- 地址：后端 `http://127.0.0.1:8061/root/rpc/service/`；前端经 nginx `http://localhost:30666/api/root/rpc/service/`
- 报文：JSON-RPC 2.0
- 鉴权：`Authorization: Bearer <token>`，token 由 `/root/rpc/login` 获取

### 6.2 服务清单

| 模型 | 服务 | 参数 | 说明 |
|------|------|------|------|
| product | search | `filter, properties, limit, offset, order` | 列表查询 |
| product | read | `ids, properties` | 详情 |
| product | create | `valuesList` | 新增，自动取号 |
| product | update | `ids, values` | 修改 |
| product | delete | `ids` | 删除，级联 BOM |
| material | create | `valuesList` | 新增，自动取号 + 查重 |
| product_bom | create/update/delete | 同上 | BOM 维护 |
| code_rule | generateCode | `ruleCode` | 按规则生成编码 |
| code_rule | create/update/delete/search/read | 同上 | 规则 CRUD |

### 6.3 请求示例

新增产品（编码留空，由服务生成）：

```json
{"jsonrpc":"2.0","id":"1","params":{
  "context":{"lang":"zh_CN","timeZone":"Asia/Shanghai"},
  "app":"mes","model":"product","service":"create",
  "args":{"valuesList":[{"name":"智能手环","spec":"黑色/标准版","status":"1"}]}}}
```

响应：`{"result":{"data":["06cnnqi7wc3ik"]}}`

按规则取号：

```json
{"jsonrpc":"2.0","id":"2","params":{
  "app":"mes","model":"code_rule","service":"generateCode",
  "args":{"ruleCode":"CUSTOM"}}}
```

响应：`{"result":{"data":"C202611001"}}`

---

## 7. 界面设计

### 7.1 菜单结构

```
生产制造管理系统
├─ 订单管理
├─ 产品管理          ← R1、R3、R4
├─ 物料管理          ← R2
├─ 工序管理
├─ 工艺路线
├─ 供应商管理
└─ 编码规则          ← R5、R6（本次新增，序号 7）
```

### 7.2 页面清单

| 页面 | 视图 | 关键列 |
|------|------|--------|
| 产品列表 | `product_grid` | 名称、规格、编码、状态 |
| 产品表单 | `product_form` | 同上 + 产品BOM 标签页 |
| 产品查询 | `product_search` | 名称、规格、编码、状态 |
| 物料列表/表单/查询 | `material_grid/form/search` | 名称、编码、类型、单位、描述、库存量、单价、供应商 |
| 编码规则列表 | `code_rule_grid` | 名称、规则编码、前缀、流水号位数、日期格式、当前流水、备注 |
| 编码规则表单 | `code_rule_form` | 名称、规则编码、前缀、流水号位数、日期格式、备注 |
| 编码规则查询 | `code_rule_search` | 名称、规则编码、前缀、日期格式 |

### 7.3 交互说明

1. **新增产品**：表单不填编码 → 保存后由服务生成，列表刷新可见。
2. **维护 BOM**：打开产品 → "产品BOM"标签页 → "创建"选择物料并填数量 → 保存；删除选中行。
3. **维护规则**：编码规则 → 新增/编辑 → 填前缀、位数、日期格式；`generateCode` 立即生效（无需重启）。
4. **错误提示**：校验失败以 toast 形式返回 `ValidationException` 的 message，如"物料编码已存在：…"。

---

## 8. 安全与权限

| 项 | 设计 |
|----|------|
| 服务鉴权 | 每个 `@MethodService` 声明 `auth`：`create` / `update` / `delete` / `read`；无权限调用返回 403 |
| 数据隔离 | 业务表均带 `tenant_id`，引擎按登录租户自动过滤与写入；唯一键含 `tenant_id`，不同租户可用相同编码 |
| 越权删除 | 删除仅作用于当前租户数据；级联删除同样按租户上下文执行 |
| 输入校验 | 注解校验 + 服务层校验，异常统一转为可读错误消息，不泄露堆栈 |

---

## 9. 部署与配置

### 9.1 构建

```bash
# 离线构建（Windows）
mvn -o -Daether.enhancedLocalRepository.trackingFilename=_remote.repositories.bak \
    -s offline/maven/settings.xml -Dmaven.repo.local=offline/maven/repository \
    -f iidp-backend-demo/sie-iidp-demo-apps/pom.xml -pl sie-snest-mes package -DskipTests
```

产物：`sie-snest-mes/target/sie-snest-mes-1.0-SNAPSHOT.jar`，复制到 `iidp-backend-demo/apps/modules/`。

> 注意：`apps/modules` 下的 jar 被运行中的后端占用时，`repackage` 目标会报"另一个程序正在使用此文件"；此时 `jar:jar` 产物已生成，停掉后端后手工复制即可。

### 9.2 数据库

执行幂等脚本 `sql/mes-upgrade.sql`：

```bash
mysql --host=127.0.0.1 -uroot -p123456 --default-character-set=utf8mb4 iidp_demo_v3 < sql/mes-upgrade.sql
```

脚本内容：新增 `product.spec`；为产品/物料建 `(tenant_id, code)` 唯一键；建 `code_rule` 表；初始化 `PRODUCT`、`MATERIAL` 两条规则。

### 9.3 启动

```bash
java -Dfile.encoding=UTF-8 -Duser.timezone=Asia/Shanghai \
     -jar sie-iidp-demo-start/target/sie-iidp-demo-start-1.0-SNAPSHOT.jar
```

前端访问：<http://localhost:30666/iidp/>，账号 `admin_000001 / Admin_000001`。

### 9.4 日志

| 组件 | 位置 |
|------|------|
| 后端 | `iidp-backend-demo/logs/root.log`（按天 + 10MB 滚动，保留 30 天） |
| nginx | `release/iidp-frontend-dist-20261028/logs/access.log`、`error.log` |

日志配置：`sie-iidp-demo-start/src/main/resources/logback-spring.xml`，`LOG_BASE=logs` 为相对路径，跟随进程工作目录。

---

## 10. 测试与验证

### 10.1 测试用例与结果

| 编号 | 用例 | 预期 | 实测结果 |
|------|------|------|----------|
| T1 | 新增产品，不填编码 | 自动生成 `P+日期+5位` | 通过，`P2026110800003` |
| T2 | 新增物料，不填编码 | 自动生成 `M+日期+5位` | 通过，`M2026110800001` |
| T3 | 新增物料，填已存在编码 | 保存失败并提示 | 通过，`物料编码已存在：M2026110709442689200001` |
| T4 | 产品 BOM 新增 1 行 | 落库并回显 | 通过 |
| T5 | BOM 数量填 0 | 保存失败 | 通过，`数量[0]超过取值范围` |
| T6 | 修改 BOM 数量 / 删除 BOM 行 | 数据更新 / 删除 | 通过 |
| T7 | 删除产品 | 产品与其 BOM 一并删除 | 通过，`bom_left=0, prod_left=0` |
| T8 | 新增规则 `CUSTOM`（C / 3 位 / yyyyMM）取号 | `C202611001`、`C202611002` | 通过 |
| T9 | 调用不存在的规则 | 明确报错 | 通过，`编码规则不存在：NOPE，请先在【编码规则】中维护` |
| T10 | 三张视图加载 | 无告警、列正确 | 通过，`warnning=""` |
| T11 | 菜单注册 | 出现"编码规则" | 通过 |

### 10.2 验证方式

- 接口层：JSON-RPC 直连 8061，覆盖上述用例；
- 元数据层：`app=base, model=ui_view, service=loadView` 校验视图结构与列；
- 数据层：MySQL 直查核对落库结果与约束。

---

## 11. 已知限制与后续扩展

| 限制 | 说明 | 建议 |
|------|------|------|
| 取号并发 | `synchronized` 仅保证单实例串行 | 多实例部署时改用 `SELECT … FOR UPDATE` 行锁或独立号段表 |
| 规则删除 | 已删除规则生成的编码不受影响（编码已落库） | 规则增加"停用"状态而非物理删除 |
| BOM 唯一性 | 同一产品可重复添加同一物料 | 增加 `(product, material)` 唯一约束或保存时合并数量 |
| 物料字典 | `material_type` / `material_unit` 字典项缺失时报"字典配置有误" | 由字典应用补齐数据 |
| 级联范围 | 仅产品→BOM | 如需删除物料时校验是否被 BOM 引用，可加引用检查 |

### 后续可扩展方向

1. 编码规则支持"变量段"（如按产品类别、按组织）；
2. 规则预览功能：配置时实时生成示例编码；
3. BOM 版本管理（同一产品多版本 BOM）；
4. 编码回收/作废机制（保留已用号段，避免重号）。

---

## 附录 A：需求追踪矩阵

| 需求 | 模型 | 视图 | 服务/工具 | 数据库 |
|------|------|------|-----------|--------|
| R1 | `Product.spec` | `mes-product-view.json` | `Product.create` | `product.spec` |
| R2 | `Material.code` | `mes-material-view.json` | `Material.create` | `uk_material_tenant_code` |
| R3 | `ProductBom`、`Product.productBomList` | `product_form.tabs` | — | `product_bom` |
| R4 | `ProductBom` | tab 的 `createEr/deleteEr` | 标准 create/delete | `product_bom` |
| R5 | `CodeRule` | `mes-code-rule-view.json` | 标准 CRUD | `code_rule` |
| R6 | `CodeRule.prefix/seqLength/dateFormat` | `code_rule_form` | `CodeRuleGenerator` | `code_rule` |
| R7 | `CodeRule` | — | `generateCode`、`Product.create`、`Material.create` | `code_rule` |
