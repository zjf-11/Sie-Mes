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
 * 生产工单
 */
@Model(name = "production_order", displayName = "生产工单", description = "生产工单", isAutoLog = Bool.True)
public class ProductionOrder extends BaseModel<ProductionOrder> {

    @Validate.Unique(properties = {"orderNo"}, message = "工单号已存在！")
    @Property(displayName = "工单号", unique = true, displayForModel = true)
    private String orderNo;

    @ManyToOne(displayName = "产品SKU")
    @JoinColumn
    private ProductSku sku;

    @Property(displayName = "计划数量")
    private Integer planQty;

    @Property(displayName = "客户订单号")
    private String customerOrderNo;

    @Property(dataType = DataType.DATE_TIME, displayName = "交期")
    private Date dueDate;

    @Property(displayName = "配件齐套", defaultValue = "0")
    private Boolean accessoryReadyFlag;

    @Property(displayName = "工单状态", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "待生产", value = "1"),
            @Option(label = "生产中", value = "2"),
            @Option(label = "已完成", value = "3"),
            @Option(label = "已关闭", value = "4")
    })
    private String status;

    @OneToMany(targetModel = "production_batch", targetProperty = "prodOrder", displayName = "生产批次")
    @Property(displayName = "生产批次")
    private List<ProductionBatch> batchList;

    public ProductionOrder setOrderNo(String orderNo) {
        this.set("orderNo", orderNo);
        return this;
    }

    public ProductionOrder setSku(ProductSku sku) {
        this.set("sku", sku);
        return this;
    }

    public ProductionOrder setPlanQty(Integer planQty) {
        this.set("planQty", planQty);
        return this;
    }

    public ProductionOrder setCustomerOrderNo(String customerOrderNo) {
        this.set("customerOrderNo", customerOrderNo);
        return this;
    }

    public ProductionOrder setDueDate(Date dueDate) {
        this.set("dueDate", dueDate);
        return this;
    }

    public ProductionOrder setAccessoryReadyFlag(Boolean accessoryReadyFlag) {
        this.set("accessoryReadyFlag", accessoryReadyFlag);
        return this;
    }

    public ProductionOrder setStatus(String status) {
        this.set("status", status);
        return this;
    }

    public ProductionOrder setBatchList(List<ProductionBatch> batchList) {
        this.set("batchList", batchList);
        return this;
    }

    public String getOrderNo() {
        return getStr("orderNo");
    }

    public ProductSku getSku() {
        return (ProductSku) this.get("sku");
    }

    public Integer getPlanQty() {
        return getInt("planQty");
    }

    public String getCustomerOrderNo() {
        return getStr("customerOrderNo");
    }

    public Date getDueDate() {
        return (Date) this.get("dueDate");
    }

    public Boolean getAccessoryReadyFlag() {
        return (Boolean) this.get("accessoryReadyFlag");
    }

    public String getStatus() {
        return getStr("status");
    }

    @SuppressWarnings("unchecked")
    public List<ProductionBatch> getBatchList() {
        return (List<ProductionBatch>) this.get("batchList");
    }


    @MethodService(name = "create", auth = "create", description = "创建生产工单")
    public RecordSet create(RecordSet rs, List<ProductionOrder> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(ProductionOrder.class, "create");
        }
        for (ProductionOrder item : valuesList) {
            if (item.getOrderNo() == null || item.getOrderNo().trim().isEmpty()) {
                item.setOrderNo(com.sie.app.cupbase.util.CupCode.nextCode("ORDER", "SO", 4));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(ProductionOrder.class, "create", valuesList);
    }


}
