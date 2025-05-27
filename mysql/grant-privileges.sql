-- Grant privileges for fintrack_user
GRANT SELECT ON `fintrackbd`.`api_app_category` TO `fintrack_user`@`%`;
GRANT SELECT, INSERT, UPDATE, DELETE ON `fintrackbd`.`api_app_expense` TO `fintrack_user`@`%`;
GRANT SELECT ON `fintrackbd`.`auth_group` TO `fintrack_user`@`%`;
GRANT SELECT, DELETE ON `fintrackbd`.`auth_user_groups` TO `fintrack_user`@`%`;
GRANT SELECT, DELETE ON `fintrackbd`.`auth_user_user_permissions` TO `fintrack_user`@`%`;
GRANT SELECT, INSERT, UPDATE, DELETE ON `fintrackbd`.`auth_user` TO `fintrack_user`@`%`;
GRANT SELECT, DELETE ON `fintrackbd`.`django_admin_log` TO `fintrack_user`@`%`;
GRANT SELECT, INSERT, DELETE ON `fintrackbd`.`django_rest_passwordreset_resetpasswordtoken` TO `fintrack_user`@`%`;

FLUSH PRIVILEGES;
