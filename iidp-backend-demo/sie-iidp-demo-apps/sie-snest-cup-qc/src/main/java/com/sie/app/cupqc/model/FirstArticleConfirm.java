package com.sie.app.cupqc.model;

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
import com.sie.app.cupprod.model.ProductionBatch;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * 首件确认
 */
@Model(name = "first_article_confirm", displayName = "首件确认", description = "喷涂/丝印换色换版首件确认", isAutoLog = Bool.True)
public class FirstArticleConfirm extends BaseModel<FirstArticleConfirm> {

    @ManyToOne(displayName = "生产批次")
    @JoinColumn
    private ProductionBatch batch;

    @Property(displayName = "工序编码")
    private String processCode;

    @Property(displayName = "版次/色号")
    private String versionNo;

    @Property(displayName = "首件照片")
    private String photoUrl;

    @Property(displayName = "确认人")
    private String confirmedBy;

    @Property(dataType = DataType.DATE_TIME, displayName = "确认时间")
    private Date confirmedAt;

    @Property(displayName = "确认结果", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "合格", value = "1"),
            @Option(label = "不合格", value = "2")
    })
    private String result;

    @Property(displayName = "备注")
    private String remark;

    public FirstArticleConfirm setBatch(ProductionBatch batch) {
        this.set("batch", batch);
        return this;
    }

    public FirstArticleConfirm setProcessCode(String processCode) {
        this.set("processCode", processCode);
        return this;
    }

    public FirstArticleConfirm setVersionNo(String versionNo) {
        this.set("versionNo", versionNo);
        return this;
    }

    public FirstArticleConfirm setPhotoUrl(String photoUrl) {
        this.set("photoUrl", photoUrl);
        return this;
    }

    public FirstArticleConfirm setConfirmedBy(String confirmedBy) {
        this.set("confirmedBy", confirmedBy);
        return this;
    }

    public FirstArticleConfirm setConfirmedAt(Date confirmedAt) {
        this.set("confirmedAt", confirmedAt);
        return this;
    }

    public FirstArticleConfirm setResult(String result) {
        this.set("result", result);
        return this;
    }

    public FirstArticleConfirm setRemark(String remark) {
        this.set("remark", remark);
        return this;
    }

    public ProductionBatch getBatch() {
        return (ProductionBatch) this.get("batch");
    }

    public String getProcessCode() {
        return getStr("processCode");
    }

    public String getVersionNo() {
        return getStr("versionNo");
    }

    public String getPhotoUrl() {
        return getStr("photoUrl");
    }

    public String getConfirmedBy() {
        return getStr("confirmedBy");
    }

    public Date getConfirmedAt() {
        return (Date) this.get("confirmedAt");
    }

    public String getResult() {
        return getStr("result");
    }

    public String getRemark() {
        return getStr("remark");
    }

}
