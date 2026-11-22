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
 * 抽真空检测明细
 */
@Model(name = "vacuum_pump_run_batch", displayName = "抽真空检测明细", description = "炉次内各批次的真空度检测读数", isAutoLog = Bool.True)
public class VacuumPumpRunBatch extends BaseModel<VacuumPumpRunBatch> {

    @ManyToOne(displayName = "抽真空炉次")
    @JoinColumn
    private VacuumPumpRun run;

    @ManyToOne(displayName = "生产批次")
    @JoinColumn
    private ProductionBatch batch;

    @Property(displayName = "真空度读数")
    private Double vacuumReading;

    @Property(displayName = "真空度单位", defaultValue = "Pa")
    private String vacuumUnit;

    @Property(displayName = "检测结果", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "合格", value = "1"),
            @Option(label = "不合格", value = "2")
    })
    private String testResult;

    @Property(displayName = "不达标锁定", defaultValue = "0")
    private Boolean lockFlag;

    @Property(displayName = "复测序号")
    private Integer retestSeq;

    @Property(displayName = "检测人")
    private String testedBy;

    @Property(dataType = DataType.DATE_TIME, displayName = "检测时间")
    private Date testedAt;

    public VacuumPumpRunBatch setRun(VacuumPumpRun run) {
        this.set("run", run);
        return this;
    }

    public VacuumPumpRunBatch setBatch(ProductionBatch batch) {
        this.set("batch", batch);
        return this;
    }

    public VacuumPumpRunBatch setVacuumReading(Double vacuumReading) {
        this.set("vacuumReading", vacuumReading);
        return this;
    }

    public VacuumPumpRunBatch setVacuumUnit(String vacuumUnit) {
        this.set("vacuumUnit", vacuumUnit);
        return this;
    }

    public VacuumPumpRunBatch setTestResult(String testResult) {
        this.set("testResult", testResult);
        return this;
    }

    public VacuumPumpRunBatch setLockFlag(Boolean lockFlag) {
        this.set("lockFlag", lockFlag);
        return this;
    }

    public VacuumPumpRunBatch setRetestSeq(Integer retestSeq) {
        this.set("retestSeq", retestSeq);
        return this;
    }

    public VacuumPumpRunBatch setTestedBy(String testedBy) {
        this.set("testedBy", testedBy);
        return this;
    }

    public VacuumPumpRunBatch setTestedAt(Date testedAt) {
        this.set("testedAt", testedAt);
        return this;
    }

    public VacuumPumpRun getRun() {
        return (VacuumPumpRun) this.get("run");
    }

    public ProductionBatch getBatch() {
        return (ProductionBatch) this.get("batch");
    }

    public Double getVacuumReading() {
        return getDouble("vacuumReading");
    }

    public String getVacuumUnit() {
        return getStr("vacuumUnit");
    }

    public String getTestResult() {
        return getStr("testResult");
    }

    public Boolean getLockFlag() {
        return (Boolean) this.get("lockFlag");
    }

    public Integer getRetestSeq() {
        return getInt("retestSeq");
    }

    public String getTestedBy() {
        return getStr("testedBy");
    }

    public Date getTestedAt() {
        return (Date) this.get("testedAt");
    }


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


}
