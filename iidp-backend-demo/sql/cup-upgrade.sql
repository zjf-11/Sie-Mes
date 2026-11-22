-- =====================================================================
-- 保温杯生产管理系统（需求 8 / 9）：四个拆分 APP 的建表脚本
-- 库：iidp_demo_v3   幂等：全部 CREATE TABLE IF NOT EXISTS
-- =====================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `product_sku` (
  `id` varchar(64) NOT NULL COMMENT '主键',
  `sku_code` varchar(240) DEFAULT NULL COMMENT 'SKU编码',
  `product_name` varchar(240) DEFAULT NULL COMMENT '产品名称',
  `capacity_ml` int DEFAULT NULL COMMENT '容量(ml)',
  `caliber` varchar(240) DEFAULT NULL COMMENT '杯口口径',
  `accessory_list` text COMMENT '配件清单',
  `execute_standard` varchar(240) DEFAULT NULL COMMENT '执行标准',
  `status` varchar(256) DEFAULT NULL COMMENT '状态',
  `tenant_id` varchar(64) DEFAULT NULL COMMENT '租户',
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_sku_tenant_code` (`tenant_id`,`sku_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='产品SKU';

CREATE TABLE IF NOT EXISTS `equipment_mold` (
  `id` varchar(64) NOT NULL,
  `asset_code` varchar(240) DEFAULT NULL COMMENT '设备/模具编号',
  `asset_type` varchar(256) DEFAULT NULL COMMENT '类型',
  `asset_name` varchar(240) DEFAULT NULL COMMENT '名称',
  `status` varchar(256) DEFAULT NULL COMMENT '状态',
  `mold_shot_count` int DEFAULT NULL COMMENT '累计模次',
  `last_maintenance_at` datetime DEFAULT NULL COMMENT '最近保养时间',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_equipment_mold_tenant_code` (`tenant_id`,`asset_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备模具台账';

CREATE TABLE IF NOT EXISTS `cup_sequence` (
  `id` varchar(64) NOT NULL,
  `code_type` varchar(240) DEFAULT NULL COMMENT '编码类型',
  `current_value` int DEFAULT NULL COMMENT '当前值',
  `seq_date` varchar(240) DEFAULT NULL COMMENT '日期段',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cup_sequence_tenant_type` (`tenant_id`,`code_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='编码流水序列';

CREATE TABLE IF NOT EXISTS `production_order` (
  `id` varchar(64) NOT NULL,
  `order_no` varchar(240) DEFAULT NULL COMMENT '工单号',
  `sku` varchar(64) DEFAULT NULL COMMENT '产品SKU',
  `plan_qty` int DEFAULT NULL COMMENT '计划数量',
  `customer_order_no` varchar(240) DEFAULT NULL COMMENT '客户订单号',
  `due_date` datetime DEFAULT NULL COMMENT '交期',
  `accessory_ready_flag` tinyint(1) DEFAULT NULL COMMENT '配件齐套',
  `status` varchar(256) DEFAULT NULL COMMENT '工单状态',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_production_order_tenant_no` (`tenant_id`,`order_no`),
  KEY `idx_production_order_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生产工单';

CREATE TABLE IF NOT EXISTS `production_batch` (
  `id` varchar(64) NOT NULL,
  `batch_code` varchar(240) DEFAULT NULL COMMENT '批次码',
  `prod_order` varchar(64) DEFAULT NULL COMMENT '生产工单',
  `parent_batch` varchar(64) DEFAULT NULL COMMENT '父批次',
  `sku` varchar(64) DEFAULT NULL COMMENT '产品SKU',
  `current_process` varchar(240) DEFAULT NULL COMMENT '当前工序',
  `status` varchar(256) DEFAULT NULL COMMENT '批次状态',
  `lock_flag` tinyint(1) DEFAULT NULL COMMENT '是否锁定',
  `batch_qty` int DEFAULT NULL COMMENT '批次数量',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_production_batch_tenant_code` (`tenant_id`,`batch_code`),
  KEY `idx_production_batch_order` (`prod_order`),
  KEY `idx_production_batch_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='生产批次';

CREATE TABLE IF NOT EXISTS `process_history` (
  `id` varchar(64) NOT NULL,
  `batch` varchar(64) DEFAULT NULL COMMENT '生产批次',
  `seq_no` int DEFAULT NULL COMMENT '工序序号',
  `process_code` varchar(240) DEFAULT NULL COMMENT '工序编码',
  `process_name` varchar(240) DEFAULT NULL COMMENT '工序名称',
  `equipment` varchar(64) DEFAULT NULL COMMENT '设备',
  `mold` varchar(64) DEFAULT NULL COMMENT '模具',
  `operator` varchar(240) DEFAULT NULL COMMENT '操作人',
  `qualified_qty` int DEFAULT NULL COMMENT '合格数',
  `unqualified_qty` int DEFAULT NULL COMMENT '不合格数',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `result` varchar(256) DEFAULT NULL COMMENT '工序结果',
  `remark` varchar(240) DEFAULT NULL COMMENT '备注',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_process_history_batch` (`batch`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序履历';

CREATE TABLE IF NOT EXISTS `vacuum_weld_record` (
  `id` varchar(64) NOT NULL,
  `batch` varchar(64) DEFAULT NULL COMMENT '生产批次',
  `equipment` varchar(64) DEFAULT NULL COMMENT '焊机设备',
  `weld_current` decimal(22,3) DEFAULT NULL COMMENT '焊接电流(A)',
  `weld_time` decimal(22,3) DEFAULT NULL COMMENT '焊接时间(s)',
  `gas_flow` decimal(22,3) DEFAULT NULL COMMENT '保护气体流量(L/min)',
  `operator` varchar(240) DEFAULT NULL COMMENT '操作人',
  `record_time` datetime DEFAULT NULL COMMENT '记录时间',
  `param_status` varchar(256) DEFAULT NULL COMMENT '参数判定',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_vacuum_weld_batch` (`batch`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='真空焊参数记录';

CREATE TABLE IF NOT EXISTS `vacuum_pump_run` (
  `id` varchar(64) NOT NULL,
  `run_no` varchar(240) DEFAULT NULL COMMENT '炉次号',
  `equipment` varchar(64) DEFAULT NULL COMMENT '真空炉设备',
  `vacuum_temp` decimal(22,3) DEFAULT NULL COMMENT '抽真空温度(℃)',
  `vacuum_duration` int DEFAULT NULL COMMENT '抽真空时长(min)',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `operator` varchar(240) DEFAULT NULL COMMENT '操作人',
  `run_status` varchar(256) DEFAULT NULL COMMENT '炉次状态',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vacuum_pump_run_tenant_no` (`tenant_id`,`run_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='抽真空炉次';

CREATE TABLE IF NOT EXISTS `vacuum_pump_run_batch` (
  `id` varchar(64) NOT NULL,
  `run` varchar(64) DEFAULT NULL COMMENT '抽真空炉次',
  `batch` varchar(64) DEFAULT NULL COMMENT '生产批次',
  `vacuum_reading` decimal(22,3) DEFAULT NULL COMMENT '真空度读数',
  `vacuum_unit` varchar(240) DEFAULT NULL COMMENT '真空度单位',
  `test_result` varchar(256) DEFAULT NULL COMMENT '检测结果',
  `lock_flag` tinyint(1) DEFAULT NULL COMMENT '不达标锁定',
  `retest_seq` int DEFAULT NULL COMMENT '复测序号',
  `tested_by` varchar(240) DEFAULT NULL COMMENT '检测人',
  `tested_at` datetime DEFAULT NULL COMMENT '检测时间',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pump_run_batch_run` (`run`),
  KEY `idx_pump_run_batch_batch` (`batch`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='抽真空检测明细';

CREATE TABLE IF NOT EXISTS `temp_drop_test` (
  `id` varchar(64) NOT NULL,
  `batch` varchar(64) DEFAULT NULL COMMENT '生产批次',
  `test_type` varchar(256) DEFAULT NULL COMMENT '测试类型',
  `trigger_type` varchar(256) DEFAULT NULL COMMENT '触发类型',
  `test_seq` int DEFAULT NULL COMMENT '测试序号',
  `start_temp` decimal(22,3) DEFAULT NULL COMMENT '起始温度',
  `end_temp` decimal(22,3) DEFAULT NULL COMMENT '结束温度',
  `curve_data` json DEFAULT NULL COMMENT '温降曲线',
  `result` varchar(256) DEFAULT NULL COMMENT '判定结果',
  `tested_by` varchar(240) DEFAULT NULL COMMENT '测试人',
  `tested_at` datetime DEFAULT NULL COMMENT '测试时间',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_temp_drop_batch` (`batch`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='温降测试';

CREATE TABLE IF NOT EXISTS `first_article_confirm` (
  `id` varchar(64) NOT NULL,
  `batch` varchar(64) DEFAULT NULL COMMENT '生产批次',
  `process_code` varchar(240) DEFAULT NULL COMMENT '工序编码',
  `version_no` varchar(240) DEFAULT NULL COMMENT '版次/色号',
  `photo_url` varchar(500) DEFAULT NULL COMMENT '首件照片',
  `confirmed_by` varchar(240) DEFAULT NULL COMMENT '确认人',
  `confirmed_at` datetime DEFAULT NULL COMMENT '确认时间',
  `result` varchar(256) DEFAULT NULL COMMENT '确认结果',
  `remark` varchar(240) DEFAULT NULL COMMENT '备注',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_first_article_batch` (`batch`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首件确认';

CREATE TABLE IF NOT EXISTS `exception_disposition` (
  `id` varchar(64) NOT NULL,
  `batch` varchar(64) DEFAULT NULL COMMENT '生产批次',
  `process_code` varchar(240) DEFAULT NULL COMMENT '发生工序',
  `exception_type` varchar(256) DEFAULT NULL COMMENT '异常类型',
  `source_record_id` varchar(64) DEFAULT NULL COMMENT '来源记录ID',
  `source_record_type` varchar(256) DEFAULT NULL COMMENT '来源记录类型',
  `lock_flag` tinyint(1) DEFAULT NULL COMMENT '是否锁定',
  `disposition` varchar(256) DEFAULT NULL COMMENT '处置方式',
  `disposition_by` varchar(240) DEFAULT NULL COMMENT '处置人',
  `disposition_at` datetime DEFAULT NULL COMMENT '处置时间',
  `retest_result` varchar(240) DEFAULT NULL COMMENT '复测结果',
  `unlock_flag` tinyint(1) DEFAULT NULL COMMENT '是否解锁',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_exception_batch` (`batch`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常处置';

CREATE TABLE IF NOT EXISTS `material_lot_genealogy` (
  `id` varchar(64) NOT NULL,
  `child_lot_id` varchar(64) DEFAULT NULL COMMENT '子批次ID',
  `child_lot_type` varchar(256) DEFAULT NULL COMMENT '子批次类型',
  `parent_lot_id` varchar(64) DEFAULT NULL COMMENT '父批次ID',
  `parent_lot_type` varchar(256) DEFAULT NULL COMMENT '父批次类型',
  `material_code` varchar(240) DEFAULT NULL COMMENT '物料编码',
  `supplier` varchar(240) DEFAULT NULL COMMENT '供应商',
  `qty` decimal(22,3) DEFAULT NULL COMMENT '投入数量',
  `unit` varchar(240) DEFAULT NULL COMMENT '单位',
  `relation_type` varchar(256) DEFAULT NULL COMMENT '关系类型',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `tenant_id` varchar(64) DEFAULT NULL,
  `create_user` varchar(64) DEFAULT NULL,
  `create_date` datetime DEFAULT NULL,
  `update_user` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_genealogy_child` (`child_lot_id`),
  KEY `idx_genealogy_parent` (`parent_lot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物料批次谱系';
