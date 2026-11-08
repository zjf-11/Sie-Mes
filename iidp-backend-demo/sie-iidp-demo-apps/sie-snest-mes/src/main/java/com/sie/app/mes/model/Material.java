package com.sie.app.mes.model;

import com.sie.app.mes.util.CodeRuleGenerator;
import com.sie.snest.engine.data.RecordSet;
import com.sie.snest.engine.exception.ValidationException;
import com.sie.snest.engine.model.Bool;
import com.sie.snest.engine.rule.Filter;
import com.sie.snest.sdk.BaseModel;
import com.sie.snest.sdk.annotation.Dict;
import com.sie.snest.sdk.annotation.meta.MethodService;
import com.sie.snest.sdk.annotation.meta.Model;
import com.sie.snest.sdk.annotation.meta.Property;
import com.sie.snest.sdk.annotation.orm.JoinColumn;
import com.sie.snest.sdk.annotation.orm.ManyToOne;
import com.sie.snest.sdk.annotation.validate.Validate;
import com.sie.snest.sdk.db.DbUtils;

import java.util.List;


@Model(name = "material",
        tableName = "ems_material",
        displayName = "物料",
        description = "物料信息",
        isAutoLog = Bool.True
)
public class Material extends BaseModel<Material> {

    @Property(displayName = "名称", displayForModel = true)
    private String name;

    @Validate.Unique(properties = {"code"}, message = "物料编码已存在！")
    @Property(displayName = "编码", unique = true)
    private String code;

    @Dict(typeCode = "material_type")
    @Property(displayName = "类型")
    private String type;

    @Dict(typeCode = "material_unit")
    @Property(displayName = "单位")
    private String unit;

    @Property(displayName = "描述")
    private String description;

    @Property(displayName = "库存量")
    private Integer stockQuantity;

    @Property(displayName = "单价")
    private Double price;


    @ManyToOne(displayName = "供应商")
    @JoinColumn
    private Supplier supplier;

    public Material setName(String name) {
        this.set("name", name);
        return this;
    }

    public String getName() {
        return getStr("name");
    }

    public Material setCode(String code) {
        this.set("code", code);
        return this;
    }

    public String getCode() {
        return getStr("code");
    }

    public Material setType(String type) {
        this.set("type", type);
        return this;
    }

    public String getType() {
        return getStr("type");
    }

    public Material setUnit(String unit) {
        this.set("unit", unit);
        return this;
    }

    public String getUnit() {
        return getStr("unit");
    }

    public Material setDescription(String description) {
        this.set("description", description);
        return this;
    }

    public String getDescription() {
        return getStr("description");
    }

    public Material setStockQuantity(Integer stockQuantity) {
        this.set("stockQuantity", stockQuantity);
        return this;
    }

    public Integer getStockQuantity() {
        return getInt("stockQuantity");
    }

    public Material setPrice(Double price) {
        this.set("price", price);
        return this;
    }

    public Double getPrice() {
        return getDouble("price");
    }

    public Material setSupplier(Supplier supplier) {
        this.set("supplier", supplier);
        return this;
    }

    public Supplier getSupplier() {
        return (Supplier) this.get("supplier");
    }

    @MethodService(name = "create",auth = "create",description = "创建")
    public RecordSet create(RecordSet rs, List<Material> valuesList){
        // 参数名必须是 valuesList，平台按参数名从 RPC args 中取值
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(Material.class, "create");
        }
        for (Material item : valuesList) {
            String code = item.getCode();
            // 编码未手工填写时，调用编码服务按 MATERIAL 规则生成
            if (code == null || code.trim().isEmpty()) {
                code = CodeRuleGenerator.nextCode("MATERIAL");
            }
            code = code.trim();
            if (DbUtils.count(Filter.equal("code", code), Material.class) > 0) {
                throw new ValidationException("物料编码已存在：" + code);
            }
            item.setCode(code);
            /**
             * 获取当前上下文用户id
             */
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(Material.class,"create",valuesList);
    }

    @MethodService(name="search",auth = "search",description = "分页查询方法")
    public List<Material> search(RecordSet rs, Filter filter,
                                           List<String> properties,
                                           Integer limit,Integer offset,String order){
        /**
         * 获取创建人userId
         * 1、查询前增加查询属性；
         *   properties.add("create_user");
         * 2、获取方式如下：
         * ((Map<String,Object>)result.get(0)).get("create_user")
         */

        //com.sie.snest.engine.rule.Filter
        List<Material> result =
                (List<Material>) rs.callSuper(Material.class,"search",filter,properties,limit,offset,order);
        System.out.println("分页查询方法返回参数"+result);
        return result;
    }



}
