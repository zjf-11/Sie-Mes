package com.sie.app.mes.util;

/**
 * 旧的编码生成工具，已废弃。
 *
 * <p>请使用 {@link CodeRuleGenerator}，按【编码规则】中配置的前缀、日期格式、
 * 流水号位数生成编码。</p>
 *
 * @author Kris
 * @deprecated use {@link CodeRuleGenerator#nextCode(String)}
 */
@Deprecated
public final class CodeGenerator {

    private CodeGenerator() {
    }

    /**
     * @param ruleCode 编码规则的规则编码，如 PRODUCT
     * @return 生成的编码
     * @deprecated use {@link CodeRuleGenerator#nextCode(String)}
     */
    @Deprecated
    public static String generateCode(String ruleCode) {
        return CodeRuleGenerator.nextCode(ruleCode);
    }
}
