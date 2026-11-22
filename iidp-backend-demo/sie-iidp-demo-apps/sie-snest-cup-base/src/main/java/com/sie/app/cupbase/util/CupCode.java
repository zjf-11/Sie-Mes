package com.sie.app.cupbase.util;

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
