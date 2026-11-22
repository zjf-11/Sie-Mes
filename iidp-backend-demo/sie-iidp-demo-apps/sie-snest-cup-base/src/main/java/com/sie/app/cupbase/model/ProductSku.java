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
 * 产品SKU
 */
@Model(name = "product_sku", displayName = "产品SKU", description = "保温杯产品SKU", isAutoLog = Bool.True)
public class ProductSku extends BaseModel<ProductSku> {

    @Validate.Unique(properties = {"skuCode"}, message = "SKU编码已存在！")
    @Property(displayName = "SKU编码", unique = true, displayForModel = true)
    private String skuCode;

    @Validate.NotBlank(message = "产品名称不能为空！")
    @Property(displayName = "产品名称")
    private String productName;

    @Property(displayName = "容量(ml)")
    private Integer capacityMl;

    @Property(displayName = "杯口口径")
    private String caliber;

    @Property(dataType = DataType.TEXT, displayName = "配件清单")
    private String accessoryList;

    @Property(displayName = "执行标准")
    private String executeStandard;

    @Property(displayName = "状态", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "启用", value = "1"),
            @Option(label = "停用", value = "2")
    })
    private String status;

    public ProductSku setSkuCode(String skuCode) {
        this.set("skuCode", skuCode);
        return this;
    }

    public ProductSku setProductName(String productName) {
        this.set("productName", productName);
        return this;
    }

    public ProductSku setCapacityMl(Integer capacityMl) {
        this.set("capacityMl", capacityMl);
        return this;
    }

    public ProductSku setCaliber(String caliber) {
        this.set("caliber", caliber);
        return this;
    }

    public ProductSku setAccessoryList(String accessoryList) {
        this.set("accessoryList", accessoryList);
        return this;
    }

    public ProductSku setExecuteStandard(String executeStandard) {
        this.set("executeStandard", executeStandard);
        return this;
    }

    public ProductSku setStatus(String status) {
        this.set("status", status);
        return this;
    }

    public String getSkuCode() {
        return getStr("skuCode");
    }

    public String getProductName() {
        return getStr("productName");
    }

    public Integer getCapacityMl() {
        return getInt("capacityMl");
    }

    public String getCaliber() {
        return getStr("caliber");
    }

    public String getAccessoryList() {
        return getStr("accessoryList");
    }

    public String getExecuteStandard() {
        return getStr("executeStandard");
    }

    public String getStatus() {
        return getStr("status");
    }


    @MethodService(name = "create", auth = "create", description = "创建产品SKU")
    public RecordSet create(RecordSet rs, List<ProductSku> valuesList) {
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(ProductSku.class, "create");
        }
        for (ProductSku item : valuesList) {
            if (item.getSkuCode() == null || item.getSkuCode().trim().isEmpty()) {
                item.setSkuCode(com.sie.app.cupbase.util.CupCode.nextCode("SKU", "CUP", 4));
            }
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(ProductSku.class, "create", valuesList);
    }


}
