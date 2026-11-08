# MES 应用需求分析与实现说明

> 范围：`iidp-backend-demo/sie-iidp-demo-apps/sie-snest-mes`
> 平台：IIDP 3.0（SDK 应用 `mes`，模型 + 视图 JSON + 服务）
> 日期：2026-11-08

## 一、需求拆解

| # | 需求 | 落点 | 实现方式 |
|---|------|------|----------|
| 1 | 产品管理页面（名称、规格等） | `model/Product.java`、`views/mes-product-view.json` | 新增 `spec`（规格）字段，grid/form/search 三视图同步加列 |
| 2 | 物料管理页面（名称、物料编码唯一） | `model/Material.java`、`views/mes-material-view.json` | 编码加 `@Validate.Unique` + `@Property(unique=true)`，服务层二次校验，DB 建唯一键 |
| 3 | 产品 BOM 标签页，显示关联物料，含数量 | `model/ProductBom.java`、`views/mes-product-view.json` 的 `tabs` | 表单内嵌 `productBomList` 子表格（`body.field=productBomList`），列 `amount`、`material` |
| 4 | BOM 添加、删除 | 视图 tab 的 `tbar` + 平台标准服务 | `createEr` / `deleteEr` 调用 `product_bom` 的 `create` / `delete`；数量做 `@Validate.Range(min=1)` |
| 5 | 用 IIDP 实现编码规则，增删改查 | `model/CodeRule.java`、`views/mes-code-rule-view.json`、`views/menus.json` | 新建 `code_rule` 模型，标准 CRUD 服务 + grid/form/search 三视图 + "编码规则"菜单 |
| 6 | 规则含前缀、流水号位数、日期格式 | `CodeRule.prefix / seqLength / dateFormat` | 三个可配置字段，另有 `currentSeq`、`seqDate` 记录流水状态 |
| 7 | 提供服务按规则生成编码，并用于业务模型 | `model/CodeRule.generateCode`、`util/CodeRuleGenerator` | 服务方法 + 静态工具类；`Product.create` / `Material.create` 自动取号 |

## 二、数据模型

### 2.1 编码规则 `code_rule`（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | String | 规则名称（显示字段，必填） |
| `code` | String | 规则编码，业务侧按它调用，唯一 |
| `prefix` | String | 前缀，如 `P`、`M` |
| `seqLength` | Integer | 流水号位数，默认 5，范围 1–18 |
| `dateFormat` | String | 日期段格式，默认 `yyyyMMdd`，留空则不含日期段 |
| `currentSeq` | Integer | 当前流水号 |
| `seqDate` | String | 当前流水号所属日期段，用于跨天归零 |
| `remark` | String | 备注 |

生成规则：`前缀 + 日期段 + 左补零流水号`，例如 `P` + `20261108` + `00001` → `P2026110800001`。

### 2.2 产品 `product`（扩展）

在原有 `name`、`code`、`status` 基础上新增：

- `spec`：规格，`varchar(240)`；
- `productBomList`：`@OneToMany(targetModel="product_bom", targetProperty="product")`，供 BOM 标签页使用；
- `code` 改为唯一校验（不再强制手填，创建时自动生成）。

### 2.3 产品 BOM `product_bom`

`product`（多对一）、`material`（多对一）、`amount`（数量，1–999999）。

## 三、编码服务

### 3.1 对外服务

```java
@MethodService(name = "generateCode", auth = "read", description = "按指定编码规则生成一个编码")
public String generateCode(String ruleCode)
```

RPC 调用示例：

```json
{"params":{"app":"mes","model":"code_rule","service":"generateCode","args":{"ruleCode":"PRODUCT"}}}
```

### 3.2 内部实现 `util/CodeRuleGenerator.nextCode(String ruleCode)`

1. 按 `code` 查规则；不存在时，若为内置规则编码（`PRODUCT` / `MATERIAL`）则自动补建默认规则，否则抛 `编码规则不存在：xxx，请先在【编码规则】中维护`；
2. 按 `dateFormat` 生成日期段（空则不生成）；日期段与 `seqDate` 不同 → 流水号归 1，否则 +1；
3. 校验上限 `10^seqLength - 1`，越界抛异常；
4. 拼接 `prefix + datePart + 补零流水`，回写 `currentSeq` / `seqDate`；
5. 方法整体 `synchronized`，避免并发取到重复号。

### 3.3 业务模型接入

- `Product.create(RecordSet rs, List<Product> valuesList)`：`code` 为空时取 `PRODUCT` 规则编码，再走 `callSuper`；
- `Material.create(...)`：`code` 为空时取 `MATERIAL` 规则编码，并对显式传入的编码做重复校验（`ValidationException`）。

> 注意：IIDP 引擎按**参数名**从 RPC 参数取值，覆写 `create` 时第二个参数必须命名为 `valuesList`，否则为 `null` 触发 NPE。

## 四、页面与菜单

| 页面 | 视图 | 说明 |
|------|------|------|
| 产品管理 | `product_grid / product_form / product_search` | 列表与表单含"规格"列；表单内"产品BOM"标签页 |
| 物料管理 | `material_grid / material_form / material_search` | 编码唯一 |
| 编码规则 | `code_rule_grid / code_rule_form / code_rule_search` | 新增，菜单"编码规则"（生产制造管理系统下，序号 7） |

BOM 标签页结构（`mes-product-view.json`）：

```json
{"header":"产品BOM","field":"productBomList",
 "tbar":[{"action":"createEr"},{"action":"deleteEr"}]}
```

## 五、数据库变更

脚本：`iidp-backend-demo/sql/mes-upgrade.sql`（幂等，可重复执行）

1. `product` 增加 `spec varchar(240)`；
2. `product`、`ems_material` 增加 `(tenant_id, code)` 唯一键；
3. 新建 `code_rule` 表；
4. 初始化 `PRODUCT`（P/5/yyyyMMdd）、`MATERIAL`（M/5/yyyyMMdd）两条规则。

执行：

```bash
mysql --host=127.0.0.1 -uroot -p123456 --default-character-set=utf8mb4 iidp_demo_v3 < sql/mes-upgrade.sql
```

## 六、构建与验证

```bash
# 离线构建（Windows）
mvn -o -Daether.enhancedLocalRepository.trackingFilename=_remote.repositories.bak \
    -s offline/maven/settings.xml -Dmaven.repo.local=offline/maven/repository \
    -f iidp-backend-demo/sie-iidp-demo-apps/pom.xml -pl sie-snest-mes package -DskipTests
```

产物复制到 `iidp-backend-demo/apps/modules/` 后重启 `sie-iidp-demo-start`。

已验证（RPC 实测）：

- 产品创建自动取号 `P2026110800003`；物料自动取号 `M2026110800001`；
- 重复物料编码被拒：`物料编码已存在：...`；
- BOM 新增/改数量/删除均成功，`amount=0` 被 `数量[0]超过取值范围` 拦截；
- 自定义规则（前缀 C、3 位、`yyyyMM`）生成 `C202611001`、`C202611002`；
- 三张视图 `loadView` 无警告，菜单与 `generateCode` 服务已在元数据中注册。
