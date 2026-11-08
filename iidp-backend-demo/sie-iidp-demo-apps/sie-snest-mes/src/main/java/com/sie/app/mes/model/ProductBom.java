package com.sie.app.mes.model;

import com.sie.snest.sdk.BaseModel;
import com.sie.snest.sdk.annotation.meta.Model;
import com.sie.snest.sdk.annotation.meta.Property;
import com.sie.snest.sdk.annotation.orm.JoinColumn;
import com.sie.snest.sdk.annotation.orm.ManyToOne;
import com.sie.snest.sdk.annotation.validate.Validate;

/**
 * 产品BOM：产品与物料的组成关系，amount 为组成数量
 *

 */
@Model(name = "product_bom", description = "产品BOM", displayName = "产品BOM")
public class ProductBom extends BaseModel<ProductBom> {

    @ManyToOne(displayName = "产品")
    @JoinColumn
    private Product product;

    @ManyToOne(displayName = "物料")
    @JoinColumn
    private Material material;

    @Validate.Range(min = 1, max = 999999, message = "数量必须大于 0！")
    @Property(displayName = "数量")
    private Integer amount;

    public ProductBom setProduct(Product product) {
        this.set("product", product);
        return this;
    }

    public Product getProduct() {
        return (Product) this.get("product");
    }

    public ProductBom setMaterial(Material material) {
        this.set("material", material);
        return this;
    }

    public Material getMaterial() {
        return (Material) this.get("material");
    }

    public ProductBom setAmount(Integer amount) {
        this.set("amount", amount);
        return this;
    }

    public Integer getAmount() {
        return getInt("amount");
    }
}
