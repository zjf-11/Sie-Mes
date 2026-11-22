package com.sie.app.cupqc.util;

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
