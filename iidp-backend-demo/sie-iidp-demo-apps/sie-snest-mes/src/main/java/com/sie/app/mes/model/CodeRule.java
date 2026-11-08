package com.sie.app.mes.model;

import com.sie.app.mes.util.CodeRuleGenerator;
import com.sie.snest.sdk.BaseModel;
import com.sie.snest.sdk.annotation.meta.MethodService;
import com.sie.snest.sdk.annotation.meta.Model;
import com.sie.snest.sdk.annotation.meta.Property;
import com.sie.snest.sdk.annotation.validate.Validate;

/**
 * 编码规则
 *
 * <p>编码结构：前缀 + 日期(yyyyMMdd 等可配置格式) + 指定位数的流水号</p>
 *
 */
@Model(name = "code_rule",
        tableName = "code_rule",
        displayName = "编码规则",
        description = "编码规则"
)
public class CodeRule extends BaseModel<CodeRule> {

    @Validate.NotBlank(message = "规则名称不能为空！")
    @Property(displayName = "规则名称", displayForModel = true)
    private String name;

    @Validate.NotBlank(message = "规则编码不能为空！")
    @Validate.Unique(properties = {"code"}, message = "规则编码已存在！")
    @Property(displayName = "规则编码", unique = true)
    private String code;

    @Property(displayName = "前缀", length = 64)
    private String prefix;

    @Property(displayName = "流水号位数", defaultValue = "5")
    private Integer seqLength;

    @Property(displayName = "日期格式", defaultValue = "yyyyMMdd", length = 64)
    private String dateFormat;

    @Property(displayName = "当前流水号")
    private Integer currentSeq;

    @Property(displayName = "流水日期", length = 32)
    private String seqDate;

    @Property(displayName = "备注", length = 240)
    private String remark;

    public CodeRule setName(String name) {
        this.set("name", name);
        return this;
    }

    public String getName() {
        return getStr("name");
    }

    public CodeRule setCode(String code) {
        this.set("code", code);
        return this;
    }

    public String getCode() {
        return getStr("code");
    }

    public CodeRule setPrefix(String prefix) {
        this.set("prefix", prefix);
        return this;
    }

    public String getPrefix() {
        return getStr("prefix");
    }

    public CodeRule setSeqLength(Integer seqLength) {
        this.set("seqLength", seqLength);
        return this;
    }

    public Integer getSeqLength() {
        return getInt("seqLength");
    }

    public CodeRule setDateFormat(String dateFormat) {
        this.set("dateFormat", dateFormat);
        return this;
    }

    public String getDateFormat() {
        return getStr("dateFormat");
    }

    public CodeRule setCurrentSeq(Integer currentSeq) {
        this.set("currentSeq", currentSeq);
        return this;
    }

    public Integer getCurrentSeq() {
        return getInt("currentSeq");
    }

    public CodeRule setSeqDate(String seqDate) {
        this.set("seqDate", seqDate);
        return this;
    }

    public String getSeqDate() {
        return getStr("seqDate");
    }

    public CodeRule setRemark(String remark) {
        this.set("remark", remark);
        return this;
    }

    public String getRemark() {
        return getStr("remark");
    }

    /**
     * 按指定编码规则生成一个编码（对外提供的编码服务）
     *
     * @param ruleCode 规则编码，如 PRODUCT / MATERIAL
     * @return 生成好的业务编码
     */
    @MethodService(name = "generateCode", auth = "read", description = "按指定编码规则生成一个编码")
    public String generateCode(String ruleCode) {
        return CodeRuleGenerator.nextCode(ruleCode);
    }
}
