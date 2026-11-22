package com.sie.app.cupprod.model;

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
 * 工序履历
 */
@Model(name = "process_history", displayName = "工序履历", description = "批次在每道工序的执行记录", isAutoLog = Bool.True)
public class ProcessHistory extends BaseModel<ProcessHistory> {

    @ManyToOne(displayName = "生产批次")
    @JoinColumn
    private ProductionBatch batch;

    @Property(displayName = "工序序号")
    private Integer seqNo;

    @Property(displayName = "工序编码")
    private String processCode;

    @Property(displayName = "工序名称")
    private String processName;

    @ManyToOne(displayName = "设备")
    @JoinColumn
    private EquipmentMold equipment;

    @ManyToOne(displayName = "模具")
    @JoinColumn
    private EquipmentMold mold;

    @Property(displayName = "操作人")
    private String operator;

    @Property(displayName = "合格数")
    private Integer qualifiedQty;

    @Property(displayName = "不合格数")
    private Integer unqualifiedQty;

    @Property(dataType = DataType.DATE_TIME, displayName = "开始时间")
    private Date startTime;

    @Property(dataType = DataType.DATE_TIME, displayName = "结束时间")
    private Date endTime;

    @Property(displayName = "工序结果", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "合格", value = "1"),
            @Option(label = "不合格", value = "2")
    })
    private String result;

    @Property(displayName = "备注")
    private String remark;

    public ProcessHistory setBatch(ProductionBatch batch) {
        this.set("batch", batch);
        return this;
    }

    public ProcessHistory setSeqNo(Integer seqNo) {
        this.set("seqNo", seqNo);
        return this;
    }

    public ProcessHistory setProcessCode(String processCode) {
        this.set("processCode", processCode);
        return this;
    }

    public ProcessHistory setProcessName(String processName) {
        this.set("processName", processName);
        return this;
    }

    public ProcessHistory setEquipment(EquipmentMold equipment) {
        this.set("equipment", equipment);
        return this;
    }

    public ProcessHistory setMold(EquipmentMold mold) {
        this.set("mold", mold);
        return this;
    }

    public ProcessHistory setOperator(String operator) {
        this.set("operator", operator);
        return this;
    }

    public ProcessHistory setQualifiedQty(Integer qualifiedQty) {
        this.set("qualifiedQty", qualifiedQty);
        return this;
    }

    public ProcessHistory setUnqualifiedQty(Integer unqualifiedQty) {
        this.set("unqualifiedQty", unqualifiedQty);
        return this;
    }

    public ProcessHistory setStartTime(Date startTime) {
        this.set("startTime", startTime);
        return this;
    }

    public ProcessHistory setEndTime(Date endTime) {
        this.set("endTime", endTime);
        return this;
    }

    public ProcessHistory setResult(String result) {
        this.set("result", result);
        return this;
    }

    public ProcessHistory setRemark(String remark) {
        this.set("remark", remark);
        return this;
    }

    public ProductionBatch getBatch() {
        return (ProductionBatch) this.get("batch");
    }

    public Integer getSeqNo() {
        return getInt("seqNo");
    }

    public String getProcessCode() {
        return getStr("processCode");
    }

    public String getProcessName() {
        return getStr("processName");
    }

    public EquipmentMold getEquipment() {
        return (EquipmentMold) this.get("equipment");
    }

    public EquipmentMold getMold() {
        return (EquipmentMold) this.get("mold");
    }

    public String getOperator() {
        return getStr("operator");
    }

    public Integer getQualifiedQty() {
        return getInt("qualifiedQty");
    }

    public Integer getUnqualifiedQty() {
        return getInt("unqualifiedQty");
    }

    public Date getStartTime() {
        return (Date) this.get("startTime");
    }

    public Date getEndTime() {
        return (Date) this.get("endTime");
    }

    public String getResult() {
        return getStr("result");
    }

    public String getRemark() {
        return getStr("remark");
    }


    @MethodService(name = "create", auth = "create", description = "新增工序履历")
    public RecordSet create(RecordSet rs, List<ProcessHistory> valuesList) {
        if (valuesList != null) {
            for (ProcessHistory item : valuesList) {
                String batchId = item.getStr("batch");
                if (batchId == null || batchId.isEmpty()) {
                    continue;
                }
                ProductionBatch batch = DbUtils.select(Filter.equal("id", batchId), "production_batch", ProductionBatch.class);
                if (batch != null && (Boolean.TRUE.equals(batch.getLockFlag()) || "3".equals(batch.getStatus()))) {
                    throw new ValidationException("批次[" + batch.getBatchCode() + "]已锁定，禁止流转到下一工序！");
                }
            }
        }
        return (RecordSet) rs.callSuper(ProcessHistory.class, "create", valuesList);
    }


}
