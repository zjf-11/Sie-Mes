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

import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;

/**
 * 物料批次谱系
 */
@Model(name = "material_lot_genealogy", displayName = "物料批次谱系", description = "原料批次到成品批次的投入关系", isAutoLog = Bool.True)
public class MaterialLotGenealogy extends BaseModel<MaterialLotGenealogy> {

    @Validate.NotBlank(message = "子批次ID不能为空！")
    @Property(displayName = "子批次ID")
    private String childLotId;

    @Property(displayName = "子批次类型", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "成品", value = "1"),
            @Option(label = "半成品", value = "2"),
            @Option(label = "原料", value = "3")
    })
    private String childLotType;

    @Property(displayName = "父批次ID")
    private String parentLotId;

    @Property(displayName = "父批次类型", defaultValue = "3", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "原料", value = "1"),
            @Option(label = "半成品", value = "2")
    })
    private String parentLotType;

    @Property(displayName = "物料编码")
    private String materialCode;

    @Property(displayName = "供应商")
    private String supplier;

    @Property(displayName = "投入数量")
    private Double qty;

    @Property(displayName = "单位")
    private String unit;

    @Property(displayName = "关系类型", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "投入", value = "1"),
            @Option(label = "组成", value = "2")
    })
    private String relationType;

    @Property(dataType = DataType.DATE_TIME, displayName = "创建时间")
    private Date createdAt;

    public MaterialLotGenealogy setChildLotId(String childLotId) {
        this.set("childLotId", childLotId);
        return this;
    }

    public MaterialLotGenealogy setChildLotType(String childLotType) {
        this.set("childLotType", childLotType);
        return this;
    }

    public MaterialLotGenealogy setParentLotId(String parentLotId) {
        this.set("parentLotId", parentLotId);
        return this;
    }

    public MaterialLotGenealogy setParentLotType(String parentLotType) {
        this.set("parentLotType", parentLotType);
        return this;
    }

    public MaterialLotGenealogy setMaterialCode(String materialCode) {
        this.set("materialCode", materialCode);
        return this;
    }

    public MaterialLotGenealogy setSupplier(String supplier) {
        this.set("supplier", supplier);
        return this;
    }

    public MaterialLotGenealogy setQty(Double qty) {
        this.set("qty", qty);
        return this;
    }

    public MaterialLotGenealogy setUnit(String unit) {
        this.set("unit", unit);
        return this;
    }

    public MaterialLotGenealogy setRelationType(String relationType) {
        this.set("relationType", relationType);
        return this;
    }

    public MaterialLotGenealogy setCreatedAt(Date createdAt) {
        this.set("createdAt", createdAt);
        return this;
    }

    public String getChildLotId() {
        return getStr("childLotId");
    }

    public String getChildLotType() {
        return getStr("childLotType");
    }

    public String getParentLotId() {
        return getStr("parentLotId");
    }

    public String getParentLotType() {
        return getStr("parentLotType");
    }

    public String getMaterialCode() {
        return getStr("materialCode");
    }

    public String getSupplier() {
        return getStr("supplier");
    }

    public Double getQty() {
        return getDouble("qty");
    }

    public String getUnit() {
        return getStr("unit");
    }

    public String getRelationType() {
        return getStr("relationType");
    }

    public Date getCreatedAt() {
        return (Date) this.get("createdAt");
    }

}
