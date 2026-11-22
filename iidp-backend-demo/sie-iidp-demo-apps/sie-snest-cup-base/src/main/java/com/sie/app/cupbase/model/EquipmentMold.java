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
 * 设备模具
 */
@Model(name = "equipment_mold", displayName = "设备模具", description = "设备与模具台账", isAutoLog = Bool.True)
public class EquipmentMold extends BaseModel<EquipmentMold> {

    @Validate.NotBlank(message = "设备/模具编号不能为空！")
    @Validate.Unique(properties = {"assetCode"}, message = "设备/模具编号已存在！")
    @Property(displayName = "设备/模具编号", unique = true)
    private String assetCode;

    @Property(displayName = "类型", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "设备", value = "1"),
            @Option(label = "模具", value = "2")
    })
    private String assetType;

    @Validate.NotBlank(message = "名称不能为空！")
    @Property(displayName = "名称")
    private String assetName;

    @Property(displayName = "状态", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {
            @Option(label = "正常", value = "1"),
            @Option(label = "保养中", value = "2"),
            @Option(label = "停用", value = "3")
    })
    private String status;

    @Property(displayName = "累计模次")
    private Integer moldShotCount;

    @Property(dataType = DataType.DATE_TIME, displayName = "最近保养时间")
    private Date lastMaintenanceAt;

    public EquipmentMold setAssetCode(String assetCode) {
        this.set("assetCode", assetCode);
        return this;
    }

    public EquipmentMold setAssetType(String assetType) {
        this.set("assetType", assetType);
        return this;
    }

    public EquipmentMold setAssetName(String assetName) {
        this.set("assetName", assetName);
        return this;
    }

    public EquipmentMold setStatus(String status) {
        this.set("status", status);
        return this;
    }

    public EquipmentMold setMoldShotCount(Integer moldShotCount) {
        this.set("moldShotCount", moldShotCount);
        return this;
    }

    public EquipmentMold setLastMaintenanceAt(Date lastMaintenanceAt) {
        this.set("lastMaintenanceAt", lastMaintenanceAt);
        return this;
    }

    public String getAssetCode() {
        return getStr("assetCode");
    }

    public String getAssetType() {
        return getStr("assetType");
    }

    public String getAssetName() {
        return getStr("assetName");
    }

    public String getStatus() {
        return getStr("status");
    }

    public Integer getMoldShotCount() {
        return getInt("moldShotCount");
    }

    public Date getLastMaintenanceAt() {
        return (Date) this.get("lastMaintenanceAt");
    }

}
