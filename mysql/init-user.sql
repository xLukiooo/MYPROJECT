-- Initialize database and limited user for FinTrack
CREATE DATABASE IF NOT EXISTS fintrackbd
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'fintrack_user'@'%'
  IDENTIFIED BY 'H92gf8Yz!Lq4PxR';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON fintrackbd.*
  TO 'fintrack_user'@'%';

FLUSH PRIVILEGES;
