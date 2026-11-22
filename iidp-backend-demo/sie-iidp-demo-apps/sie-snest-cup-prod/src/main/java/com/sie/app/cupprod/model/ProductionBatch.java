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
import com.sie.app.cupbase.model.ProductSku;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * 生产批次
 */
@Model(name = "production_batch", displayName = "生产批次", description = "生产批次（追溯主键）", isAutoLog = Bool.True)
public class ProductionBatch extends BaseModel<ProductionBatch> {

    @Validate.Unique(properties = {"batchCode"}, message = "批次码已存在！")
    @Property(displayName = "批次码", unique = true, displayForModel = true)
    private String batchCode;

    @ManyToOne(displayName = "生产工单")
    @JoinColumn
    private ProductionOrder prodOrder;

    @ManyToOne(displayName = "父批次")
    @JoinColumn
    private ProductionBatch parentBatch;

    @ManyToOne(displayName = "产品SKU")
    @JoinColumn
    private ProductSku sku;

    @Property(displayName = "当前工序")
    private String currentProcess;

    @Property(displayName = "批次状态", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "在制", value = "1"),
            @Option(label = "待检", value = "2"),
            @Option(label = "锁定", value = "3"),
            @Option(label = "返工中", value = "4"),
            @Option(label = "放行", value = "5"),
            @Option(label = "报废", value = "6")
    })
    private String status;

    @Property(displayName = "是否锁定", defaultValue = "0")
    private Boolean lockFlag;

    @Property(displayName = "批次数量")
    private Integer batchQty;

    @OneToMany(targetModel = "process_history", targetProperty = "batch", displayName = "工序履历")
    @Property(displayName = "工序履历")
    private List<ProcessHistory> processHistoryList;

    public ProductionBatch setBatchCode(String batchCode) {
        this.set("batchCode", batchCode);
        return this;
    }

    public ProductionBatch setProdOrder(ProductionOrder prodOrder) {
        this.set("prodOrder", prodOrder);
        return this;
    }

    public ProductionBatch setParentBatch(ProductionBatch parentBatch) {
        this.set("parentBatch", parentBatch);
        return this;
    }

    public ProductionBatch setSku(ProductSku sku) {
        this.set("sku", sku);
        return this;
    }

    public ProductionBatch setCurrentProcess(String currentProcess) {
        this.set("currentProcess", currentProcess);
        return this;
    }

    public ProductionBatch setStatus(String status) {
        this.set("status", status);
        return this;
    }

    public ProductionBatch setLockFlag(Boolean lockFlag) {
        this.set("lockFlag", lockFlag);
        return this;
    }

    public ProductionBatch setBatchQty(Integer batchQty) {
        this.set("batchQty", batchQty);
        return this;
    }

    public ProductionBatch setProcessHistoryList(List<ProcessHistory> processHistoryList) {
        this.set("processHistoryList", processHistoryList);
        return this;
    }

    public String getBatchCode() {
        return getStr("batchCode");
    }

    public ProductionOrder getProdOrder() {
        return (ProductionOrder) this.get("prodOrder");
    }

    public ProductionBatch getParentBatch() {
        return (ProductionBatch) this.get("parentBatch");
    }

    public ProductSku getSku() {
        return (ProductSku) this.get("sku");
    }

    public String getCurrentProcess() {
        return getStr("currentProcess");
    }

    public String getStatus() {
        return getStr("status");
    }

    public Boolean getLockFlag() {
        return (Boolean) this.get("lockFlag");
    }

    public Integer getBatchQty() {
        return getInt("batchQty");
    }

    @SuppressWarnings("unchecked")
    public List<ProcessHistory> getProcessHistoryList() {
        return (List<ProcessHistory>) this.get("processHistoryList");
    }


    @MethodService(name = "create", auth = "create", description = "创建生产批次")
    public RecordSet create(RecordSet rs, List<ProductionBatch> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(ProductionBatch.class, "create");
        }
        for (ProductionBatch item : valuesList) {
            if (item.getBatchCode() == null || item.getBatchCode().trim().isEmpty()) {
                item.setBatchCode(com.sie.app.cupbase.util.CupCode.nextCode("BATCH", "B", 4));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(ProductionBatch.class, "create", valuesList);
    }

    @MethodService(name = "lock", auth = "update", description = "锁定批次")
    public boolean lock(String batchId, String reason) {
        ProductionBatch batch = DbUtils.select(Filter.equal("id", batchId), "production_batch", ProductionBatch.class);
        if (batch == null) {
            throw new ValidationException("批次不存在：" + batchId);
        }
        com.sie.app.cupprod.util.BatchState.patch(batchId, "3", Boolean.TRUE);
        return true;
    }

    @MethodService(name = "unlock", auth = "update", description = "解锁批次")
    public boolean unlock(String batchId) {
        ProductionBatch batch = DbUtils.select(Filter.equal("id", batchId), "production_batch", ProductionBatch.class);
        if (batch == null) {
            throw new ValidationException("批次不存在：" + batchId);
        }
        com.sie.app.cupprod.util.BatchState.patch(batchId, "1", Boolean.FALSE);
        return true;
    }


}
