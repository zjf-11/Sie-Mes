package com.sie.app.cuptrace.model;

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
 * 异常处置
 */
@Model(name = "exception_disposition", displayName = "异常处置", description = "批次锁定、返工、复测、解锁全生命周期", isAutoLog = Bool.True)
public class ExceptionDisposition extends BaseModel<ExceptionDisposition> {

    @ManyToOne(displayName = "生产批次")
    @JoinColumn
    private ProductionBatch batch;

    @Property(displayName = "发生工序")
    private String processCode;

    @Property(displayName = "异常类型", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "真空度不达标", value = "1"),
            @Option(label = "温降不合格", value = "2"),
            @Option(label = "真空焊参数异常", value = "3"),
            @Option(label = "丝印偏位", value = "4"),
            @Option(label = "其他", value = "5")
    })
    private String exceptionType;

    @Property(displayName = "来源记录ID")
    private String sourceRecordId;

    @Property(displayName = "来源记录类型", defaultValue = "2", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "真空焊", value = "1"),
            @Option(label = "抽真空", value = "2"),
            @Option(label = "温降", value = "3"),
            @Option(label = "首件", value = "4")
    })
    private String sourceRecordType;

    @Property(displayName = "是否锁定", defaultValue = "0")
    private Boolean lockFlag;

    @Property(displayName = "处置方式", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "待处置", value = "1"),
            @Option(label = "返工", value = "2"),
            @Option(label = "复测", value = "3"),
            @Option(label = "报废", value = "4"),
            @Option(label = "放行", value = "5")
    })
    private String disposition;

    @Property(displayName = "处置人")
    private String dispositionBy;

    @Property(dataType = DataType.DATE_TIME, displayName = "处置时间")
    private Date dispositionAt;

    @Property(displayName = "复测结果")
    private String retestResult;

    @Property(displayName = "是否解锁", defaultValue = "0")
    private Boolean unlockFlag;

    public ExceptionDisposition setBatch(ProductionBatch batch) {
        this.set("batch", batch);
        return this;
    }

    public ExceptionDisposition setProcessCode(String processCode) {
        this.set("processCode", processCode);
        return this;
    }

    public ExceptionDisposition setExceptionType(String exceptionType) {
        this.set("exceptionType", exceptionType);
        return this;
    }

    public ExceptionDisposition setSourceRecordId(String sourceRecordId) {
        this.set("sourceRecordId", sourceRecordId);
        return this;
    }

    public ExceptionDisposition setSourceRecordType(String sourceRecordType) {
        this.set("sourceRecordType", sourceRecordType);
        return this;
    }

    public ExceptionDisposition setLockFlag(Boolean lockFlag) {
        this.set("lockFlag", lockFlag);
        return this;
    }

    public ExceptionDisposition setDisposition(String disposition) {
        this.set("disposition", disposition);
        return this;
    }

    public ExceptionDisposition setDispositionBy(String dispositionBy) {
        this.set("dispositionBy", dispositionBy);
        return this;
    }

    public ExceptionDisposition setDispositionAt(Date dispositionAt) {
        this.set("dispositionAt", dispositionAt);
        return this;
    }

    public ExceptionDisposition setRetestResult(String retestResult) {
        this.set("retestResult", retestResult);
        return this;
    }

    public ExceptionDisposition setUnlockFlag(Boolean unlockFlag) {
        this.set("unlockFlag", unlockFlag);
        return this;
    }

    public ProductionBatch getBatch() {
        return (ProductionBatch) this.get("batch");
    }

    public String getProcessCode() {
        return getStr("processCode");
    }

    public String getExceptionType() {
        return getStr("exceptionType");
    }

    public String getSourceRecordId() {
        return getStr("sourceRecordId");
    }

    public String getSourceRecordType() {
        return getStr("sourceRecordType");
    }

    public Boolean getLockFlag() {
        return (Boolean) this.get("lockFlag");
    }

    public String getDisposition() {
        return getStr("disposition");
    }

    public String getDispositionBy() {
        return getStr("dispositionBy");
    }

    public Date getDispositionAt() {
        return (Date) this.get("dispositionAt");
    }

    public String getRetestResult() {
        return getStr("retestResult");
    }

    public Boolean getUnlockFlag() {
        return (Boolean) this.get("unlockFlag");
    }


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


}
