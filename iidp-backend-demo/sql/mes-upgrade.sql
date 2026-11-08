-- ============================================================
-- MES 产品/物料/BOM/编码规则 升级脚本（可重复执行）
-- 说明：engine.model2ddl.mode 未开启，新增字段与新增模型需要手工执行本脚本
-- 执行：mysql --host=127.0.0.1 -uroot -p123456 --default-character-set=utf8mb4 iidp_demo_v3 < mes-upgrade.sql
-- ============================================================

-- 1. 产品：增加“规格”字段
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `product` ADD COLUMN `spec` varchar(240) DEFAULT NULL COMMENT ''规格'' AFTER `name`',
    'SELECT ''product.spec already exists''')
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'spec');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. 产品编码唯一
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `product` ADD UNIQUE KEY `uk_product_tenant_code` (`tenant_id`, `code`)',
    'SELECT ''uk_product_tenant_code already exists''')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND INDEX_NAME = 'uk_product_tenant_code');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. 物料编码唯一
SET @sql = (SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `ems_material` ADD UNIQUE KEY `uk_material_tenant_code` (`tenant_id`, `code`)',
    'SELECT ''uk_material_tenant_code already exists''')
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ems_material' AND INDEX_NAME = 'uk_material_tenant_code');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. 编码规则表
CREATE TABLE IF NOT EXISTS `code_rule`
(
    `id`          varchar(64)  NOT NULL COMMENT '主键',
    `name`        varchar(240) DEFAULT NULL COMMENT '规则名称',
    `code`        varchar(240) DEFAULT NULL COMMENT '规则编码',
    `prefix`      varchar(64)  DEFAULT NULL COMMENT '前缀',
    `seq_length`  int          DEFAULT '5' COMMENT '流水号位数',
    `date_format` varchar(64)  DEFAULT 'yyyyMMdd' COMMENT '日期格式，留空表示编码中不含日期',
    `current_seq` int          DEFAULT '0' COMMENT '当前流水号',
    `seq_date`    varchar(32)  DEFAULT NULL COMMENT '当前流水号所属日期',
    `remark`      varchar(240) DEFAULT NULL COMMENT '备注',
    `tenant_id`   varchar(64)  DEFAULT NULL COMMENT '租户',
    `create_user` varchar(64)  DEFAULT NULL COMMENT '创建人',
    `create_date` timestamp    NULL DEFAULT NULL COMMENT '创建时间',
    `update_user` varchar(64)  DEFAULT NULL COMMENT '更新人',
    `update_date` timestamp    NULL DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code_rule_tenant_code` (`tenant_id`, `code`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='编码规则';

-- 5. 内置规则：产品 / 物料
--    若运行期租户不是下面这个，编码服务会在首次使用时按默认规则自动补建，无需手工处理
INSERT INTO `code_rule` (`id`, `name`, `code`, `prefix`, `seq_length`, `date_format`, `current_seq`, `seq_date`,
                         `remark`, `tenant_id`, `create_date`)
VALUES ('cr_product', '产品编码规则', 'PRODUCT', 'P', 5, 'yyyyMMdd', 0, NULL, '产品编码：P + 日期 + 5位流水', '06brx72eqh1nn',
        NOW()),
       ('cr_material', '物料编码规则', 'MATERIAL', 'M', 5, 'yyyyMMdd', 0, NULL, '物料编码：M + 日期 + 5位流水', '06brx72eqh1nn',
        NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
