package com.sie.app.cupbase.model;

import com.sie.snest.engine.data.RecordSet;
import com.sie.snest.engine.exception.ValidationException;
import com.sie.snest.engine.model.Bool;
import com.sie.snest.engine.rule.Filter;
import com.sie.snest.sdk.BaseModel;
import com.sie.snest.sdk.DataType;
import com.sie.snest.sdk.annotation.meta.MethodService;
import com.sie.snest.sdk.annotation.meta.Model;
import com.sie.snest.sdk.annotation.meta.Property;
import com.sie.snest.sdk.annotation.orm.JoinColumn;
import com.sie.snest.sdk.annotation.orm.ManyToOne;
import com.sie.snest.sdk.annotation.orm.OneToMany;
import com.sie.snest.sdk.annotation.orm.Option;
import com.sie.snest.sdk.annotation.orm.Selection;
import com.sie.snest.sdk.annotation.validate.Validate;
import com.sie.snest.sdk.db.DbUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * 编码序列
 */
@Model(name = "cup_sequence", displayName = "编码序列", description = "编码流水号序列（内部使用）", isAutoLog = Bool.True)
public class CupSequence extends BaseModel<CupSequence> {

    @Validate.Unique(properties = {"codeType"}, message = "编码类型已存在！")
    @Property(displayName = "编码类型", unique = true)
    private String codeType;

    @Property(displayName = "当前值")
    private Integer currentValue;

    @Property(displayName = "日期段")
    private String seqDate;

    public CupSequence setCodeType(String codeType) {
        this.set("codeType", codeType);
        return this;
    }

    public CupSequence setCurrentValue(Integer currentValue) {
        this.set("currentValue", currentValue);
        return this;
    }

    public CupSequence setSeqDate(String seqDate) {
        this.set("seqDate", seqDate);
        return this;
    }

    public String getCodeType() {
        return getStr("codeType");
    }

    public Integer getCurrentValue() {
        return getInt("currentValue");
    }

    public String getSeqDate() {
        return getStr("seqDate");
    }

}
