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
 * 温降测试
 */
@Model(name = "temp_drop_test", displayName = "温降测试", description = "保冷/保热温降测试", isAutoLog = Bool.True)
public class TempDropTest extends BaseModel<TempDropTest> {

    @ManyToOne(displayName = "生产批次")
    @JoinColumn
    private ProductionBatch batch;

    @Property(displayName = "测试类型", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "保冷", value = "1"),
            @Option(label = "保热", value = "2")
    })
    private String testType;

    @Property(displayName = "触发类型", defaultValue = "3", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "新模首测", value = "1"),
            @Option(label = "改模首测", value = "2"),
            @Option(label = "常规抽测", value = "3")
    })
    private String triggerType;

    @Property(displayName = "测试序号")
    private Integer testSeq;

    @Property(displayName = "起始温度(℃)")
    private Double startTemp;

    @Property(displayName = "结束温度(℃)")
    private Double endTemp;

    @Property(dataType = DataType.JSON, displayName = "温降曲线")
    private String curveData;

    @Property(displayName = "判定结果", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "合格", value = "1"),
            @Option(label = "不合格", value = "2")
    })
    private String result;

    @Property(displayName = "测试人")
    private String testedBy;

    @Property(dataType = DataType.DATE_TIME, displayName = "测试时间")
    private Date testedAt;

    public TempDropTest setBatch(ProductionBatch batch) {
        this.set("batch", batch);
        return this;
    }

    public TempDropTest setTestType(String testType) {
        this.set("testType", testType);
        return this;
    }

    public TempDropTest setTriggerType(String triggerType) {
        this.set("triggerType", triggerType);
        return this;
    }

    public TempDropTest setTestSeq(Integer testSeq) {
        this.set("testSeq", testSeq);
        return this;
    }

    public TempDropTest setStartTemp(Double startTemp) {
        this.set("startTemp", startTemp);
        return this;
    }

    public TempDropTest setEndTemp(Double endTemp) {
        this.set("endTemp", endTemp);
        return this;
    }

    public TempDropTest setCurveData(String curveData) {
        this.set("curveData", curveData);
        return this;
    }

    public TempDropTest setResult(String result) {
        this.set("result", result);
        return this;
    }

    public TempDropTest setTestedBy(String testedBy) {
        this.set("testedBy", testedBy);
        return this;
    }

    public TempDropTest setTestedAt(Date testedAt) {
        this.set("testedAt", testedAt);
        return this;
    }

    public ProductionBatch getBatch() {
        return (ProductionBatch) this.get("batch");
    }

    public String getTestType() {
        return getStr("testType");
    }

    public String getTriggerType() {
        return getStr("triggerType");
    }

    public Integer getTestSeq() {
        return getInt("testSeq");
    }

    public Double getStartTemp() {
        return getDouble("startTemp");
    }

    public Double getEndTemp() {
        return getDouble("endTemp");
    }

    public String getCurveData() {
        return getStr("curveData");
    }

    public String getResult() {
        return getStr("result");
    }

    public String getTestedBy() {
        return getStr("testedBy");
    }

    public Date getTestedAt() {
        return (Date) this.get("testedAt");
    }


    @MethodService(name = "create", auth = "create", description = "记录温降测试，不合格自动锁定批次")
    public RecordSet create(RecordSet rs, List<TempDropTest> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(TempDropTest.class, "create");
        }
        for (TempDropTest item : valuesList) {
            if (item.getTestedAt() == null) {
                item.setTestedAt(new Date());
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        RecordSet created = (RecordSet) rs.callSuper(TempDropTest.class, "create", valuesList);
        String[] ids = created == null ? null : created.getIds();
        for (int i = 0; i < valuesList.size(); i++) {
            TempDropTest item = valuesList.get(i);
            if ("2".equals(item.getResult())) {
                String sourceId = (ids != null && i < ids.length) ? ids[i] : item.getStr("id");
                com.sie.app.cupqc.util.LockSupport.lockBatch(rs, item.getStr("batch"), "2", "3", sourceId);
            }
        }
        return created;
    }


}
