package com.sie.app.mes.util;

import com.sie.app.mes.model.CodeRule;
import com.sie.snest.engine.exception.ValidationException;
import com.sie.snest.engine.rule.Filter;
import com.sie.snest.sdk.db.DbUtils;

import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 编码生成器：按 {@link CodeRule} 中配置的前缀、日期格式、流水号位数生成编码。
 *
 * <p>流水号存放在规则表 code_rule 中，配置了日期格式时按日期自动归零，
 * 保证服务重启后不会生成重复编码。</p>
 *
 * <p>若规则不存在，会按内置默认规则（{@link #DEFAULT_RULES}）自动创建，
 * 之后可在【编码规则】页面修改前缀、位数和日期格式。</p>
 */

public final class CodeRuleGenerator {

    /**
     * 规则未配置流水号位数时的默认位数
     */
    private static final int DEFAULT_SEQ_LENGTH = 5;

    /**
     * 允许的最长流水号位数
     */
    private static final int MAX_SEQ_LENGTH = 18;

    private static final String WILDCARD = "*";

    private static final String DEFAULT_DATE_FORMAT = "yyyyMMdd";

    /**
     * 内置默认规则：规则编码 -> {规则名称, 前缀}
     */
    private static final Map<String, String[]> DEFAULT_RULES = new HashMap<String, String[]>();

    static {
        DEFAULT_RULES.put("PRODUCT", new String[]{"产品编码规则", "P"});
        DEFAULT_RULES.put("MATERIAL", new String[]{"物料编码规则", "M"});
    }

    private CodeRuleGenerator() {
    }

    /**
     * 按规则编码生成一个编码。
     *
     * @param ruleCode 规则编码（code_rule.code），如 PRODUCT、MATERIAL
     * @return 生成好的编码
     */
    public static synchronized String nextCode(String ruleCode) {
        if (ruleCode == null || ruleCode.trim().isEmpty()) {
            throw new ValidationException("编码规则编码不能为空");
        }
        String key = ruleCode.trim();
        List<CodeRule> rules = DbUtils.search(Filter.equal("code", key),
                Collections.singletonList(WILDCARD), 1, 0, null, CodeRule.class);
        boolean exists = rules != null && !rules.isEmpty();
        CodeRule rule = exists ? rules.get(0) : buildDefaultRule(key);

        int length = resolveLength(rule.getSeqLength());
        long max = maxSequence(length);
        String datePart = formatDate(rule.getDateFormat());
        int current = rule.getCurrentSeq() == null ? 0 : rule.getCurrentSeq();
        // 配置了日期格式且日期变化时，流水号从 1 重新开始
        boolean newPeriod = !datePart.isEmpty() && !datePart.equals(nullToEmpty(rule.getSeqDate()));
        int next = newPeriod ? 1 : current + 1;
        if (next > max) {
            throw new ValidationException("编码规则[" + key + "]的流水号已达到上限：" + max);
        }

        String code = nullToEmpty(rule.getPrefix()) + datePart + padSequence(next, length);

        rule.setCurrentSeq(next);
        rule.setSeqDate(datePart);
        if (exists) {
            rule.setUpdate_date(new Date());
            DbUtils.update(rule, CodeRule.class);
        } else {
            rule.setCreate_date(new Date());
            DbUtils.create(rule, CodeRule.class);
        }
        return code;
    }

    /**
     * 规则不存在时，按内置默认规则构造一条新规则；没有默认规则的直接报错。
     */
    private static CodeRule buildDefaultRule(String ruleCode) {
        String[] def = DEFAULT_RULES.get(ruleCode);
        if (def == null) {
            throw new ValidationException("编码规则不存在：" + ruleCode + "，请先在【编码规则】中维护");
        }
        return new CodeRule()
                .setName(def[0])
                .setCode(ruleCode)
                .setPrefix(def[1])
                .setSeqLength(DEFAULT_SEQ_LENGTH)
                .setDateFormat(DEFAULT_DATE_FORMAT)
                .setCurrentSeq(0);
    }

    private static int resolveLength(Integer seqLength) {
        int length = seqLength == null ? DEFAULT_SEQ_LENGTH : seqLength;
        if (length < 1) {
            length = 1;
        }
        if (length > MAX_SEQ_LENGTH) {
            length = MAX_SEQ_LENGTH;
        }
        return length;
    }

    private static long maxSequence(int length) {
        long max = 1L;
        for (int i = 0; i < length; i++) {
            max = max * 10L;
        }
        return max - 1L;
    }

    private static String formatDate(String dateFormat) {
        if (dateFormat == null || dateFormat.trim().isEmpty()) {
            return "";
        }
        return new SimpleDateFormat(dateFormat.trim()).format(new Date());
    }

    private static String padSequence(int sequence, int length) {
        StringBuilder sb = new StringBuilder(String.valueOf(sequence));
        while (sb.length() < length) {
            sb.insert(0, '0');
        }
        return sb.toString();
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
