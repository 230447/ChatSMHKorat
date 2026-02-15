-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 10, 2026 at 02:57 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `chatsmhkorat`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_unread_count` (IN `p_user_id` INT)   BEGIN
    SELECT COUNT(*) as unread_count
    FROM messages m
    JOIN room_members rm ON m.room_id = rm.room_id
    WHERE rm.user_id = p_user_id
    AND m.sender_id != p_user_id
    AND m.created_at > COALESCE(
        (SELECT MAX(joined_at) FROM room_members rm2 
         WHERE rm2.room_id = m.room_id AND rm2.user_id = p_user_id),
        '2000-01-01'
    );
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `chat_rooms`
--

CREATE TABLE `chat_rooms` (
  `room_id` int(11) NOT NULL,
  `room_name` varchar(100) DEFAULT NULL,
  `room_type` enum('department','group','private') NOT NULL DEFAULT 'group',
  `department_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_rooms`
--

INSERT INTO `chat_rooms` (`room_id`, `room_name`, `room_type`, `department_id`, `created_by`, `created_at`, `updated_at`) VALUES
(64, 'ทีมงาน IT Support', 'group', NULL, NULL, '2026-02-09 14:16:29', NULL),
(65, 'คณะแพทย์หัวหน้า', 'group', NULL, NULL, '2026-02-09 14:16:29', NULL),
(66, 'ประชาสัมพันธ์ทั่วไป', 'group', NULL, NULL, '2026-02-09 14:16:29', NULL),
(67, 'ห้องแชท - คลินิกทันตกรรม', 'department', 122, NULL, '2026-02-09 15:16:21', NULL),
(68, 'ห้องแชท - คลินิกศัลยกรรม/กระดูกและข้อ', 'department', 148, NULL, '2026-02-09 15:16:21', NULL),
(69, 'ห้องแชท - คลินิกสูตินรเวช-กุมารเวช', 'department', 149, NULL, '2026-02-09 15:16:21', NULL),
(70, 'ห้องแชท - คลินิกอายุรกรรม', 'department', 147, NULL, '2026-02-09 15:16:21', NULL),
(71, 'ห้องแชท - คลินิกเฉพาะทาง(จักษุ หู จมูก คอ)', 'department', 150, NULL, '2026-02-09 15:16:21', NULL),
(72, 'ห้องแชท - งานที่ดิน', 'department', 139, NULL, '2026-02-09 15:16:21', NULL),
(73, 'ห้องแชท - งานนิติกร', 'department', 138, NULL, '2026-02-09 15:16:21', NULL),
(74, 'ห้องแชท - ตรวจการ', 'department', 145, NULL, '2026-02-09 15:16:21', NULL),
(75, 'ห้องแชท - นักปฏิบัติการการแพทย์ฉุกเฉิน', 'department', 141, NULL, '2026-02-09 15:16:21', NULL),
(76, 'ห้องแชท - บริการส่วนหน้า', 'department', 156, NULL, '2026-02-09 15:16:21', NULL),
(77, 'ห้องแชท - ผู้จัดการและรองผู้จัดการ', 'department', 137, NULL, '2026-02-09 15:16:21', NULL),
(78, 'ห้องแชท - ผู้ช่วยแพทย์แผนจีน', 'department', 143, NULL, '2026-02-09 15:16:21', NULL),
(79, 'ห้องแชท - ฝ่ายการพยาบาล', 'department', 146, NULL, '2026-02-09 15:16:21', NULL),
(80, 'ห้องแชท - ฝ่ายการแพทย์', 'department', 140, NULL, '2026-02-09 15:16:21', NULL),
(81, 'ห้องแชท - ศูนย์คุณภาพ', 'department', 121, NULL, '2026-02-09 15:16:21', NULL),
(82, 'ห้องแชท - ศูนย์ตรวจสุขภาพ', 'department', 144, NULL, '2026-02-09 15:16:21', NULL),
(83, 'ห้องแชท - ศูนย์วางแผนและพัฒนา', 'department', 114, NULL, '2026-02-09 15:16:21', NULL),
(84, 'ห้องแชท - เลขานุการฝ่ายการแพทย์', 'department', 142, NULL, '2026-02-09 15:16:21', NULL),
(85, 'ห้องแชท - แผนกกายภาพบำบัด', 'department', 152, NULL, '2026-02-09 15:16:21', NULL),
(86, 'ห้องแชท - แผนกการเงิน', 'department', 117, NULL, '2026-02-09 15:16:21', NULL),
(87, 'ห้องแชท - แผนกคลัง', 'department', 120, NULL, '2026-02-09 15:16:21', NULL),
(88, 'ห้องแชท - แผนกจัดซื้อ', 'department', 119, NULL, '2026-02-09 15:16:21', NULL),
(89, 'ห้องแชท - แผนกจ่ายกลาง', 'department', 153, NULL, '2026-02-09 15:16:21', NULL),
(90, 'ห้องแชท - แผนกซ่อมบำรุงและก่อสร้าง', 'department', 158, NULL, '2026-02-09 15:16:21', NULL),
(91, 'ห้องแชท - แผนกทรัพยากรบุคคล งานธุรการ และกองเลขานุการ', 'department', 157, NULL, '2026-02-09 15:16:21', NULL),
(92, 'ห้องแชท - แผนกบริการเปล', 'department', 125, NULL, '2026-02-09 15:16:21', NULL),
(93, 'ห้องแชท - แผนกบัญชี-งานวิเคราะห์', 'department', 118, NULL, '2026-02-09 15:16:21', NULL),
(94, 'ห้องแชท - แผนกประชาสัมพันธ์ตลาด', 'department', 108, NULL, '2026-02-09 15:16:21', NULL),
(95, 'ห้องแชท - แผนกผ่าตัด', 'department', 124, NULL, '2026-02-09 15:16:21', NULL),
(96, 'ห้องแชท - แผนกผู้ป่วยวิกฤต', 'department', 134, NULL, '2026-02-09 15:16:21', NULL),
(97, 'ห้องแชท - แผนกผู้ป่วยในชั้น 4 มารีย์', 'department', 126, NULL, '2026-02-09 15:16:21', NULL),
(98, 'ห้องแชท - แผนกผู้ป่วยในชั้น 4 วังกาแวร์', 'department', 127, NULL, '2026-02-09 15:16:21', NULL),
(99, 'ห้องแชท - แผนกผู้ป่วยในชั้น 5 มารีย์', 'department', 128, NULL, '2026-02-09 15:16:21', NULL),
(100, 'ห้องแชท - แผนกผู้ป่วยในชั้น 5 วังกาแวร์', 'department', 129, NULL, '2026-02-09 15:16:21', NULL),
(101, 'ห้องแชท - แผนกผู้ป่วยในชั้น 6 มารีย์', 'department', 130, NULL, '2026-02-09 15:16:21', NULL),
(102, 'ห้องแชท - แผนกผู้ป่วยในชั้น 6 วังกาแวร์', 'department', 131, NULL, '2026-02-09 15:16:21', NULL),
(103, 'ห้องแชท - แผนกผู้ป่วยในชั้น 7 วังกาแวร์', 'department', 132, NULL, '2026-02-09 15:16:21', NULL),
(104, 'ห้องแชท - แผนกผู้ป่วยในชั้น 8 วังกาแวร์', 'department', 133, NULL, '2026-02-09 15:16:21', NULL),
(105, 'ห้องแชท - แผนกยานพาหนะ', 'department', 159, NULL, '2026-02-09 15:16:21', NULL),
(106, 'ห้องแชท - แผนกรักษาความปลอดภัย', 'department', 116, NULL, '2026-02-09 15:16:21', NULL),
(107, 'ห้องแชท - แผนกรังสีวิทยา', 'department', 136, NULL, '2026-02-09 15:16:21', NULL),
(108, 'ห้องแชท - แผนกลูกค้าสัมพันธ์และลงทะเบียน', 'department', 111, NULL, '2026-02-09 15:16:21', NULL),
(109, 'ห้องแชท - แผนกวิศวกรรมการแพทย์', 'department', 154, NULL, '2026-02-09 15:16:21', NULL),
(110, 'ห้องแชท - แผนกสิทธิประโยชน์', 'department', 109, NULL, '2026-02-09 15:16:21', NULL),
(111, 'ห้องแชท - แผนกห้องปฏิบัติการ', 'department', 151, NULL, '2026-02-09 15:16:21', NULL),
(112, 'ห้องแชท - แผนกอภิบาล', 'department', 113, NULL, '2026-02-09 15:16:21', NULL),
(113, 'ห้องแชท - แผนกอุบัติเหตุฉุกเฉินและศูนย์รถพยาบาล', 'department', 123, NULL, '2026-02-09 15:16:21', NULL),
(114, 'ห้องแชท - แผนกเกษตรกรรม', 'department', 107, NULL, '2026-02-09 15:16:21', NULL),
(115, 'ห้องแชท - แผนกเคหะบริการ', 'department', 155, NULL, '2026-02-09 15:16:21', NULL),
(116, 'ห้องแชท - แผนกเทคโนโลยีสารสนเทศ', 'department', 112, NULL, '2026-02-09 15:16:21', NULL),
(117, 'ห้องแชท - แผนกเภสัชกรรม', 'department', 135, NULL, '2026-02-09 15:16:21', NULL),
(118, 'ห้องแชท - แผนกเวชระเบียน', 'department', 110, NULL, '2026-02-09 15:16:21', NULL),
(119, 'ห้องแชท - แผนกโทรศัพท์', 'department', 115, NULL, '2026-02-09 15:16:21', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `chat_summaries`
--

CREATE TABLE `chat_summaries` (
  `summary_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `summary_type` enum('daily','weekly','monthly') NOT NULL DEFAULT 'daily',
  `summary_text` text NOT NULL,
  `summary_date` date NOT NULL,
  `created_by_ai` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `department_id` int(11) NOT NULL,
  `department_name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department`
--

INSERT INTO `department` (`department_id`, `department_name`, `created_at`) VALUES
(107, 'แผนกเกษตรกรรม', '2026-02-09 14:58:19'),
(108, 'แผนกประชาสัมพันธ์ตลาด', '2026-02-09 14:58:19'),
(109, 'แผนกสิทธิประโยชน์', '2026-02-09 14:58:19'),
(110, 'แผนกเวชระเบียน', '2026-02-09 14:58:19'),
(111, 'แผนกลูกค้าสัมพันธ์และลงทะเบียน', '2026-02-09 14:58:19'),
(112, 'แผนกเทคโนโลยีสารสนเทศ', '2026-02-09 14:58:19'),
(113, 'แผนกอภิบาล', '2026-02-09 14:58:19'),
(114, 'ศูนย์วางแผนและพัฒนา', '2026-02-09 14:58:19'),
(115, 'แผนกโทรศัพท์', '2026-02-09 14:58:19'),
(116, 'แผนกรักษาความปลอดภัย', '2026-02-09 14:58:19'),
(117, 'แผนกการเงิน', '2026-02-09 14:58:19'),
(118, 'แผนกบัญชี-งานวิเคราะห์', '2026-02-09 14:58:19'),
(119, 'แผนกจัดซื้อ', '2026-02-09 14:58:19'),
(120, 'แผนกคลัง', '2026-02-09 14:58:19'),
(121, 'ศูนย์คุณภาพ', '2026-02-09 14:58:19'),
(122, 'คลินิกทันตกรรม', '2026-02-09 14:58:19'),
(123, 'แผนกอุบัติเหตุฉุกเฉินและศูนย์รถพยาบาล', '2026-02-09 14:58:19'),
(124, 'แผนกผ่าตัด', '2026-02-09 14:58:19'),
(125, 'แผนกบริการเปล', '2026-02-09 14:58:19'),
(126, 'แผนกผู้ป่วยในชั้น 4 มารีย์', '2026-02-09 14:58:19'),
(127, 'แผนกผู้ป่วยในชั้น 4 วังกาแวร์', '2026-02-09 14:58:19'),
(128, 'แผนกผู้ป่วยในชั้น 5 มารีย์', '2026-02-09 14:58:19'),
(129, 'แผนกผู้ป่วยในชั้น 5 วังกาแวร์', '2026-02-09 14:58:19'),
(130, 'แผนกผู้ป่วยในชั้น 6 มารีย์', '2026-02-09 14:58:19'),
(131, 'แผนกผู้ป่วยในชั้น 6 วังกาแวร์', '2026-02-09 14:58:19'),
(132, 'แผนกผู้ป่วยในชั้น 7 วังกาแวร์', '2026-02-09 14:58:19'),
(133, 'แผนกผู้ป่วยในชั้น 8 วังกาแวร์', '2026-02-09 14:58:19'),
(134, 'แผนกผู้ป่วยวิกฤต', '2026-02-09 14:58:19'),
(135, 'แผนกเภสัชกรรม', '2026-02-09 14:58:19'),
(136, 'แผนกรังสีวิทยา', '2026-02-09 14:58:19'),
(137, 'ผู้จัดการและรองผู้จัดการ', '2026-02-09 14:58:19'),
(138, 'งานนิติกร', '2026-02-09 14:58:19'),
(139, 'งานที่ดิน', '2026-02-09 14:58:19'),
(140, 'ฝ่ายการแพทย์', '2026-02-09 14:58:19'),
(141, 'นักปฏิบัติการการแพทย์ฉุกเฉิน', '2026-02-09 14:58:19'),
(142, 'เลขานุการฝ่ายการแพทย์', '2026-02-09 14:58:19'),
(143, 'ผู้ช่วยแพทย์แผนจีน', '2026-02-09 14:58:19'),
(144, 'ศูนย์ตรวจสุขภาพ', '2026-02-09 14:58:19'),
(145, 'ตรวจการ', '2026-02-09 14:58:19'),
(146, 'ฝ่ายการพยาบาล', '2026-02-09 14:58:19'),
(147, 'คลินิกอายุรกรรม', '2026-02-09 14:58:19'),
(148, 'คลินิกศัลยกรรม/กระดูกและข้อ', '2026-02-09 14:58:19'),
(149, 'คลินิกสูตินรเวช-กุมารเวช', '2026-02-09 14:58:19'),
(150, 'คลินิกเฉพาะทาง(จักษุ หู จมูก คอ)', '2026-02-09 14:58:19'),
(151, 'แผนกห้องปฏิบัติการ', '2026-02-09 14:58:19'),
(152, 'แผนกกายภาพบำบัด', '2026-02-09 14:58:19'),
(153, 'แผนกจ่ายกลาง', '2026-02-09 14:58:19'),
(154, 'แผนกวิศวกรรมการแพทย์', '2026-02-09 14:58:19'),
(155, 'แผนกเคหะบริการ', '2026-02-09 14:58:19'),
(156, 'บริการส่วนหน้า', '2026-02-09 14:58:19'),
(157, 'แผนกทรัพยากรบุคคล งานธุรการ และกองเลขานุการ', '2026-02-09 14:58:19'),
(158, 'แผนกซ่อมบำรุงและก่อสร้าง', '2026-02-09 14:58:19'),
(159, 'แผนกยานพาหนะ', '2026-02-09 14:58:19');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `message_text` text DEFAULT NULL,
  `message_type` enum('text','image','file','voice') DEFAULT 'text',
  `file_url` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`message_id`, `room_id`, `sender_id`, `message_text`, `message_type`, `file_url`, `file_name`, `file_size`, `is_read`, `created_at`) VALUES
(1, 67, 10, 'สวัสดี', 'text', NULL, NULL, NULL, 0, '2026-02-09 16:29:25'),
(2, 67, 10, 'สวัสดี', 'text', NULL, NULL, NULL, 0, '2026-02-09 16:29:33'),
(3, 67, 10, 'สวัสดี', 'text', NULL, NULL, NULL, 0, '2026-02-09 16:38:50'),
(4, 67, 10, 'สวัสดี', 'text', NULL, NULL, NULL, 0, '2026-02-09 16:39:44'),
(5, 67, 10, 'สวัสดี', 'text', NULL, NULL, NULL, 0, '2026-02-09 16:52:58'),
(6, 67, 10, 'สวัสดี', 'text', NULL, NULL, NULL, 0, '2026-02-10 01:10:19');

-- --------------------------------------------------------

--
-- Table structure for table `message_reads`
--

CREATE TABLE `message_reads` (
  `read_id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_members`
--

CREATE TABLE `room_members` (
  `room_member_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `room_members`
--

INSERT INTO `room_members` (`room_member_id`, `room_id`, `user_id`, `joined_at`) VALUES
(31, 67, 10, '2026-02-09 15:17:22');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `employee_id` varchar(20) NOT NULL COMMENT 'รหัสพนักงาน',
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT '/assets/images/default-avatar.png',
  `is_online` tinyint(1) DEFAULT 0,
  `last_seen` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `employee_id`, `username`, `password`, `full_name`, `email`, `department_id`, `profile_image`, `is_online`, `last_seen`, `created_at`, `updated_at`) VALUES
(10, 'IDI1770', 'suchada', '$2b$10$8MQ24tpUsWk/36YXmbmMwe6S/yXQos7MMTVG8iNc2XqO8wJWOIFUC', 'สุชาดา ชาครีย์ธนัช', 'schakeetanat@gmail.com', 122, '/uploads/1770652643248-300459642.jpg', 1, '2026-02-10 01:54:02', '2026-02-09 15:17:22', '2026-02-10 01:54:02');

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_messages_with_users`
-- (See below for the actual view)
--
CREATE TABLE `v_messages_with_users` (
`message_id` int(11)
,`room_id` int(11)
,`sender_id` int(11)
,`message_text` text
,`message_type` enum('text','image','file','voice')
,`file_url` varchar(500)
,`file_name` varchar(255)
,`file_size` int(11)
,`is_read` tinyint(1)
,`created_at` timestamp
,`username` varchar(50)
,`full_name` varchar(100)
,`profile_image` varchar(255)
,`department_name` varchar(100)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_room_members_detail`
-- (See below for the actual view)
--
CREATE TABLE `v_room_members_detail` (
`room_member_id` int(11)
,`room_id` int(11)
,`user_id` int(11)
,`joined_at` timestamp
,`username` varchar(50)
,`full_name` varchar(100)
,`profile_image` varchar(255)
,`is_online` tinyint(1)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_user_departments`
-- (See below for the actual view)
--
CREATE TABLE `v_user_departments` (
`user_id` int(11)
,`employee_id` varchar(20)
,`username` varchar(50)
,`password` varchar(255)
,`full_name` varchar(100)
,`email` varchar(100)
,`department_id` int(11)
,`profile_image` varchar(255)
,`is_online` tinyint(1)
,`last_seen` timestamp
,`created_at` timestamp
,`updated_at` timestamp
,`department_name` varchar(100)
);

-- --------------------------------------------------------

--
-- Structure for view `v_messages_with_users`
--
DROP TABLE IF EXISTS `v_messages_with_users`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_messages_with_users`  AS SELECT `m`.`message_id` AS `message_id`, `m`.`room_id` AS `room_id`, `m`.`sender_id` AS `sender_id`, `m`.`message_text` AS `message_text`, `m`.`message_type` AS `message_type`, `m`.`file_url` AS `file_url`, `m`.`file_name` AS `file_name`, `m`.`file_size` AS `file_size`, `m`.`is_read` AS `is_read`, `m`.`created_at` AS `created_at`, `u`.`username` AS `username`, `u`.`full_name` AS `full_name`, `u`.`profile_image` AS `profile_image`, `d`.`department_name` AS `department_name` FROM ((`messages` `m` join `users` `u` on(`m`.`sender_id` = `u`.`user_id`)) left join `department` `d` on(`u`.`department_id` = `d`.`department_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_room_members_detail`
--
DROP TABLE IF EXISTS `v_room_members_detail`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_room_members_detail`  AS SELECT `rm`.`room_member_id` AS `room_member_id`, `rm`.`room_id` AS `room_id`, `rm`.`user_id` AS `user_id`, `rm`.`joined_at` AS `joined_at`, `u`.`username` AS `username`, `u`.`full_name` AS `full_name`, `u`.`profile_image` AS `profile_image`, `u`.`is_online` AS `is_online` FROM (`room_members` `rm` join `users` `u` on(`rm`.`user_id` = `u`.`user_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `v_user_departments`
--
DROP TABLE IF EXISTS `v_user_departments`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_user_departments`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`employee_id` AS `employee_id`, `u`.`username` AS `username`, `u`.`password` AS `password`, `u`.`full_name` AS `full_name`, `u`.`email` AS `email`, `u`.`department_id` AS `department_id`, `u`.`profile_image` AS `profile_image`, `u`.`is_online` AS `is_online`, `u`.`last_seen` AS `last_seen`, `u`.`created_at` AS `created_at`, `u`.`updated_at` AS `updated_at`, `d`.`department_name` AS `department_name` FROM (`users` `u` left join `department` `d` on(`u`.`department_id` = `d`.`department_id`)) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_room_type` (`room_type`),
  ADD KEY `idx_department_room` (`department_id`);

--
-- Indexes for table `chat_summaries`
--
ALTER TABLE `chat_summaries`
  ADD PRIMARY KEY (`summary_id`),
  ADD KEY `idx_room_date_type` (`room_id`,`summary_date`,`summary_type`);

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`department_id`),
  ADD KEY `idx_department_name` (`department_name`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `idx_room_created` (`room_id`,`created_at`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_room_unread` (`room_id`,`is_read`),
  ADD KEY `idx_messages_room` (`room_id`),
  ADD KEY `idx_messages_sender` (`sender_id`),
  ADD KEY `idx_messages_created` (`created_at`);

--
-- Indexes for table `message_reads`
--
ALTER TABLE `message_reads`
  ADD PRIMARY KEY (`read_id`),
  ADD UNIQUE KEY `unique_message_user` (`message_id`,`user_id`),
  ADD KEY `idx_user_reads` (`user_id`),
  ADD KEY `idx_message_reads` (`message_id`);

--
-- Indexes for table `room_members`
--
ALTER TABLE `room_members`
  ADD PRIMARY KEY (`room_member_id`),
  ADD UNIQUE KEY `unique_room_user` (`room_id`,`user_id`),
  ADD KEY `idx_room_member` (`room_id`,`user_id`),
  ADD KEY `idx_user_rooms` (`user_id`),
  ADD KEY `idx_room_members_user` (`user_id`),
  ADD KEY `idx_room_members_room` (`room_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_employee_id` (`employee_id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_department` (`department_id`),
  ADD KEY `idx_online` (`is_online`),
  ADD KEY `idx_users_online` (`is_online`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

--
-- AUTO_INCREMENT for table `chat_summaries`
--
ALTER TABLE `chat_summaries`
  MODIFY `summary_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `department_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=160;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `message_reads`
--
ALTER TABLE `message_reads`
  MODIFY `read_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room_members`
--
ALTER TABLE `room_members`
  MODIFY `room_member_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat_rooms`
--
ALTER TABLE `chat_rooms`
  ADD CONSTRAINT `chat_rooms_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_rooms_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `chat_summaries`
--
ALTER TABLE `chat_summaries`
  ADD CONSTRAINT `chat_summaries_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `message_reads`
--
ALTER TABLE `message_reads`
  ADD CONSTRAINT `message_reads_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`message_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `room_members`
--
ALTER TABLE `room_members`
  ADD CONSTRAINT `room_members_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`room_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `room_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `department` (`department_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
