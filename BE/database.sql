-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: project_mma
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `caregivers`
--

DROP TABLE IF EXISTS `caregivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `caregivers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patient_user_id` varchar(50) NOT NULL,
  `caregiver_user_id` varchar(50) NOT NULL,
  `permission` enum('view','edit') DEFAULT 'view',
  `relation` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `patient_user_id` (`patient_user_id`),
  KEY `caregiver_user_id` (`caregiver_user_id`),
  CONSTRAINT `caregivers_ibfk_1` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `caregivers_ibfk_2` FOREIGN KEY (`caregiver_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caregivers`
--

LOCK TABLES `caregivers` WRITE;
/*!40000 ALTER TABLE `caregivers` DISABLE KEYS */;
INSERT INTO `caregivers` VALUES (1,'uid_papa','uid_son','edit',NULL,'2026-02-08 06:40:54'),(2,'uid_mama','uid_son','view',NULL,'2026-02-08 06:40:54');
/*!40000 ALTER TABLE `caregivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drug_interactions`
--

DROP TABLE IF EXISTS `drug_interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `drug_interactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `medicine_name_1` varchar(255) NOT NULL,
  `medicine_name_2` varchar(255) NOT NULL,
  `severity` enum('low','medium','high') NOT NULL,
  `description` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drug_interactions`
--

LOCK TABLES `drug_interactions` WRITE;
/*!40000 ALTER TABLE `drug_interactions` DISABLE KEYS */;
INSERT INTO `drug_interactions` VALUES (1,'Warfarin','Aspirin','high','Tăng nguy cơ xuất huyết nghiêm trọng.'),(2,'Atorvastatin','Amlodipine','medium','Có thể làm tăng nồng độ Atorvastatin, gây đau cơ.'),(3,'Metformin','Cimetidine','low','Cimetidine có thể làm tăng nhẹ nồng độ Metformin trong máu.'),(4,'Calcium D3','Levothyroxine','high','Canxi làm giảm hấp thu thuốc tuyến giáp. Nên uống cách nhau ít nhất 4 giờ.');
/*!40000 ALTER TABLE `drug_interactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `healthrecords`
--

DROP TABLE IF EXISTS `healthrecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `healthrecords` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `member_id` int DEFAULT NULL,
  `category` varchar(30) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `diagnosed_date` date DEFAULT NULL,
  `hospital` varchar(255) DEFAULT NULL,
  `severity` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_health_user` (`user_id`),
  KEY `idx_health_member` (`member_id`),
  KEY `idx_health_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `healthrecords`
--

LOCK TABLES `healthrecords` WRITE;
/*!40000 ALTER TABLE `healthrecords` DISABLE KEYS */;
/*!40000 ALTER TABLE `healthrecords` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medication_logs`
--

DROP TABLE IF EXISTS `medication_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medication_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `medicine_id` int NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `scheduled_time` datetime NOT NULL,
  `taken_time` datetime DEFAULT NULL,
  `status` enum('taken_on_time','late','skipped') NOT NULL,
  `note` text,
  `side_effect` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `medicine_id` (`medicine_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `medication_logs_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`),
  CONSTRAINT `medication_logs_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`),
  CONSTRAINT `medication_logs_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medication_logs`
--

LOCK TABLES `medication_logs` WRITE;
/*!40000 ALTER TABLE `medication_logs` DISABLE KEYS */;
INSERT INTO `medication_logs` VALUES (1,9,7,'730425ff-dc79-4e82-97ee-8ad95a4aa0b3','2026-03-16 14:34:00','2026-03-16 14:38:30','taken_on_time',NULL,NULL,'2026-03-16 14:38:30');
/*!40000 ALTER TABLE `medication_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicines`
--

DROP TABLE IF EXISTS `medicines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medicines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `form` varchar(100) DEFAULT NULL,
  `note` text,
  `stock_quantity` int DEFAULT '0',
  `stock_unit` varchar(50) DEFAULT NULL,
  `low_stock_threshold` int DEFAULT '5',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `medicines_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicines`
--

LOCK TABLES `medicines` WRITE;
/*!40000 ALTER TABLE `medicines` DISABLE KEYS */;
INSERT INTO `medicines` VALUES (1,'uid_papa','Metformin','893001','500mg','Viên nén',NULL,10,'Viên',15,'2026-02-08 06:40:54'),(2,'uid_papa','Losartan','893002','50mg','Viên nén',NULL,60,'Viên',10,'2026-02-08 06:40:54'),(3,'uid_papa','Atorvastatin','893003','20mg','Viên nén',NULL,30,'Viên',7,'2026-02-08 06:40:54'),(4,'uid_mama','Calcium D3','893004','600mg','Viên nang',NULL,100,'Viên',20,'2026-02-08 06:40:54'),(5,'uid_mama','Glucosamine','893005','1500mg','Bột gói',NULL,5,'Gói',10,'2026-02-08 06:40:54'),(6,'uid_son','Vitamin C','893006','1000mg','Viên sủi',NULL,20,'Ống',5,'2026-02-08 06:40:54'),(7,'730425ff-dc79-4e82-97ee-8ad95a4aa0b3','Đi ỉa','1234','500','Viên nén',NULL,499,'vien',5,'2026-03-16 14:32:46');
/*!40000 ALTER TABLE `medicines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `schedule_id` int NOT NULL,
  `notify_time` datetime NOT NULL,
  `status` enum('pending','fired','snoozed','cancelled') DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `schedule_id` (`schedule_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificationsettings`
--

DROP TABLE IF EXISTS `notificationsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificationsettings` (
  `user_id` varchar(36) NOT NULL,
  `remind_medicine` tinyint(1) DEFAULT '1',
  `sound` tinyint(1) DEFAULT '1',
  `vibrate` tinyint(1) DEFAULT '1',
  `low_stock_alert` tinyint(1) DEFAULT '1',
  `family_alert` tinyint(1) DEFAULT '1',
  `system_alert` tinyint(1) DEFAULT '1',
  `quiet_hours_enabled` tinyint(1) DEFAULT '0',
  `quiet_start` time DEFAULT '22:00:00',
  `quiet_end` time DEFAULT '06:00:00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificationsettings`
--

LOCK TABLES `notificationsettings` WRITE;
/*!40000 ALTER TABLE `notificationsettings` DISABLE KEYS */;
INSERT INTO `notificationsettings` VALUES ('730425ff-dc79-4e82-97ee-8ad95a4aa0b3',0,0,1,0,0,0,0,'22:00:00','06:00:00','2026-03-16 07:41:14');
/*!40000 ALTER TABLE `notificationsettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pharmacies`
--

DROP TABLE IF EXISTS `pharmacies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pharmacies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pharmacies`
--

LOCK TABLES `pharmacies` WRITE;
/*!40000 ALTER TABLE `pharmacies` DISABLE KEYS */;
/*!40000 ALTER TABLE `pharmacies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription_items`
--

DROP TABLE IF EXISTS `prescription_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescription_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prescription_id` int NOT NULL,
  `medicine_name` varchar(255) NOT NULL,
  `dosage_instruction` varchar(255) DEFAULT NULL,
  `duration_days` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `prescription_id` (`prescription_id`),
  CONSTRAINT `prescription_items_ibfk_1` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_items`
--

LOCK TABLES `prescription_items` WRITE;
/*!40000 ALTER TABLE `prescription_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescription_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `ocr_text` text,
  `doctor_name` varchar(255) DEFAULT NULL,
  `clinic_name` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pushnotificationlogs`
--

DROP TABLE IF EXISTS `pushnotificationlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pushnotificationlogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text,
  `type` enum('schedule_reminder','low_stock','family_alert','system') DEFAULT 'system',
  `reference_id` int DEFAULT NULL COMMENT 'ID của schedule hoặc medicine liên quan',
  `status` enum('sent','failed','filtered') DEFAULT 'sent',
  `error_message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pushnotificationlogs`
--

LOCK TABLES `pushnotificationlogs` WRITE;
/*!40000 ALTER TABLE `pushnotificationlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `pushnotificationlogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pushtokens`
--

DROP TABLE IF EXISTS `pushtokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pushtokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `expo_push_token` varchar(255) NOT NULL,
  `device_id` varchar(255) DEFAULT NULL,
  `platform` varchar(20) DEFAULT NULL COMMENT 'ios, android',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_token` (`expo_push_token`),
  UNIQUE KEY `unique_user_device` (`user_id`,`device_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pushtokens`
--

LOCK TABLES `pushtokens` WRITE;
/*!40000 ALTER TABLE `pushtokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `pushtokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `medicine_id` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `time_of_day` time NOT NULL,
  `rule_type` enum('daily','every_x_days','weekdays') NOT NULL,
  `interval_days` int DEFAULT NULL,
  `weekdays` varchar(20) DEFAULT NULL,
  `dose_amount` float DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `medicine_id` (`medicine_id`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES (5,'uid_papa',1,'2026-01-01',NULL,'07:00:00','daily',NULL,NULL,1,'2026-02-08 06:41:45'),(6,'uid_papa',1,'2026-01-01',NULL,'18:00:00','daily',NULL,NULL,1,'2026-02-08 06:41:45'),(7,'uid_mama',5,'2026-02-01',NULL,'09:00:00','every_x_days',2,NULL,1,'2026-02-08 06:41:45'),(8,'uid_son',6,'2026-02-01',NULL,'08:30:00','weekdays',NULL,'SAT,SUN',1,'2026-02-08 06:41:45'),(9,'730425ff-dc79-4e82-97ee-8ad95a4aa0b3',7,'2026-03-16',NULL,'14:34:00','daily',NULL,NULL,1,'2026-03-16 14:33:04'),(10,'730425ff-dc79-4e82-97ee-8ad95a4aa0b3',7,'2026-03-16',NULL,'14:40:00','daily',NULL,NULL,1,'2026-03-16 14:38:49');
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('Nam','Nữ','Khác') DEFAULT NULL,
  `height_cm` float DEFAULT NULL,
  `weight_kg` float DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('730425ff-dc79-4e82-97ee-8ad95a4aa0b3','nghianv0810@gmail.com','$2b$10$XWgIyjCLtJluBYOix8920e0zWH8q5kNyn91VlVdNhnQOIqu0H2qZK','Nguyễn Văn Nghĩa',NULL,'2004-10-08','Nam',182,73,'2026-03-12 14:54:00'),('uid_mama','mama_lan@gmail.com',NULL,'Lê Thị Lan',NULL,'1965-05-15','Nữ',155,58,'2026-02-08 06:40:54'),('uid_papa','papa_hung@gmail.com',NULL,'Nguyễn Mạnh Hùng',NULL,'1960-01-01','Nam',165,70.5,'2026-02-08 06:40:54'),('uid_son','son_nam@gmail.com',NULL,'Nguyễn Hoài Nam',NULL,'1992-08-20','Nam',175,72,'2026-02-08 06:40:54');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-17 13:44:50
