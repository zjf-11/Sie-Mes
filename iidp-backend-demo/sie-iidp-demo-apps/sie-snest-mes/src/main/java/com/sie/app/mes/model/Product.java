package com.sie.app.mes.model;

import com.sie.app.mes.util.CodeRuleGenerator;
import com.sie.snest.engine.data.RecordSet;
import com.sie.snest.engine.model.Bool;
import com.sie.snest.sdk.BaseModel;
import com.sie.snest.sdk.annotation.meta.MethodService;
import com.sie.snest.sdk.annotation.meta.Model;
import com.sie.snest.sdk.annotation.meta.Property;
import com.sie.snest.sdk.annotation.orm.OneToMany;
import com.sie.snest.sdk.annotation.orm.Option;
import com.sie.snest.sdk.annotation.orm.Selection;
import com.sie.snest.sdk.annotation.validate.Validate;

import java.util.List;


@Model(name = "product", description = "产品", displayName = "产品", isAutoLog = Bool.True)
public class Product extends BaseModel<Product> {

    @Validate.NotBlank(message = "产品名称不能为空！")
    @Property(displayName = "名称", displayForModel = true)
    private String name;

    @Validate.Unique(properties = {"code"}, message = "产品编码已存在！")
    @Property(displayName = "编码", unique = true)
    private String code;

    @Property(displayName = "规格", length = 240)
    private String spec;

    @Property(displayName = "产品状态", defaultValue = "1", widget = "select", length = 256)
    @Selection(values = {@Option(label = "设计中", value = "1"),
            @Option(label = "生产中", value = "2"),
            @Option(label = "已完成", value = "3")})
    private String status;

    @OneToMany(targetModel = "product_bom", targetProperty = "product", displayName = "产品BOM")
    @Property(displayName = "产品BOM")
    private List<ProductBom> productBomList;

    public Product setName(String name) {
        this.set("name", name);
        return this;
    }

    public String getName() {
        return getStr("name");
    }

    public Product setCode(String code) {
        this.set("code", code);
        return this;
    }

    public String getCode() {
        return getStr("code");
    }

    public Product setSpec(String spec) {
        this.set("spec", spec);
        return this;
    }

    public String getSpec() {
        return getStr("spec");
    }

    public Product setStatus(String status) {
        this.set("status", status);
        return this;
    }

    public String getStatus() {
        return getStr("status");
    }

    public Product setProductBomList(List<ProductBom> productBomList) {
        this.set("productBomList", productBomList);
        return this;
    }

    public List<ProductBom> getProductBomList() {
        return (List<ProductBom>) this.get("productBomList");
    }

    /**
     * 新建产品时，若未手工填写编码，则调用编码服务按 PRODUCT 规则生成
     */
    @MethodService(name = "create", auth = "create", description = "创建")
    public RecordSet create(RecordSet rs, List<Product> valuesList) {
        // 参数名必须是 valuesList，平台按参数名从 RPC args 中取值
        if (valuesList == null || valuesList.isEmpty()) {
            return (RecordSet) rs.callSuper(Product.class, "create");
        }
        for (Product item : valuesList) {
            String code = item.getCode();
            if (code == null || code.trim().isEmpty()) {
                code = CodeRuleGenerator.nextCode("PRODUCT");
            }
            item.setCode(code.trim());
            item.setCreate_user(rs.getMeta().getUserId());
        }
        return (RecordSet) rs.callSuper(Product.class, "create", valuesList);
    }
}
