# 万万烧烤云开发数据模型

## collections

- `tables`：`tableNo`、`scene`、`enabled`、`qrFileID`、`qrTempFileURL`、`createdAt`、`updatedAt`
- `settings`：门店配置。固定文档 `store`，字段包括 `name`、`tablePrefix`、`slogan`、`headerImageUrl`、`headerImageFileId`
- `categories`：`name`、`sort`、`enabled`、`createdAt`、`updatedAt`
- `dishes`：`categoryId`、`name`、`price`、`unit`、`tag`、`imageKey`、`imageFileId`、`specs`、`enabled`、`soldOut`、`sort`
- `orders`：`orderNo`、`tableNo`、`status`、`settlementStatus`、`remark`、`totalAmount`、`itemCount`、`createdAt`、`updatedAt`、`confirmedAt`、`completedAt`
- `order_items`：`orderId`、`orderNo`、`tableNo`、`dishId`、`name`、`spec`、`quantity`、`price`、`subtotal`、`imageKey`
- `staff_users`：`phone`、`password`、`name`、`enabled`、`role`
- `operation_logs`：`type`、`targetId`、`status`、`operatorOpenId`、`createdAt`

## order statuses

- `pending`：新订单，店员工作台优先展示。
- `confirmed`：店员已确认。
- `completed`：已完成/前台已处理。

## settlement

第一版不接微信支付，`settlementStatus` 固定为 `front_desk`。后续接微信支付时再扩展为 `unpaid`、`paid`、`refunded`。
