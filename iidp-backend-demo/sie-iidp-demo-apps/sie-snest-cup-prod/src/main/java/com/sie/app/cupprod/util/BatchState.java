package com.sie.app.cupprod.util;

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
