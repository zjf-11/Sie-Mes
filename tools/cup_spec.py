# -*- coding: utf-8 -*-
"""Spec of the four cup MES apps."""

CUPCODE = r"""package com.sie.app.cupbase.util;

import com.sie.app.cupbase.model.CupSequence;
import com.sie.snest.engine.exception.ValidationException;
import com.sie.snest.engine.rule.Filter;
import com.sie.snest.sdk.db.DbUtils;

import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * 编码生成器：前缀 + yyyyMMdd + 指定位数流水号，序列持久化在 cup_sequence 表。
 */
public final class CupCode {

    private CupCode() {
    }

    public static synchronized String nextCode(String codeType, String prefix, int seqLength) {
        String datePart = new SimpleDateFormat("yyyyMMdd").format(new Date());
        List<CupSequence> list = DbUtils.search(Filter.equal("codeType", codeType),
                Collections.singletonList("*"), 1, 0, null, CupSequence.class);
        CupSequence seq = (list == null || list.isEmpty()) ? null : list.get(0);
        long next;
        if (seq == null) {
            seq = new CupSequence();
            seq.setCodeType(codeType);
            next = 1;
        } else {
            Integer cur = seq.getCurrentValue();
            next = datePart.equals(seq.getSeqDate()) ? (cur == null ? 1 : cur + 1) : 1;
        }
        long max = (long) Math.pow(10, seqLength) - 1;
        if (next > max) {
            throw new ValidationException("[" + codeType + "]流水号已达上限：" + max);
        }
        seq.setCurrentValue((int) next);
        seq.setSeqDate(datePart);
        seq.setUpdate_date(new Date());
        if (seq.getId() == null) {
            seq.setCreate_date(new Date());
            DbUtils.create(seq, CupSequence.class);
        } else {
            DbUtils.update(seq, CupSequence.class);
        }
        StringBuilder num = new StringBuilder(String.valueOf(next));
        while (num.length() < seqLength) {
            num.insert(0, "0");
        }
        return prefix + datePart + num;
    }
}
"""

BATCHSTATE = r"""package com.sie.app.cupprod.util;

import com.sie.snest.engine.rule.Filter;
import com.sie.snest.sdk.db.DbUtils;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * 批次状态工具：只按字段增量更新，避免把整行实体回写导致的序列化异常。
 */
public final class BatchState {

    private BatchState() {
    }

    public static void patch(String batchId, String status, Boolean lockFlag) {
        Map<String, Object> values = new HashMap<String, Object>();
        if (status != null) {
            values.put("status", status);
        }
        if (lockFlag != null) {
            values.put("lockFlag", lockFlag);
        }
        values.put("update_date", new Date());
        DbUtils.updateByFilter(values, Filter.equal("id", batchId), "production_batch");
    }
}
"""

LOCKS = r"""package com.sie.app.cupqc.util;

import com.sie.app.cupprod.model.ProductionBatch;
import com.sie.app.cuptrace.model.ExceptionDisposition;
import com.sie.snest.engine.data.RecordSet;
import com.sie.snest.engine.exception.ValidationException;
import com.sie.snest.engine.rule.Filter;
import com.sie.snest.sdk.db.DbUtils;

import java.util.Date;

/**
 * 批次锁定工具：置批次状态为锁定，并生成异常处置记录。
 *
 * 两个坑（已踩过）：
 * 1. 入参用批次 id 字符串而非 ProductionBatch 对象——RPC 传入的关联字段保存后不保证能还原成实体，
 *    直接依赖 item.getBatch() 会拿到 null 并静默跳过锁定逻辑。
 * 2. 更新批次用 BatchState.patch 增量更新——把整行实体交给 DbUtils.update 会尝试序列化
 *    关联字段（prefetch 结构），报 NotSerializableException。
 */
public final class LockSupport {

    private LockSupport() {
    }

    public static void lockBatch(RecordSet rs, String batchId, String exceptionType,
                                 String sourceType, String sourceId) {
        if (batchId == null || batchId.isEmpty()) {
            throw new ValidationException("锁定失败：未指定生产批次");
        }
        if (DbUtils.count(Filter.equal("id", batchId), ProductionBatch.class) == 0) {
            throw new ValidationException("锁定失败：生产批次不存在：" + batchId);
        }
        com.sie.app.cupprod.util.BatchState.patch(batchId, "3", Boolean.TRUE);

        ExceptionDisposition ex = new ExceptionDisposition();
        ex.set("batch", batchId);
        ex.setExceptionType(exceptionType);
        ex.setSourceRecordType(sourceType);
        ex.setSourceRecordId(sourceId);
        ex.setLockFlag(Boolean.TRUE);
        ex.setDisposition("1");
        ex.setDispositionBy(rs.getMeta().getUserId());
        ex.setDispositionAt(new Date());
        ex.setUnlockFlag(Boolean.FALSE);
        ex.setCreate_user(rs.getMeta().getUserId());
        ex.setCreate_date(new Date());
        DbUtils.create(ex, ExceptionDisposition.class);
    }
}
"""

def f(name, kind, disp, **opts):
    return (name, kind, disp, opts)


APPS = [
    # ------------------------------------------------------------------ base
    {
        "name": "cupbase",
        "artifact": "sie-snest-cup-base",
        "pkg": "com.sie.app.cupbase",
        "display": "保温杯-基础数据",
        "desc": "保温杯生产管理系统：产品SKU、设备模具与编码序列",
        "seq": 10,
        "deps": [],
        "app_deps": [],
        "extra_files": [("util/CupCode.java", CUPCODE)],
        "models": [
            {
                "cls": "ProductSku",
                "model": "product_sku",
                "disp": "产品SKU",
                "desc": "保温杯产品SKU",
                "cols": [
                    ("SKU编码", "skuCode", {"sortable": True, "width": "150px"}),
                    ("产品名称", "productName", {}),
                    ("容量(ml)", "capacityMl", {}),
                    ("杯口口径", "caliber", {}),
                    ("执行标准", "executeStandard", {}),
                    ("状态", "status", {}),
                ],
                "form_cols": [
                    ("SKU编码", "skuCode", {}),
                    ("产品名称", "productName", {}),
                    ("容量(ml)", "capacityMl", {}),
                    ("杯口口径", "caliber", {}),
                    ("配件清单", "accessoryList", {}),
                    ("执行标准", "executeStandard", {}),
                    ("状态", "status", {}),
                ],
                "search_cols": [
                    ("SKU编码", "skuCode", {}),
                    ("产品名称", "productName", {}),
                    ("状态", "status", {}),
                ],
                "fields": [
                    f("skuCode", "str", "SKU编码", unique=True),
                    f("productName", "str", "产品名称", notblank=True),
                    f("capacityMl", "int", "容量(ml)"),
                    f("caliber", "str", "杯口口径"),
                    f("accessoryList", "text", "配件清单"),
                    f("executeStandard", "str", "执行标准"),
                    f("status", "sel", "状态", default="1", options=[("启用", "1"), ("停用", "2")]),
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "创建产品SKU")
    public RecordSet create(RecordSet rs, List<ProductSku> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(ProductSku.class, "create");
        }
        for (ProductSku item : valuesList) {
            if (item.getSkuCode() == null || item.getSkuCode().trim().isEmpty()) {
                item.setSkuCode(com.sie.app.cupbase.util.CupCode.nextCode("SKU", "CUP", 4));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(ProductSku.class, "create", valuesList);
    }
""",
            },
            {
                "cls": "EquipmentMold",
                "model": "equipment_mold",
                "disp": "设备模具",
                "desc": "设备与模具台账",
                "cols": [
                    ("编号", "assetCode", {"sortable": True}),
                    ("类型", "assetType", {}),
                    ("名称", "assetName", {}),
                    ("状态", "status", {}),
                    ("累计模次", "moldShotCount", {}),
                    ("最近保养时间", "lastMaintenanceAt", {}),
                ],
                "search_cols": [
                    ("编号", "assetCode", {}),
                    ("名称", "assetName", {}),
                    ("类型", "assetType", {}),
                ],
                "fields": [
                    f("assetCode", "str", "设备/模具编号", unique=True, notblank=True),
                    f("assetType", "sel", "类型", default="1", options=[("设备", "1"), ("模具", "2")]),
                    f("assetName", "str", "名称", notblank=True),
                    f("status", "sel", "状态", default="1",
                      options=[("正常", "1"), ("保养中", "2"), ("停用", "3")]),
                    f("moldShotCount", "int", "累计模次"),
                    f("lastMaintenanceAt", "date", "最近保养时间"),
                ],
            },
            {
                "cls": "CupSequence",
                "model": "cup_sequence",
                "disp": "编码序列",
                "desc": "编码流水号序列（内部使用）",
                "menu": False,
                "cols": [("编码类型", "codeType", {}), ("当前值", "currentValue", {}), ("日期段", "seqDate", {})],
                "fields": [
                    f("codeType", "str", "编码类型", unique=True),
                    f("currentValue", "int", "当前值"),
                    f("seqDate", "str", "日期段"),
                ],
            },
        ],
    },
    # ------------------------------------------------------------------ prod
    {
        "name": "cupprod",
        "artifact": "sie-snest-cup-prod",
        "pkg": "com.sie.app.cupprod",
        "display": "保温杯-生产执行",
        "desc": "保温杯生产管理系统：生产工单、生产批次与工序履历",
        "seq": 11,
        "deps": ["sie-snest-cup-base"],
        "app_deps": ["cupbase"],
        "extra_files": [("util/BatchState.java", BATCHSTATE)],
        "models": [
            {
                "cls": "ProductionOrder",
                "model": "production_order",
                "disp": "生产工单",
                "desc": "生产工单",
                "cols": [
                    ("工单号", "orderNo", {"sortable": True}),
                    ("产品SKU", "sku", {}),
                    ("计划数量", "planQty", {}),
                    ("客户订单号", "customerOrderNo", {}),
                    ("交期", "dueDate", {}),
                    ("配件齐套", "accessoryReadyFlag", {}),
                    ("状态", "status", {}),
                ],
                "search_cols": [
                    ("工单号", "orderNo", {}),
                    ("产品SKU", "sku", {}),
                    ("状态", "status", {}),
                ],
                "fields": [
                    f("orderNo", "str", "工单号", unique=True),
                    f("sku", "ref", "产品SKU", ref="ProductSku"),
                    f("planQty", "int", "计划数量"),
                    f("customerOrderNo", "str", "客户订单号"),
                    f("dueDate", "date", "交期"),
                    f("accessoryReadyFlag", "bool", "配件齐套", default="0"),
                    f("status", "sel", "工单状态", default="1",
                      options=[("待生产", "1"), ("生产中", "2"), ("已完成", "3"), ("已关闭", "4")]),
                ],
                "collections": [("batchList", "生产批次", "production_batch", "prodOrder", "ProductionBatch")],
                "tabs": [
                    {
                        "header": "生产批次",
                        "body": {
                            "buttons": [{"action": "updateEr", "auth": "update", "name": "编辑"}],
                            "columns": [{"displayName": "批次码", "name": "batchCode"},
                                        {"displayName": "当前工序", "name": "currentProcess"},
                                        {"displayName": "批次数量", "name": "batchQty"},
                                        {"displayName": "批次状态", "name": "status"}],
                            "edit": {"columns": [{"displayName": "批次码", "name": "batchCode"},
                                                 {"displayName": "批次数量", "name": "batchQty"},
                                                 {"displayName": "批次状态", "name": "status"}],
                                     "type": "form"},
                            "field": "batchList",
                            "type": "grid,form",
                        },
                        "tbar": [{"action": "createEr", "auth": "create", "name": "创建"},
                                 {"action": "deleteEr", "auth": "delete", "name": "删除"}],
                    }
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "创建生产工单")
    public RecordSet create(RecordSet rs, List<ProductionOrder> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(ProductionOrder.class, "create");
        }
        for (ProductionOrder item : valuesList) {
            if (item.getOrderNo() == null || item.getOrderNo().trim().isEmpty()) {
                item.setOrderNo(com.sie.app.cupbase.util.CupCode.nextCode("ORDER", "SO", 4));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(ProductionOrder.class, "create", valuesList);
    }
""",
            },
            {
                "cls": "ProductionBatch",
                "model": "production_batch",
                "disp": "生产批次",
                "desc": "生产批次（追溯主键）",
                "cols": [
                    ("批次码", "batchCode", {"sortable": True}),
                    ("生产工单", "prodOrder", {}),
                    ("产品SKU", "sku", {}),
                    ("当前工序", "currentProcess", {}),
                    ("批次状态", "status", {}),
                    ("是否锁定", "lockFlag", {}),
                    ("批次数量", "batchQty", {}),
                ],
                "search_cols": [
                    ("批次码", "batchCode", {}),
                    ("当前工序", "currentProcess", {}),
                    ("批次状态", "status", {}),
                    ("是否锁定", "lockFlag", {}),
                ],
                "fields": [
                    f("batchCode", "str", "批次码", unique=True),
                    f("prodOrder", "ref", "生产工单", ref="ProductionOrder"),
                    f("parentBatch", "ref", "父批次", ref="ProductionBatch"),
                    f("sku", "ref", "产品SKU", ref="ProductSku"),
                    f("currentProcess", "str", "当前工序"),
                    f("status", "sel", "批次状态", default="1",
                      options=[("在制", "1"), ("待检", "2"), ("锁定", "3"),
                               ("返工中", "4"), ("放行", "5"), ("报废", "6")]),
                    f("lockFlag", "bool", "是否锁定", default="0"),
                    f("batchQty", "int", "批次数量"),
                ],
                "collections": [("processHistoryList", "工序履历", "process_history", "batch", "ProcessHistory")],
                "tabs": [
                    {
                        "header": "工序履历",
                        "body": {
                            "buttons": [{"action": "updateEr", "auth": "update", "name": "编辑"}],
                            "columns": [{"displayName": "序号", "name": "seqNo"},
                                        {"displayName": "工序名称", "name": "processName"},
                                        {"displayName": "设备", "name": "equipment"},
                                        {"displayName": "操作人", "name": "operator"},
                                        {"displayName": "合格数", "name": "qualifiedQty"},
                                        {"displayName": "不合格数", "name": "unqualifiedQty"}],
                            "edit": {"columns": [{"displayName": "序号", "name": "seqNo"},
                                                 {"displayName": "工序名称", "name": "processName"},
                                                 {"displayName": "设备", "name": "equipment"},
                                                 {"displayName": "操作人", "name": "operator"},
                                                 {"displayName": "合格数", "name": "qualifiedQty"},
                                                 {"displayName": "不合格数", "name": "unqualifiedQty"}],
                                     "type": "form"},
                            "field": "processHistoryList",
                            "type": "grid,form",
                        },
                        "tbar": [{"action": "createEr", "auth": "create", "name": "创建"},
                                 {"action": "deleteEr", "auth": "delete", "name": "删除"}],
                    }
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "创建生产批次")
    public RecordSet create(RecordSet rs, List<ProductionBatch> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(ProductionBatch.class, "create");
        }
        for (ProductionBatch item : valuesList) {
            if (item.getBatchCode() == null || item.getBatchCode().trim().isEmpty()) {
                item.setBatchCode(com.sie.app.cupbase.util.CupCode.nextCode("BATCH", "B", 4));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(ProductionBatch.class, "create", valuesList);
    }

    @MethodService(name = "lock", auth = "update", description = "锁定批次")
    public boolean lock(String batchId, String reason) {
        ProductionBatch batch = DbUtils.select(Filter.equal("id", batchId), "production_batch", ProductionBatch.class);
        if (batch == null) {
            throw new ValidationException("批次不存在：" + batchId);
        }
        com.sie.app.cupprod.util.BatchState.patch(batchId, "3", Boolean.TRUE);
        return true;
    }

    @MethodService(name = "unlock", auth = "update", description = "解锁批次")
    public boolean unlock(String batchId) {
        ProductionBatch batch = DbUtils.select(Filter.equal("id", batchId), "production_batch", ProductionBatch.class);
        if (batch == null) {
            throw new ValidationException("批次不存在：" + batchId);
        }
        com.sie.app.cupprod.util.BatchState.patch(batchId, "1", Boolean.FALSE);
        return true;
    }
""",
            },
            {
                "cls": "ProcessHistory",
                "model": "process_history",
                "disp": "工序履历",
                "desc": "批次在每道工序的执行记录",
                "cols": [
                    ("生产批次", "batch", {}),
                    ("序号", "seqNo", {}),
                    ("工序编码", "processCode", {}),
                    ("工序名称", "processName", {}),
                    ("设备", "equipment", {}),
                    ("模具", "mold", {}),
                    ("操作人", "operator", {}),
                    ("合格数", "qualifiedQty", {}),
                    ("不合格数", "unqualifiedQty", {}),
                    ("开始时间", "startTime", {}),
                    ("结束时间", "endTime", {}),
                    ("结果", "result", {}),
                ],
                "search_cols": [
                    ("生产批次", "batch", {}),
                    ("工序名称", "processName", {}),
                    ("操作人", "operator", {}),
                    ("结果", "result", {}),
                ],
                "fields": [
                    f("batch", "ref", "生产批次", ref="ProductionBatch", notblank=True),
                    f("seqNo", "int", "工序序号"),
                    f("processCode", "str", "工序编码"),
                    f("processName", "str", "工序名称"),
                    f("equipment", "ref", "设备", ref="EquipmentMold"),
                    f("mold", "ref", "模具", ref="EquipmentMold"),
                    f("operator", "str", "操作人"),
                    f("qualifiedQty", "int", "合格数"),
                    f("unqualifiedQty", "int", "不合格数"),
                    f("startTime", "date", "开始时间"),
                    f("endTime", "date", "结束时间"),
                    f("result", "sel", "工序结果", default="1", options=[("合格", "1"), ("不合格", "2")]),
                    f("remark", "str", "备注"),
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "新增工序履历")
    public RecordSet create(RecordSet rs, List<ProcessHistory> valuesList) {
        if (valuesList != null) {
            for (ProcessHistory item : valuesList) {
                String batchId = item.getStr("batch");
                if (batchId == null || batchId.isEmpty()) {
                    continue;
                }
                ProductionBatch batch = DbUtils.select(Filter.equal("id", batchId), "production_batch", ProductionBatch.class);
                if (batch != null && (Boolean.TRUE.equals(batch.getLockFlag()) || "3".equals(batch.getStatus()))) {
                    throw new ValidationException("批次[" + batch.getBatchCode() + "]已锁定，禁止流转到下一工序！");
                }
            }
        }
        return (RecordSet) rs.callSuper(ProcessHistory.class, "create", valuesList);
    }
""",
            },
        ],
    },
    # -------------------------------------------------------------------- qc
    {
        "name": "cupqc",
        "artifact": "sie-snest-cup-qc",
        "pkg": "com.sie.app.cupqc",
        "display": "保温杯-质量管控",
        "desc": "保温杯生产管理系统：真空焊、抽真空、温降测试与首件确认",
        "seq": 12,
        "deps": ["sie-snest-cup-prod", "sie-snest-cup-trace"],
        "app_deps": ["cupprod", "cuptrace"],
        "extra_files": [("util/LockSupport.java", LOCKS)],
        "models": [
            {
                "cls": "VacuumWeldRecord",
                "model": "vacuum_weld_record",
                "disp": "真空焊参数",
                "desc": "真空焊参数记录",
                "cols": [
                    ("生产批次", "batch", {}),
                    ("焊机设备", "equipment", {}),
                    ("焊接电流", "weldCurrent", {}),
                    ("焊接时间", "weldTime", {}),
                    ("保护气体流量", "gasFlow", {}),
                    ("操作人", "operator", {}),
                    ("记录时间", "recordTime", {}),
                    ("参数判定", "paramStatus", {}),
                ],
                "search_cols": [
                    ("生产批次", "batch", {}),
                    ("焊机设备", "equipment", {}),
                    ("参数判定", "paramStatus", {}),
                ],
                "fields": [
                    f("batch", "ref", "生产批次", ref="ProductionBatch", notblank=True),
                    f("equipment", "ref", "焊机设备", ref="EquipmentMold"),
                    f("weldCurrent", "dec", "焊接电流(A)"),
                    f("weldTime", "dec", "焊接时间(s)"),
                    f("gasFlow", "dec", "保护气体流量(L/min)"),
                    f("operator", "str", "操作人"),
                    f("recordTime", "date", "记录时间"),
                    f("paramStatus", "sel", "参数判定", default="1", options=[("正常", "1"), ("异常", "2")]),
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "记录真空焊参数并自动判定")
    public RecordSet create(RecordSet rs, List<VacuumWeldRecord> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(VacuumWeldRecord.class, "create");
        }
        for (VacuumWeldRecord item : valuesList) {
            boolean bad = false;
            Double current = item.getWeldCurrent();
            Double time = item.getWeldTime();
            Double gas = item.getGasFlow();
            if (current != null && (current < 80D || current > 120D)) {
                bad = true;
            }
            if (time != null && (time < 1.5D || time > 3.0D)) {
                bad = true;
            }
            if (gas != null && (gas < 8D || gas > 15D)) {
                bad = true;
            }
            item.setParamStatus(bad ? "2" : "1");
            if (item.getRecordTime() == null) {
                item.setRecordTime(new Date());
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(VacuumWeldRecord.class, "create", valuesList);
    }
""",
            },
            {
                "cls": "VacuumPumpRun",
                "model": "vacuum_pump_run",
                "disp": "抽真空炉次",
                "desc": "抽真空炉次",
                "cols": [
                    ("炉次号", "runNo", {"sortable": True}),
                    ("真空炉设备", "equipment", {}),
                    ("抽真空温度", "vacuumTemp", {}),
                    ("抽真空时长", "vacuumDuration", {}),
                    ("开始时间", "startTime", {}),
                    ("结束时间", "endTime", {}),
                    ("操作人", "operator", {}),
                    ("炉次状态", "runStatus", {}),
                ],
                "search_cols": [
                    ("炉次号", "runNo", {}),
                    ("真空炉设备", "equipment", {}),
                    ("炉次状态", "runStatus", {}),
                ],
                "fields": [
                    f("runNo", "str", "炉次号", unique=True),
                    f("equipment", "ref", "真空炉设备", ref="EquipmentMold"),
                    f("vacuumTemp", "dec", "抽真空温度(℃)"),
                    f("vacuumDuration", "int", "抽真空时长(min)"),
                    f("startTime", "date", "开始时间"),
                    f("endTime", "date", "结束时间"),
                    f("operator", "str", "操作人"),
                    f("runStatus", "sel", "炉次状态", default="1",
                      options=[("待检", "1"), ("检测中", "2"), ("已完成", "3")]),
                ],
                "collections": [("runBatchList", "炉次批次明细", "vacuum_pump_run_batch", "run", "VacuumPumpRunBatch")],
                "tabs": [
                    {
                        "header": "炉次批次明细",
                        "body": {
                            "buttons": [{"action": "updateEr", "auth": "update", "name": "编辑"}],
                            "columns": [{"displayName": "生产批次", "name": "batch"},
                                        {"displayName": "真空度读数", "name": "vacuumReading"},
                                        {"displayName": "检测结果", "name": "testResult"},
                                        {"displayName": "锁定", "name": "lockFlag"},
                                        {"displayName": "复测序号", "name": "retestSeq"}],
                            "edit": {"columns": [{"displayName": "生产批次", "name": "batch"},
                                                 {"displayName": "真空度读数", "name": "vacuumReading"},
                                                 {"displayName": "单位", "name": "vacuumUnit"},
                                                 {"displayName": "检测结果", "name": "testResult"},
                                                 {"displayName": "检测人", "name": "testedBy"}],
                                     "type": "form"},
                            "field": "runBatchList",
                            "type": "grid,form",
                        },
                        "tbar": [{"action": "createEr", "auth": "create", "name": "创建"},
                                 {"action": "deleteEr", "auth": "delete", "name": "删除"}],
                    }
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "创建抽真空炉次")
    public RecordSet create(RecordSet rs, List<VacuumPumpRun> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(VacuumPumpRun.class, "create");
        }
        for (VacuumPumpRun item : valuesList) {
            if (item.getRunNo() == null || item.getRunNo().trim().isEmpty()) {
                item.setRunNo(com.sie.app.cupbase.util.CupCode.nextCode("PUMP_RUN", "VR", 3));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(VacuumPumpRun.class, "create", valuesList);
    }
""",
            },
            {
                "cls": "VacuumPumpRunBatch",
                "model": "vacuum_pump_run_batch",
                "disp": "抽真空检测明细",
                "desc": "炉次内各批次的真空度检测读数",
                "cols": [
                    ("炉次", "run", {}),
                    ("生产批次", "batch", {}),
                    ("真空度读数", "vacuumReading", {}),
                    ("单位", "vacuumUnit", {}),
                    ("检测结果", "testResult", {}),
                    ("锁定", "lockFlag", {}),
                    ("复测序号", "retestSeq", {}),
                    ("检测人", "testedBy", {}),
                    ("检测时间", "testedAt", {}),
                ],
                "search_cols": [
                    ("生产批次", "batch", {}),
                    ("检测结果", "testResult", {}),
                    ("锁定", "lockFlag", {}),
                ],
                "fields": [
                    f("run", "ref", "抽真空炉次", ref="VacuumPumpRun"),
                    f("batch", "ref", "生产批次", ref="ProductionBatch", notblank=True),
                    f("vacuumReading", "dec", "真空度读数"),
                    f("vacuumUnit", "str", "真空度单位", default="Pa"),
                    f("testResult", "sel", "检测结果", default="1", options=[("合格", "1"), ("不合格", "2")]),
                    f("lockFlag", "bool", "不达标锁定", default="0"),
                    f("retestSeq", "int", "复测序号"),
                    f("testedBy", "str", "检测人"),
                    f("testedAt", "date", "检测时间"),
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "记录真空度读数，不合格自动锁定批次")
    public RecordSet create(RecordSet rs, List<VacuumPumpRunBatch> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(VacuumPumpRunBatch.class, "create");
        }
        for (VacuumPumpRunBatch item : valuesList) {
            if ("2".equals(item.getTestResult())) {
                item.setLockFlag(Boolean.TRUE);
            }
            if (item.getTestedAt() == null) {
                item.setTestedAt(new Date());
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        RecordSet created = (RecordSet) rs.callSuper(VacuumPumpRunBatch.class, "create", valuesList);
        String[] ids = created == null ? null : created.getIds();
        for (int i = 0; i < valuesList.size(); i++) {
            VacuumPumpRunBatch item = valuesList.get(i);
            if (Boolean.TRUE.equals(item.getLockFlag())) {
                String sourceId = (ids != null && i < ids.length) ? ids[i] : item.getStr("id");
                com.sie.app.cupqc.util.LockSupport.lockBatch(rs, item.getStr("batch"), "1", "2", sourceId);
            }
        }
        return created;
    }
""",
            },
            {
                "cls": "TempDropTest",
                "model": "temp_drop_test",
                "disp": "温降测试",
                "desc": "保冷/保热温降测试",
                "cols": [
                    ("生产批次", "batch", {}),
                    ("测试类型", "testType", {}),
                    ("触发类型", "triggerType", {}),
                    ("测试序号", "testSeq", {}),
                    ("起始温度", "startTemp", {}),
                    ("结束温度", "endTemp", {}),
                    ("判定结果", "result", {}),
                    ("测试人", "testedBy", {}),
                    ("测试时间", "testedAt", {}),
                ],
                "search_cols": [
                    ("生产批次", "batch", {}),
                    ("测试类型", "testType", {}),
                    ("判定结果", "result", {}),
                ],
                "fields": [
                    f("batch", "ref", "生产批次", ref="ProductionBatch", notblank=True),
                    f("testType", "sel", "测试类型", default="1", options=[("保冷", "1"), ("保热", "2")]),
                    f("triggerType", "sel", "触发类型", default="3",
                      options=[("新模首测", "1"), ("改模首测", "2"), ("常规抽测", "3")]),
                    f("testSeq", "int", "测试序号"),
                    f("startTemp", "dec", "起始温度(℃)"),
                    f("endTemp", "dec", "结束温度(℃)"),
                    f("curveData", "json", "温降曲线"),
                    f("result", "sel", "判定结果", default="1", options=[("合格", "1"), ("不合格", "2")]),
                    f("testedBy", "str", "测试人"),
                    f("testedAt", "date", "测试时间"),
                ],
                "services": r"""
    @MethodService(name = "create", auth = "create", description = "记录温降测试，不合格自动锁定批次")
    public RecordSet create(RecordSet rs, List<TempDropTest> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(TempDropTest.class, "create");
        }
        for (TempDropTest item : valuesList) {
            if (item.getTestedAt() == null) {
                item.setTestedAt(new Date());
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        RecordSet created = (RecordSet) rs.callSuper(TempDropTest.class, "create", valuesList);
        String[] ids = created == null ? null : created.getIds();
        for (int i = 0; i < valuesList.size(); i++) {
            TempDropTest item = valuesList.get(i);
            if ("2".equals(item.getResult())) {
                String sourceId = (ids != null && i < ids.length) ? ids[i] : item.getStr("id");
                com.sie.app.cupqc.util.LockSupport.lockBatch(rs, item.getStr("batch"), "2", "3", sourceId);
            }
        }
        return created;
    }
""",
            },
            {
                "cls": "FirstArticleConfirm",
                "model": "first_article_confirm",
                "disp": "首件确认",
                "desc": "喷涂/丝印换色换版首件确认",
                "cols": [
                    ("生产批次", "batch", {}),
                    ("工序编码", "processCode", {}),
                    ("版次/色号", "versionNo", {}),
                    ("首件照片", "photoUrl", {}),
                    ("确认人", "confirmedBy", {}),
                    ("确认时间", "confirmedAt", {}),
                    ("确认结果", "result", {}),
                    ("备注", "remark", {}),
                ],
                "search_cols": [
                    ("生产批次", "batch", {}),
                    ("工序编码", "processCode", {}),
                    ("确认结果", "result", {}),
                ],
                "fields": [
                    f("batch", "ref", "生产批次", ref="ProductionBatch", notblank=True),
                    f("processCode", "str", "工序编码"),
                    f("versionNo", "str", "版次/色号"),
                    f("photoUrl", "str", "首件照片"),
                    f("confirmedBy", "str", "确认人"),
                    f("confirmedAt", "date", "确认时间"),
                    f("result", "sel", "确认结果", default="1", options=[("合格", "1"), ("不合格", "2")]),
                    f("remark", "str", "备注"),
                ],
            },
        ],
    },
    # ----------------------------------------------------------------- trace
    {
        "name": "cuptrace",
        "artifact": "sie-snest-cup-trace",
        "pkg": "com.sie.app.cuptrace",
        "display": "保温杯-异常追溯",
        "desc": "保温杯生产管理系统：异常处置与物料批次谱系",
        "seq": 13,
        "deps": ["sie-snest-cup-prod"],
        "app_deps": ["cupprod"],
        "models": [
            {
                "cls": "ExceptionDisposition",
                "model": "exception_disposition",
                "disp": "异常处置",
                "desc": "批次锁定、返工、复测、解锁全生命周期",
                "cols": [
                    ("生产批次", "batch", {}),
                    ("发生工序", "processCode", {}),
                    ("异常类型", "exceptionType", {}),
                    ("来源记录", "sourceRecordId", {}),
                    ("来源类型", "sourceRecordType", {}),
                    ("是否锁定", "lockFlag", {}),
                    ("处置方式", "disposition", {}),
                    ("处置人", "dispositionBy", {}),
                    ("处置时间", "dispositionAt", {}),
                    ("复测结果", "retestResult", {}),
                    ("是否解锁", "unlockFlag", {}),
                ],
                "search_cols": [
                    ("生产批次", "batch", {}),
                    ("异常类型", "exceptionType", {}),
                    ("处置方式", "disposition", {}),
                    ("是否解锁", "unlockFlag", {}),
                ],
                "fields": [
                    f("batch", "ref", "生产批次", ref="ProductionBatch", notblank=True),
                    f("processCode", "str", "发生工序"),
                    f("exceptionType", "sel", "异常类型", default="1",
                      options=[("真空度不达标", "1"), ("温降不合格", "2"),
                               ("真空焊参数异常", "3"), ("丝印偏位", "4"), ("其他", "5")]),
                    f("sourceRecordId", "str", "来源记录ID"),
                    f("sourceRecordType", "sel", "来源记录类型", default="2",
                      options=[("真空焊", "1"), ("抽真空", "2"), ("温降", "3"), ("首件", "4")]),
                    f("lockFlag", "bool", "是否锁定", default="0"),
                    f("disposition", "sel", "处置方式", default="1",
                      options=[("待处置", "1"), ("返工", "2"), ("复测", "3"), ("报废", "4"), ("放行", "5")]),
                    f("dispositionBy", "str", "处置人"),
                    f("dispositionAt", "date", "处置时间"),
                    f("retestResult", "str", "复测结果"),
                    f("unlockFlag", "bool", "是否解锁", default="0"),
                ],
                "services": r"""
    @MethodService(name = "dispose", auth = "update", description = "处置异常：返工/复测/放行/报废")
    public boolean dispose(String exceptionId, String disposition, String retestResult) {
        ExceptionDisposition ex = DbUtils.select(Filter.equal("id", exceptionId), "exception_disposition", ExceptionDisposition.class);
        if (ex == null) {
            throw new ValidationException("异常记录不存在：" + exceptionId);
        }
        ex.setDisposition(disposition);
        ex.setRetestResult(retestResult);
        ex.setDispositionAt(new Date());
        boolean pass = "5".equals(disposition) || ("3".equals(disposition) && "合格".equals(retestResult));
        java.util.Map<String, Object> values = new java.util.HashMap<String, Object>();
        values.put("disposition", disposition);
        values.put("retestResult", retestResult);
        values.put("dispositionAt", new Date());
        values.put("update_date", new Date());
        if (pass) {
            values.put("unlockFlag", Boolean.TRUE);
        }
        DbUtils.updateByFilter(values, Filter.equal("id", exceptionId), "exception_disposition");
        if (pass) {
            String batchId = ex.getStr("batch");
            if (batchId != null && !batchId.isEmpty()) {
                com.sie.app.cupprod.util.BatchState.patch(batchId, "1", Boolean.FALSE);
            }
        }
        return true;
    }
""",
            },
            {
                "cls": "MaterialLotGenealogy",
                "model": "material_lot_genealogy",
                "disp": "物料批次谱系",
                "desc": "原料批次到成品批次的投入关系",
                "cols": [
                    ("子批次ID", "childLotId", {}),
                    ("子批次类型", "childLotType", {}),
                    ("父批次ID", "parentLotId", {}),
                    ("父批次类型", "parentLotType", {}),
                    ("物料编码", "materialCode", {}),
                    ("供应商", "supplier", {}),
                    ("投入数量", "qty", {}),
                    ("单位", "unit", {}),
                    ("关系类型", "relationType", {}),
                    ("创建时间", "createdAt", {}),
                ],
                "search_cols": [
                    ("子批次ID", "childLotId", {}),
                    ("父批次ID", "parentLotId", {}),
                    ("物料编码", "materialCode", {}),
                ],
                "fields": [
                    f("childLotId", "str", "子批次ID", notblank=True),
                    f("childLotType", "sel", "子批次类型", default="1",
                      options=[("成品", "1"), ("半成品", "2"), ("原料", "3")]),
                    f("parentLotId", "str", "父批次ID"),
                    f("parentLotType", "sel", "父批次类型", default="3",
                      options=[("原料", "1"), ("半成品", "2")]),
                    f("materialCode", "str", "物料编码"),
                    f("supplier", "str", "供应商"),
                    f("qty", "dec", "投入数量"),
                    f("unit", "str", "单位"),
                    f("relationType", "sel", "关系类型", default="1",
                      options=[("投入", "1"), ("组成", "2")]),
                    f("createdAt", "date", "创建时间"),
                ],
            },
        ],
    },
]
