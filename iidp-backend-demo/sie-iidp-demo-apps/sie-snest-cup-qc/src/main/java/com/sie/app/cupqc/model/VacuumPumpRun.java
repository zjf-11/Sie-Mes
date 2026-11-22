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
import com.sie.app.cupbase.model.EquipmentMold;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * 抽真空炉次
 */
@Model(name = "vacuum_pump_run", displayName = "抽真空炉次", description = "抽真空炉次", isAutoLog = Bool.True)
public class VacuumPumpRun extends BaseModel<VacuumPumpRun> {

    @Validate.Unique(properties = {"runNo"}, message = "炉次号已存在！")
    @Property(displayName = "炉次号", unique = true, displayForModel = true)
    private String runNo;

    @ManyToOne(displayName = "真空炉设备")
    @JoinColumn
    private EquipmentMold equipment;

    @Property(displayName = "抽真空温度(℃)")
    private Double vacuumTemp;

    @Property(displayName = "抽真空时长(min)")
    private Integer vacuumDuration;

    @Property(dataType = DataType.DATE_TIME, displayName = "开始时间")
    private Date startTime;

    @Property(dataType = DataType.DATE_TIME, displayName = "结束时间")
    private Date endTime;

    @Property(displayName = "操作人")
    private String operator;

    @Property(displayName = "炉次状态", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "待检", value = "1"),
            @Option(label = "检测中", value = "2"),
            @Option(label = "已完成", value = "3")
    })
    private String runStatus;

    @OneToMany(targetModel = "vacuum_pump_run_batch", targetProperty = "run", displayName = "炉次批次明细")
    @Property(displayName = "炉次批次明细")
    private List<VacuumPumpRunBatch> runBatchList;

    public VacuumPumpRun setRunNo(String runNo) {
        this.set("runNo", runNo);
        return this;
    }

    public VacuumPumpRun setEquipment(EquipmentMold equipment) {
        this.set("equipment", equipment);
        return this;
    }

    public VacuumPumpRun setVacuumTemp(Double vacuumTemp) {
        this.set("vacuumTemp", vacuumTemp);
        return this;
    }

    public VacuumPumpRun setVacuumDuration(Integer vacuumDuration) {
        this.set("vacuumDuration", vacuumDuration);
        return this;
    }

    public VacuumPumpRun setStartTime(Date startTime) {
        this.set("startTime", startTime);
        return this;
    }

    public VacuumPumpRun setEndTime(Date endTime) {
        this.set("endTime", endTime);
        return this;
    }

    public VacuumPumpRun setOperator(String operator) {
        this.set("operator", operator);
        return this;
    }

    public VacuumPumpRun setRunStatus(String runStatus) {
        this.set("runStatus", runStatus);
        return this;
    }

    public VacuumPumpRun setRunBatchList(List<VacuumPumpRunBatch> runBatchList) {
        this.set("runBatchList", runBatchList);
        return this;
    }

    public String getRunNo() {
        return getStr("runNo");
    }

    public EquipmentMold getEquipment() {
        return (EquipmentMold) this.get("equipment");
    }

    public Double getVacuumTemp() {
        return getDouble("vacuumTemp");
    }

    public Integer getVacuumDuration() {
        return getInt("vacuumDuration");
    }

    public Date getStartTime() {
        return (Date) this.get("startTime");
    }

    public Date getEndTime() {
        return (Date) this.get("endTime");
    }

    public String getOperator() {
        return getStr("operator");
    }

    public String getRunStatus() {
        return getStr("runStatus");
    }

    @SuppressWarnings("unchecked")
    public List<VacuumPumpRunBatch> getRunBatchList() {
        return (List<VacuumPumpRunBatch>) this.get("runBatchList");
    }


    @MethodService(name = "create", auth = "create", description = "创建抽真空炉次")
    public RecordSet create(RecordSet rs, List<VacuumPumpRun> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(VacuumPumpRun.class, "create");
        }
        for (VacuumPumpRun item : valuesList) {
            if (item.getRunNo() == null || item.getRunNo().trim().isEmpty()) {
                item.setRunNo(com.sie.app.cupbase.util.CupCode.nextCode("PUMP_RUN", "VR", 3));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(VacuumPumpRun.class, "create", valuesList);
    }


}
