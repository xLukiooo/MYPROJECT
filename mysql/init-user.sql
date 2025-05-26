-- Initialize database and limited user for FinTrack
CREATE DATABASE IF NOT EXISTS fintrackbd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'fintrack_user'@'%'
  IDENTIFIED BY 'H92gf8Yz!Lq4PxR';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON fintrackbd.*
  TO 'fintrack_user'@'%';

-- Revoke unnecessary privileges
REVOKE INSERT, UPDATE, DELETE
    ON fintrackbd.api_app_category
    FROM 'fintrack_user'@'%';

REVOKE SELECT, INSERT, UPDATE, DELETE
    ON fintrackbd.django_content_type
    FROM 'fintrack_user'@'%';

REVOKE SELECT, INSERT, UPDATE, DELETE
    ON fintrackbd.django_migrations
    FROM 'fintrack_user'@'%';

REVOKE SELECT, INSERT, UPDATE, DELETE
    ON fintrackbd.django_admin_log
    FROM 'fintrack_user'@'%';

REVOKE INSERT, UPDATE, DELETE
    ON fintrackbd.auth_user_groups
    FROM 'fintrack_user'@'%';

REVOKE INSERT, UPDATE, DELETE
    ON fintrackbd.auth_permission
    FROM 'fintrack_user'@'%';

REVOKE INSERT, UPDATE, DELETE
    ON fintrackbd.auth_group_permissions
    FROM 'fintrack_user'@'%';

REVOKE SELECT, UPDATE, DELETE
    ON fintrackbd.auth_user
    FROM 'fintrack_user'@'%';

FLUSH PRIVILEGES;
