# 保温杯生产管理系统（需求 8 / 需求 9）实现说明

> 需求 8：假设自己是保温杯生产商，做一个生产管理系统。
> 需求 9：按照不同的模块拆分 APP（依据 `skill.md` 中的《保温杯 MES 系统设计文档》）。

本文记录落地结果：拆分方案、数据模型、业务规则、接口、实测验证与部署步骤。

---

## 1. 拆分方案：4 个 SDK 应用

平台没有应用级依赖声明机制（`AppInfo` 只描述 jar 与视图，`app.json` 的 `dependencies` 不被引擎读取），因此采用 **Maven 依赖解决编译期类引用 + 运行时由引擎统一加载全部 app jar** 的方式。

| 应用 | artifact / 包名 | 职责 | 依赖 |
| --- | --- | --- | --- |
| 保温杯-基础数据 | `sie-snest-cup-base` / `com.sie.app.cupbase` | 产品 SKU、设备模具、编码序列 | — |
| 保温杯-生产执行 | `sie-snest-cup-prod` / `com.sie.app.cupprod` | 生产工单、生产批次、工序履历 | cup-base |
| 保温杯-质量管控 | `sie-snest-cup-qc` / `com.sie.app.cupqc` | 真空焊、抽真空、温降测试、首件确认 | cup-prod、cup-trace |
| 保温杯-异常追溯 | `sie-snest-cup-trace` / `com.sie.app.cuptrace` | 异常处置、物料批次谱系 | cup-prod |

每个应用有自己的 `app.json`、`menus.json` 与 `views/*.json`，在左侧菜单中各自成为一个一级分组：

- 保温杯-基础数据（sequence 10）
- 保温杯-生产执行（sequence 11）
- 保温杯-质量管控（sequence 12）
- 保温杯-异常追溯（sequence 13）

### 打包关键配置

平台的 `sie-snest-maven-plugin:repackage` 默认会把**主构件**替换成 `BOOT-INF` 布局的胖包。跨模块编译时（cup-prod 引用 cup-base）会因此找不到类。解决方式是给每个 cup 模块配置分类器附件：

```xml
<plugin>
  <groupId>com.sie.meta</groupId>
  <artifactId>sie-snest-maven-plugin</artifactId>
  <configuration>
    <classifier>exec</classifier>
    <attach>true</attach>
  </configuration>
</plugin>
```

结果是：主构件保持普通 jar（供下游编译），胖包以 `*-exec.jar` 输出并被复制进 `apps/modules`，`apps.json` 中登记的是 `-exec.jar`。

---

## 2. 数据模型（13 张表）

| 应用 | 模型 / 表 | 说明 |
| --- | --- | --- |
| cupbase | `product_sku` | SKU 编码、产品名称、容量、口径、配件清单、执行标准、状态 |
| cupbase | `equipment_mold` | 资产编码、类型、名称、状态、模具模次、最近保养 |
| cupbase | `cup_sequence` | 编码序列（前缀 + 日期段 + 流水，按类型隔离） |
| cupprod | `production_order` | 工单号、SKU、计划数量、客户订单号、交期、配件齐套、状态 |
| cupprod | `production_batch` | 批次号、工单、父批次、SKU、当前工序、状态、锁定标志、数量 |
| cupprod | `process_history` | 批次、序号、工序、设备、模具、操作人、合格/不合格数、起止时间、结果 |
| cupqc | `vacuum_weld_record` | 批次、设备、焊接电流/时间/气体流量、参数判定 |
| cupqc | `vacuum_pump_run` | 炉次号、设备、真空温度、保温时长、起止时间、运行状态 |
| cupqc | `vacuum_pump_run_batch` | 炉次、批次、真空度读数、判定结果、锁定标志、复测序号 |
| cupqc | `temp_drop_test` | 批次、测试类型、触发类型、序号、起止温度、曲线、判定 |
| cupqc | `first_article_confirm` | 批次、工序、版次/色号、首件照片、确认人、结果 |
| cuptrace | `exception_disposition` | 批次、工序、异常类型、来源记录、锁定、处置、复测、解锁 |
| cuptrace | `material_lot_genealogy` | 子/父批次、物料编码、供应商、数量、关系类型 |

建表脚本：`iidp-backend-demo/sql/cup-upgrade.sql`（幂等，`CREATE TABLE IF NOT EXISTS`，统一含 `id/tenant_id/create_user/create_date/update_user/update_date`，编码类字段加 `uk_*_tenant_*` 唯一键）。

---

## 3. 业务规则落地

### 3.1 编码生成

`cupbase` 的 `CupCode.nextCode(type, prefix, seqLength)`：按类型读取 `cup_sequence`，日期段用 `yyyyMMdd`，跨日期自动归零，超出位数抛 `ValidationException`。

| 业务对象 | 前缀 | 示例 |
| --- | --- | --- |
| 产品 SKU | CUP | `CUP202611220001` |
| 生产工单 | SO | `SO202611220001` |
| 生产批次 | B | `B202611220004` |
| 抽真空炉次 | VR | `VR20261122001` |

### 3.2 真空度不合格 → 锁定闭环

`vacuum_pump_run_batch.create` 判定 `testResult = 2`（不合格）时：

1. 本条检测记录 `lockFlag = true`；
2. 调 `LockSupport.lockBatch`：批次 `status = 3`（锁定）、`lockFlag = true`；
3. 生成 `exception_disposition`（处置方式默认「待处置」）；
4. 之后对锁定批次新增 `process_history` 会被拒绝：`批次[B...]已锁定，禁止流转到下一工序！`；
5. `exception_disposition.dispose` 处置为「放行」或「复测 + 合格」时，批次自动解锁（`status = 1`、`lockFlag = false`）。

### 3.3 温降测试不合格 → 锁定

`temp_drop_test.create` 判定 `result = 2` 时同样调用 `LockSupport.lockBatch`，异常类型记为「温降不合格」。

### 3.4 真空焊参数超范围 → 判定异常

`vacuum_weld_record.create` 按工艺窗口自动判定：电流 80–120 A、焊接时间 1.5–3.0 s、气体流量 8–15 L/min，任一越界即 `paramStatus = 2`（异常），三项都在范围内为 `1`（正常）。

### 3.5 实现中踩到的两个平台坑（重要）

1. **不能依赖 `item.getBatch()` 取关联对象**：RPC 传入的关联字段保存后不保证还原成实体对象，`getBatch()` 会得到 `null`，导致锁定逻辑被静默跳过。改为取 `item.getStr("batch")` 的 id 字符串，再按 id 查询。
2. **不能把整行实体回写**：`DbUtils.update(entity, clazz)` 会尝试序列化关联字段（prefetch 结构），报 `Cannot convert ... NotSerializableException`。改为 `DbUtils.updateByFilter(只含变更列的 Map, Filter, "表名")` 增量更新。

另外 `DbUtils.select(Filter, String, Class)` 的第二个参数是**模型名**（如 `"production_batch"`），不是字段列表，传 `"*"` 会报 `模型[*]不存在`。

---

## 4. 接口（JSON-RPC）

统一入口 `POST http://127.0.0.1:8061/root/rpc/service/`（前端经 nginx 走 `/api`），请求头 `Authorization: Bearer <token>`。

```json
{
  "id": "1", "jsonrpc": "2.0",
  "params": {
    "context": { "uid": "", "lang": "zh_CN", "timeZone": "Asia/Shanghai" },
    "app": "cupprod", "model": "production_batch", "service": "create",
    "args": { "valuesList": [ { "prodOrder": "<id>", "sku": "<id>", "batchQty": 20 } ] }
  }
}
```

参数名必须与引擎方法签名一致：`create` 用 `valuesList`，`update` 用 `{ids, values}`，`delete` 用 `{ids}`，`read` 用 `{ids, properties}`。

自定义服务：

| 应用 | 模型 | 服务 | 说明 |
| --- | --- | --- | --- |
| cupbase | product_sku | create | 自动生成 SKU 编码 |
| cupprod | production_order | create | 自动生成工单号 |
| cupprod | production_batch | create / lock / unlock | 自动生成批次号；手动锁定/解锁 |
| cupprod | process_history | create | 校验批次锁定状态 |
| cupqc | vacuum_pump_run | create | 自动生成炉次号 |
| cupqc | vacuum_pump_run_batch | create | 不合格自动锁定并生成异常单 |
| cupqc | temp_drop_test | create | 不合格自动锁定 |
| cupqc | vacuum_weld_record | create | 参数越界自动判异常 |
| cuptrace | exception_disposition | dispose | 处置并解锁 |

---

## 5. 实测验证记录

| 编号 | 场景 | 结果 |
| --- | --- | --- |
| T1 | 新建 SKU | `CUP202611220001`，id `06e1vldg5l4v7` |
| T2 | 新建工单 | `SO202611220001` |
| T3 | 新建批次 | `B202611220001`，status=1、lockFlag=false |
| T4 | 新增工序履历 | 成功 |
| T5 | 真空度 35.5 Pa 判不合格 | 批次 status=3、lockFlag=true，异常单已生成 |
| T6 | 锁定批次新增工序履历 | 被拒绝：`批次[B202611220005]已锁定，禁止流转到下一工序！` |
| T7 | 异常处置「复测 + 合格」 | 批次恢复 status=1、lockFlag=false，工序履历可继续新增 |
| T8 | 温降测试不合格 | 批次自动锁定 |
| T9 | 真空焊参数 50 A / 4.0 s / 3 L/min | `paramStatus=2`（异常）；100 A / 2.0 s / 10 L/min 为 `1` |
| T10 | 物料批次谱系 | 新增成功 |
| T11 | 视图加载 | `product_sku_grid`、`production_batch_form`（含「工序履历」页签）、`vacuum_pump_run_batch_grid` 均正常返回，无告警 |

---

## 6. 部署与运行

1. 执行建表脚本 `iidp-backend-demo/sql/cup-upgrade.sql`。
2. 构建：`mvn -o ... -f sie-iidp-demo-apps/pom.xml -pl sie-snest-cup-base,sie-snest-cup-prod,sie-snest-cup-qc,sie-snest-cup-trace -am package -DskipTests`，产物自动复制到 `apps/modules/*-exec.jar`。
3. `apps/apps.json` 的 `apps.SDK` 登记 4 个 `*-exec.jar`。
4. 启动依赖：`grant-dev.exe`（8080）、Redis 5.x（6379）、后端 `java -jar sie-iidp-demo-start-...jar`（8061）、nginx（30666）。**Redis 必须 5.x**，3.2 会因 Redisson 超时导致启动失败。
5. 首次安装新应用后需授予租户角色权限：向 `rbac_role_auth` 插入 `app_name = cupbase/cupprod/cupqc/cuptrace`、`app_all = '1'` 的 4 行，否则调用报「无权访问」。

---

## 7. 已知限制

- 平台 app 之间的依赖只在 Maven 编译期生效，运行期由引擎加载顺序兜底，未做版本约束。
- 批次锁定只拦截「新增工序履历」，尚未拦截工单关闭、批次拆分等入口。
- 首件确认仅留照片 URL 字段，未接文件服务上传。
- 温降曲线以 JSON 文本保存，未做趋势分析。
