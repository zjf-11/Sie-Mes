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
import com.sie.app.cupprod.model.ProductionBatch;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * 真空焊参数
 */
@Model(name = "vacuum_weld_record", displayName = "真空焊参数", description = "真空焊参数记录", isAutoLog = Bool.True)
public class VacuumWeldRecord extends BaseModel<VacuumWeldRecord> {

    @ManyToOne(displayName = "生产批次")
    @JoinColumn
    private ProductionBatch batch;

    @ManyToOne(displayName = "焊机设备")
    @JoinColumn
    private EquipmentMold equipment;

    @Property(displayName = "焊接电流(A)")
    private Double weldCurrent;

    @Property(displayName = "焊接时间(s)")
    private Double weldTime;

    @Property(displayName = "保护气体流量(L/min)")
    private Double gasFlow;

    @Property(displayName = "操作人")
    private String operator;

    @Property(dataType = DataType.DATE_TIME, displayName = "记录时间")
    private Date recordTime;

    @Property(displayName = "参数判定", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "正常", value = "1"),
            @Option(label = "异常", value = "2")
    })
    private String paramStatus;

    public VacuumWeldRecord setBatch(ProductionBatch batch) {
        this.set("batch", batch);
        return this;
    }

    public VacuumWeldRecord setEquipment(EquipmentMold equipment) {
        this.set("equipment", equipment);
        return this;
    }

    public VacuumWeldRecord setWeldCurrent(Double weldCurrent) {
        this.set("weldCurrent", weldCurrent);
        return this;
    }

    public VacuumWeldRecord setWeldTime(Double weldTime) {
        this.set("weldTime", weldTime);
        return this;
    }

    public VacuumWeldRecord setGasFlow(Double gasFlow) {
        this.set("gasFlow", gasFlow);
        return this;
    }

    public VacuumWeldRecord setOperator(String operator) {
        this.set("operator", operator);
        return this;
    }

    public VacuumWeldRecord setRecordTime(Date recordTime) {
        this.set("recordTime", recordTime);
        return this;
    }

    public VacuumWeldRecord setParamStatus(String paramStatus) {
        this.set("paramStatus", paramStatus);
        return this;
    }

    public ProductionBatch getBatch() {
        return (ProductionBatch) this.get("batch");
    }

    public EquipmentMold getEquipment() {
        return (EquipmentMold) this.get("equipment");
    }

    public Double getWeldCurrent() {
        return getDouble("weldCurrent");
    }

    public Double getWeldTime() {
        return getDouble("weldTime");
    }

    public Double getGasFlow() {
        return getDouble("gasFlow");
    }

    public String getOperator() {
        return getStr("operator");
    }

    public Date getRecordTime() {
        return (Date) this.get("recordTime");
    }

    public String getParamStatus() {
        return getStr("paramStatus");
    }


    @MethodService(name = "create", auth = "create", description = "记录真空焊参数并自动判定")
    public RecordSet create(RecordSet rs, List<VacuumWeldRecord> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(VacuumWeldRecord.class, "create");
        }
        for (VacuumWeldRecord item : valuesList) {
            boolean bad = false;
            Double current = item.getWeldCurrent();
            Double time = item.getWeldTime();
            Double gas = item.getGasFlow();
            if (current != null && (current < 80D || current > 120D)) {
                bad = true;
            }
            if (time != null && (time < 1.5D || time > 3.0D)) {
                bad = true;
            }
            if (gas != null && (gas < 8D || gas > 15D)) {
                bad = true;
            }
            item.setParamStatus(bad ? "2" : "1");
            if (item.getRecordTime() == null) {
                item.setRecordTime(new Date());
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(VacuumWeldRecord.class, "create", valuesList);
    }


}
