MySQL version: 8.0.31

# ! CAUTION !
If there is an error `Client does not support authentication protocol requested by server; consider upgrading MySQL client`, use the following command:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
```

## CREATE THE DB

```sql
CREATE DATABASE IF NOT EXISTS `voidDashboard` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
```

```sql
USE `voidDashboard`;
```

## CREATE THE users TABLE

```sql
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    `user_name` VARCHAR(64) NOT NULL,
    `user_tag` VARCHAR(8) NOT NULL,
    `user_email` VARCHAR(255) NOT NULL UNIQUE,
    `user_password_hash` VARCHAR(255) NOT NULL,
    `user_permissions` TINYINT NOT NULL DEFAULT 0,
    `user_avatar_url` VARCHAR(255) NOT NULL DEFAULT '/assets/images/avatars/default.webp',
    `user_banner_color` VARCHAR(64) NOT NULL DEFAULT "[19,113,147]"
);
```

#### Add admin user
**Email**: *admin@admin.com*, **Password**: *strongadmin*
```sql
INSERT INTO users (user_id, user_name, user_tag, user_email, user_password_hash, user_permissions) VALUES (1071417644626567000, 'admin', '9609', 'admin@admin.com', '$2b$10$9ppENPVfuZSyTmLEbtzTiOVbWM5mDWh9qAnNypNcnMWK76oc2CAHm', 3);
```

## CREATE THE tracking TABLE

```sql
CREATE TABLE IF NOT EXISTS `tracking` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `start_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `end_date` DATETIME DEFAULT NULL,
    `status` TINYINT NOT NULL DEFAULT 0,
    `tags` VARCHAR(255) NOT NULL DEFAULT "[]",
    `score` TINYINT NOT NULL DEFAULT 0,
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY
);
```
