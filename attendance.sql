-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 15, 2025 at 12:26 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendance`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance_days`
--

CREATE TABLE `attendance_days` (
  `id` int(11) NOT NULL,
  `att_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_days`
--

INSERT INTO `attendance_days` (`id`, `att_date`, `created_at`) VALUES
(26, '2025-09-11', '2025-09-12 06:40:17'),
(27, '2025-09-10', '2025-09-12 07:08:33'),
(28, '2025-09-09', '2025-09-12 07:08:46'),
(29, '2025-09-12', '2025-09-12 07:49:51'),
(30, '2025-09-06', '2025-09-12 10:08:30'),
(31, '2025-09-13', '2025-09-13 03:52:32'),
(32, '2025-09-05', '2025-09-13 04:46:15'),
(34, '2025-09-15', '2025-09-15 04:58:28');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_history`
--

CREATE TABLE `attendance_history` (
  `id` int(11) NOT NULL,
  `record_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` enum('create','update','delete') NOT NULL,
  `changed_field` varchar(100) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_history`
--

INSERT INTO `attendance_history` (`id`, `record_id`, `user_id`, `action`, `changed_field`, `old_value`, `new_value`, `created_at`) VALUES
(562, 1847, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 06:40:17'),
(563, 1848, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 07:08:33'),
(564, 1849, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 07:08:46'),
(584, 1856, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(585, 1857, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(586, 1858, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(587, 1847, NULL, 'update', 'ot_start', NULL, '12:00:00', '2025-09-12 07:43:44'),
(588, 1859, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(589, 1860, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(590, 1861, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(591, 1862, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(592, 1863, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(593, 1864, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:44'),
(594, 1865, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(595, 1866, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(596, 1867, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(597, 1848, NULL, 'update', 'ot_end', NULL, '12:00:00', '2025-09-12 07:43:57'),
(598, 1868, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(599, 1869, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(600, 1870, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(601, 1871, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(602, 1872, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(603, 1873, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:43:57'),
(604, 1848, NULL, 'update', 'ot_start', NULL, '12:00:00', '2025-09-12 07:44:07'),
(605, 1874, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 07:49:51'),
(606, 1875, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=12:00:00', '2025-09-12 07:49:56'),
(607, 1876, NULL, 'create', NULL, NULL, 'present=0;ot_start=12:00:00;ot_end=', '2025-09-12 07:50:01'),
(608, 1877, NULL, 'create', NULL, NULL, 'present=0;ot_start=12:00:00;ot_end=', '2025-09-12 07:50:08'),
(609, 1876, NULL, 'update', 'ot_start', '12:00:00', NULL, '2025-09-12 07:50:16'),
(610, 1876, NULL, 'update', 'ot_end', NULL, '12:00:00', '2025-09-12 07:50:16'),
(611, 1878, NULL, 'create', NULL, NULL, 'present=0;ot_start=12:00:00;ot_end=', '2025-09-12 07:50:24'),
(612, 1875, NULL, 'update', 'ot_start', NULL, '12:00:00', '2025-09-12 07:51:22'),
(613, 1876, NULL, 'update', 'ot_start', NULL, '12:00:00', '2025-09-12 07:51:22'),
(614, 1875, NULL, 'update', 'present', '0', '1', '2025-09-12 07:52:01'),
(615, 1875, NULL, 'update', 'ot_start', '12:00:00', NULL, '2025-09-12 07:52:01'),
(616, 1875, NULL, 'update', 'ot_end', '12:00:00', NULL, '2025-09-12 07:52:01'),
(617, 1878, NULL, 'update', 'ot_start', '12:00:00', NULL, '2025-09-12 07:54:03'),
(618, 1876, NULL, 'update', 'ot_start', '12:00:00', NULL, '2025-09-12 07:54:03'),
(619, 1876, NULL, 'update', 'ot_end', '12:00:00', NULL, '2025-09-12 07:54:03'),
(620, 1877, NULL, 'update', 'ot_start', '12:00:00', NULL, '2025-09-12 07:54:03'),
(621, 1875, NULL, 'update', 'present', '1', '0', '2025-09-12 07:54:34'),
(622, 1875, NULL, 'update', 'ot_start', NULL, '12:00:00', '2025-09-12 07:54:34'),
(623, 1875, NULL, 'update', 'ot_end', NULL, '12:00:00', '2025-09-12 07:54:34'),
(624, 1878, NULL, 'update', 'present', '0', '1', '2025-09-12 08:01:43'),
(625, 1876, NULL, 'update', 'present', '0', '1', '2025-09-12 08:01:43'),
(626, 1877, NULL, 'update', 'present', '0', '1', '2025-09-12 08:01:43'),
(627, 1876, NULL, 'update', 'ot_start', NULL, '12:00:00', '2025-09-12 08:01:58'),
(628, 1876, NULL, 'update', 'ot_end', NULL, '12:00:00', '2025-09-12 08:01:58'),
(629, 1876, NULL, 'update', 'ot_result', NULL, '1', '2025-09-12 08:01:58'),
(630, 1878, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-12 08:02:56'),
(631, 1878, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-12 08:02:56'),
(632, 1878, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-12 08:02:56'),
(633, 1878, NULL, 'update', 'ot_result', NULL, '1', '2025-09-12 08:02:56'),
(634, 1879, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-12 08:02:56'),
(635, 1876, NULL, 'update', 'ot_start', '12:00:00', '18:00:00', '2025-09-12 08:02:56'),
(636, 1876, NULL, 'update', 'ot_end', '12:00:00', '20:15:00', '2025-09-12 08:02:56'),
(637, 1876, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-12 08:02:56'),
(638, 1877, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-12 08:02:56'),
(639, 1877, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-12 08:02:56'),
(640, 1877, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-12 08:02:56'),
(641, 1877, NULL, 'update', 'ot_result', NULL, '1', '2025-09-12 08:02:56'),
(642, 1880, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-12 08:02:56'),
(643, 1875, NULL, 'update', 'notes', NULL, 'sdd', '2025-09-12 08:11:20'),
(644, 1875, NULL, 'update', 'notes', 'sdd', 'ลาป่วย', '2025-09-12 08:11:32'),
(645, 1878, NULL, 'update', 'ot_start', '18:00:00', '12:00:00', '2025-09-12 09:17:21'),
(646, 1878, NULL, 'update', 'ot_end', '20:15:00', '13:00:00', '2025-09-12 09:17:21'),
(647, 1876, NULL, 'update', 'ot_start', '18:00:00', '12:00:00', '2025-09-12 09:17:21'),
(648, 1876, NULL, 'update', 'ot_end', '20:15:00', '13:00:00', '2025-09-12 09:17:21'),
(649, 1877, NULL, 'update', 'ot_start', '18:00:00', '12:00:00', '2025-09-12 09:17:21'),
(650, 1877, NULL, 'update', 'ot_end', '20:15:00', '20:00:00', '2025-09-12 09:17:21'),
(651, 1876, NULL, 'update', 'ot_result', '1', '0', '2025-09-12 10:03:27'),
(652, 1881, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 10:08:30'),
(653, 1882, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 10:08:30'),
(654, 1883, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 10:08:30'),
(655, 1884, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 10:08:30'),
(656, 1885, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 10:08:30'),
(657, 1886, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 10:08:30'),
(658, 1887, NULL, 'create', NULL, NULL, 'present=1;ot_start=;ot_end=', '2025-09-12 10:08:30'),
(659, 1881, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-12 10:10:50'),
(660, 1881, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-12 10:10:50'),
(661, 1881, NULL, 'update', 'ot_result', NULL, '1', '2025-09-12 10:10:50'),
(662, 1881, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-12 10:12:27'),
(663, 1886, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-12 10:12:27'),
(664, 1886, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-12 10:12:27'),
(665, 1886, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-12 10:12:27'),
(666, 1886, NULL, 'update', 'ot_result', NULL, '1', '2025-09-12 10:12:27'),
(667, 1887, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-12 10:12:27'),
(668, 1887, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-12 10:12:27'),
(669, 1887, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-12 10:12:27'),
(670, 1887, NULL, 'update', 'ot_result', NULL, '1', '2025-09-12 10:12:27'),
(671, 1882, NULL, 'update', 'notes', NULL, 'ลาช่วงเช้า', '2025-09-12 10:14:22'),
(672, 1885, NULL, 'update', 'notes', 'ลาช่วงเช้า', NULL, '2025-09-12 10:14:22'),
(673, 1888, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-12 11:13:03'),
(674, 1878, NULL, 'update', 'ot_start', '12:00:00', '18:00:00', '2025-09-12 11:13:03'),
(675, 1878, NULL, 'update', 'ot_end', '13:00:00', '20:15:00', '2025-09-12 11:13:03'),
(676, 1889, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-12 11:13:03'),
(677, 1874, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-12 11:13:03'),
(678, 1874, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-12 11:13:03'),
(679, 1874, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-12 11:13:03'),
(680, 1874, NULL, 'update', 'ot_result', NULL, '1', '2025-09-12 11:13:03'),
(681, 1890, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-12 11:13:03'),
(682, 1876, NULL, 'update', 'ot_start', '12:00:00', '18:00:00', '2025-09-12 11:13:04'),
(683, 1876, NULL, 'update', 'ot_end', '13:00:00', '20:15:00', '2025-09-12 11:13:04'),
(684, 1876, NULL, 'update', 'ot_result', '0', '1', '2025-09-12 11:13:04'),
(685, 1877, NULL, 'update', 'ot_start', '12:00:00', '18:00:00', '2025-09-12 11:13:04'),
(686, 1877, NULL, 'update', 'ot_end', '20:00:00', '20:15:00', '2025-09-12 11:13:04'),
(687, 1891, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-12 11:13:04'),
(688, 1892, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 11:13:53'),
(689, 1893, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 11:13:53'),
(690, 1894, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 11:13:53'),
(691, 1895, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-12 11:13:53'),
(692, 1896, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 03:52:32'),
(693, 1897, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 03:59:34'),
(694, 1875, NULL, 'update', 'ot_end', '12:00:00', NULL, '2025-09-13 04:00:37'),
(695, 1876, NULL, 'update', 'ot_end', '20:15:00', '12:00:00', '2025-09-13 04:00:37'),
(696, 1875, NULL, 'update', 'ot_end', NULL, '12:00:00', '2025-09-13 04:00:41'),
(697, 1898, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 04:28:31'),
(698, 1897, NULL, 'update', 'present', '0', '1', '2025-09-13 04:31:53'),
(699, 1897, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 04:31:53'),
(700, 1897, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 04:31:53'),
(701, 1897, NULL, 'update', 'ot_result', NULL, '1', '2025-09-13 04:31:53'),
(702, 1899, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 04:31:53'),
(703, 1900, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 04:31:53'),
(704, 1898, NULL, 'update', 'present', '0', '1', '2025-09-13 04:31:53'),
(705, 1896, NULL, 'update', 'present', '0', '1', '2025-09-13 04:31:53'),
(706, 1901, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 04:31:53'),
(707, 1902, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 04:31:53'),
(708, 1903, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 04:31:53'),
(709, 1904, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 04:31:53'),
(710, 1904, NULL, 'update', 'present', '1', '0', '2025-09-13 04:33:02'),
(711, 1904, NULL, 'update', 'notes', NULL, 'ลาป่วย', '2025-09-13 04:33:02'),
(712, 1904, NULL, 'update', 'ot_start', '18:00:00', NULL, '2025-09-13 04:33:28'),
(713, 1904, NULL, 'update', 'ot_end', '20:15:00', NULL, '2025-09-13 04:34:03'),
(714, 1904, NULL, 'update', 'ot_result', '1', NULL, '2025-09-13 04:34:03'),
(715, 1897, NULL, 'update', 'ot_end', '20:15:00', '12:00:00', '2025-09-13 04:43:40'),
(716, 1896, NULL, 'update', 'present', '1', '0', '2025-09-13 04:43:46'),
(717, 1905, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 04:46:15'),
(718, 1906, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 04:47:03'),
(719, 1907, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 07:23:54'),
(720, 1898, NULL, 'update', 'present', '1', '0', '2025-09-13 07:23:54'),
(721, 1907, NULL, 'update', 'present', '0', '1', '2025-09-13 07:24:38'),
(722, 1898, NULL, 'update', 'present', '0', '1', '2025-09-13 07:24:45'),
(723, 1898, NULL, 'update', 'present', '1', '0', '2025-09-13 07:24:53'),
(724, 1908, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 07:25:08'),
(725, 1909, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 07:25:08'),
(726, 1911, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-13 07:25:19'),
(727, 1903, NULL, 'update', 'present', '1', '0', '2025-09-13 07:25:27'),
(728, 1904, NULL, 'update', 'present', '0', '1', '2025-09-13 07:25:41'),
(729, 1896, NULL, 'update', 'present', '0', '1', '2025-09-13 07:25:56'),
(730, 1904, NULL, 'update', 'present', '1', '0', '2025-09-13 07:27:02'),
(731, 1904, NULL, 'update', 'present', '0', '1', '2025-09-13 07:27:09'),
(732, 1898, NULL, 'update', 'present', '0', '1', '2025-09-13 07:43:12'),
(733, 1909, NULL, 'update', 'present', '0', '1', '2025-09-13 07:43:25'),
(734, 1909, NULL, 'update', 'present', '1', '0', '2025-09-13 07:43:32'),
(735, 1904, NULL, 'update', 'present', '1', '0', '2025-09-13 07:43:32'),
(736, 1897, NULL, 'update', 'present', '1', '0', '2025-09-13 07:43:45'),
(737, 1897, NULL, 'update', 'present', '0', '1', '2025-09-13 07:56:55'),
(738, 1904, NULL, 'update', 'present', '0', '1', '2025-09-13 08:04:52'),
(739, 1909, NULL, 'update', 'present', '0', '1', '2025-09-13 08:05:45'),
(740, 1909, NULL, 'update', 'present', '1', '0', '2025-09-13 08:28:08'),
(741, 1904, NULL, 'update', 'present', '1', '0', '2025-09-13 08:28:16'),
(742, 1897, NULL, 'update', 'present', '1', '0', '2025-09-13 08:28:29'),
(743, 1897, NULL, 'update', 'present', '0', '1', '2025-09-13 08:31:12'),
(744, 1904, NULL, 'update', 'present', '0', '1', '2025-09-13 08:37:25'),
(745, 1904, NULL, 'update', 'present', '1', '0', '2025-09-13 08:45:10'),
(746, 1897, NULL, 'update', 'present', '1', '0', '2025-09-13 08:56:32'),
(747, 1897, NULL, 'update', 'present', '0', '1', '2025-09-13 08:56:39'),
(748, 1897, NULL, 'update', 'present', '1', '0', '2025-09-13 08:56:59'),
(749, 1897, NULL, 'update', 'present', '0', '1', '2025-09-13 09:00:11'),
(750, 1897, NULL, 'update', 'present', '1', '0', '2025-09-13 09:04:53'),
(751, 1897, NULL, 'update', 'present', '0', '1', '2025-09-13 09:05:00'),
(752, 1897, NULL, 'update', 'present', '1', '0', '2025-09-13 09:05:21'),
(753, 1913, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(754, 1914, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(755, 1897, NULL, 'update', 'present', '0', '1', '2025-09-13 09:10:04'),
(756, 1897, NULL, 'update', 'ot_end', '12:00:00', '20:15:00', '2025-09-13 09:10:04'),
(757, 1897, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(758, 1899, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(759, 1900, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(760, 1908, NULL, 'update', 'present', '0', '1', '2025-09-13 09:10:04'),
(761, 1908, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 09:10:04'),
(762, 1908, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 09:10:04'),
(763, 1908, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(764, 1908, NULL, 'update', 'ot_result', NULL, '1', '2025-09-13 09:10:04'),
(765, 1915, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(766, 1916, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(767, 1917, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(768, 1907, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 09:10:04'),
(769, 1907, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 09:10:04'),
(770, 1907, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(771, 1907, NULL, 'update', 'ot_result', NULL, '0', '2025-09-13 09:10:04'),
(772, 1911, NULL, 'update', 'present', '0', '1', '2025-09-13 09:10:04'),
(773, 1911, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 09:10:04'),
(774, 1911, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 09:10:04'),
(775, 1911, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(776, 1911, NULL, 'update', 'ot_result', NULL, '1', '2025-09-13 09:10:04'),
(777, 1918, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(778, 1909, NULL, 'update', 'present', '0', '1', '2025-09-13 09:10:04'),
(779, 1909, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 09:10:04'),
(780, 1909, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 09:10:04'),
(781, 1909, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(782, 1909, NULL, 'update', 'ot_result', NULL, '1', '2025-09-13 09:10:04'),
(783, 1898, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 09:10:04'),
(784, 1898, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 09:10:04'),
(785, 1898, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(786, 1898, NULL, 'update', 'ot_result', NULL, '1', '2025-09-13 09:10:04'),
(787, 1896, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 09:10:04'),
(788, 1896, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 09:10:04'),
(789, 1896, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(790, 1896, NULL, 'update', 'ot_result', NULL, '1', '2025-09-13 09:10:04'),
(791, 1901, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(792, 1902, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(793, 1903, NULL, 'update', 'present', '0', '1', '2025-09-13 09:10:04'),
(794, 1903, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(795, 1904, NULL, 'update', 'present', '0', '1', '2025-09-13 09:10:04'),
(796, 1904, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-13 09:10:04'),
(797, 1904, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-13 09:10:04'),
(798, 1904, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-13 09:10:04'),
(799, 1904, NULL, 'update', 'ot_result', NULL, '1', '2025-09-13 09:10:04'),
(800, 1919, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(801, 1920, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-13 09:10:04'),
(802, 1921, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 04:58:28'),
(803, 1922, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 05:38:33'),
(804, 1923, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 05:38:33'),
(805, 1925, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 05:38:50'),
(806, 1921, NULL, 'update', 'present', '0', '1', '2025-09-15 05:38:50'),
(807, 1921, NULL, 'update', 'present', '1', '0', '2025-09-15 05:38:58'),
(808, 1926, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 07:20:22'),
(809, 1927, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 07:20:22'),
(810, 1928, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 07:20:45'),
(811, 1929, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 07:20:45'),
(815, 1928, NULL, 'update', 'present', '1', '0', '2025-09-15 07:21:27'),
(816, 1930, NULL, 'create', NULL, NULL, 'present=0;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 07:21:27'),
(817, 1931, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 07:27:23'),
(818, 1932, NULL, 'create', NULL, NULL, 'present=0;ot_start=;ot_end=', '2025-09-15 07:27:23'),
(819, 1930, NULL, 'update', 'present', '0', '1', '2025-09-15 08:16:32'),
(820, 1928, NULL, 'update', 'present', '0', '1', '2025-09-15 08:16:48'),
(821, 1931, NULL, 'update', 'present', '0', '1', '2025-09-15 08:16:48'),
(822, 1926, NULL, 'update', 'present', '0', '1', '2025-09-15 08:16:48'),
(823, 1932, NULL, 'update', 'present', '0', '1', '2025-09-15 08:16:48'),
(824, 1927, NULL, 'update', 'present', '0', '1', '2025-09-15 08:16:48'),
(825, 1930, NULL, 'update', 'ot_result', '1', '0', '2025-09-15 09:27:01'),
(826, 1926, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:30:44'),
(827, 1926, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:30:44'),
(828, 1926, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:30:44'),
(829, 1926, NULL, 'update', 'present', '1', '0', '2025-09-15 09:30:53'),
(830, 1927, NULL, 'update', 'present', '1', '0', '2025-09-15 09:30:53'),
(831, 1929, NULL, 'update', 'present', '1', '0', '2025-09-15 09:30:53'),
(832, 1929, NULL, 'update', 'present', '0', '1', '2025-09-15 09:38:00'),
(833, 1929, NULL, 'update', 'ot_start', '18:00:00', NULL, '2025-09-15 09:38:00'),
(834, 1929, NULL, 'update', 'ot_end', '20:15:00', NULL, '2025-09-15 09:38:00'),
(835, 1929, NULL, 'update', 'ot_task', 'สรุปยอด', NULL, '2025-09-15 09:38:00'),
(836, 1929, NULL, 'update', 'ot_result', '1', NULL, '2025-09-15 09:38:00'),
(837, 1926, NULL, 'update', 'present', '0', '1', '2025-09-15 09:38:12'),
(838, 1926, NULL, 'update', 'ot_start', '18:00:00', NULL, '2025-09-15 09:38:12'),
(839, 1926, NULL, 'update', 'ot_end', '20:15:00', NULL, '2025-09-15 09:38:12'),
(840, 1926, NULL, 'update', 'ot_result', '1', '0', '2025-09-15 09:38:12'),
(841, 1925, NULL, 'update', 'present', '0', '1', '2025-09-15 09:44:36'),
(842, 1925, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(843, 1925, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(844, 1925, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(845, 1925, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(846, 1936, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(847, 1938, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(848, 1922, NULL, 'update', 'present', '0', '1', '2025-09-15 09:44:36'),
(849, 1922, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(850, 1922, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(851, 1922, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(852, 1922, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(853, 1931, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(854, 1931, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(855, 1931, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(856, 1931, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(857, 1941, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(858, 1942, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(859, 1921, NULL, 'update', 'present', '0', '1', '2025-09-15 09:44:36'),
(860, 1921, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(861, 1921, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(862, 1921, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(863, 1921, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(864, 1926, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(865, 1926, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(866, 1926, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(867, 1926, NULL, 'update', 'ot_result', '0', '1', '2025-09-15 09:44:36'),
(868, 1945, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(869, 1946, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(870, 1932, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(871, 1932, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(872, 1932, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(873, 1932, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(874, 1927, NULL, 'update', 'present', '0', '1', '2025-09-15 09:44:36'),
(875, 1927, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(876, 1927, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(877, 1927, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(878, 1927, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(879, 1929, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(880, 1929, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(881, 1929, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(882, 1929, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(883, 1950, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(884, 1951, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(885, 1952, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(886, 1930, NULL, 'update', 'ot_result', '0', '1', '2025-09-15 09:44:36'),
(887, 1923, NULL, 'update', 'present', '0', '1', '2025-09-15 09:44:36'),
(888, 1923, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:44:36'),
(889, 1923, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:44:36'),
(890, 1923, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:44:36'),
(891, 1923, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:44:36'),
(892, 1955, NULL, 'create', NULL, NULL, 'present=1;ot_start=18:00:00;ot_end=20:15:00', '2025-09-15 09:44:36'),
(893, 1926, NULL, 'update', 'ot_start', '18:00:00', NULL, '2025-09-15 09:44:50'),
(894, 1926, NULL, 'update', 'ot_end', '20:15:00', NULL, '2025-09-15 09:44:50'),
(895, 1926, NULL, 'update', 'ot_task', 'สรุปยอด', NULL, '2025-09-15 09:44:50'),
(896, 1926, NULL, 'update', 'ot_result', '1', NULL, '2025-09-15 09:44:50'),
(897, 1926, NULL, 'update', 'notes', NULL, 'ลาๆ', '2025-09-15 09:44:50'),
(898, 1927, NULL, 'update', 'ot_start', '18:00:00', NULL, '2025-09-15 09:45:02'),
(899, 1927, NULL, 'update', 'ot_end', '20:15:00', NULL, '2025-09-15 09:45:02'),
(900, 1927, NULL, 'update', 'ot_task', 'สรุปยอด', NULL, '2025-09-15 09:45:02'),
(901, 1927, NULL, 'update', 'ot_result', '1', NULL, '2025-09-15 09:45:02'),
(902, 1927, NULL, 'update', 'notes', NULL, 'ลาๆ', '2025-09-15 09:45:02'),
(903, 1929, NULL, 'update', 'notes', NULL, 'ลาๆ', '2025-09-15 09:45:16'),
(904, 1926, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:46:09'),
(905, 1926, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:46:09'),
(906, 1926, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:46:09'),
(907, 1926, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:46:09'),
(908, 1927, NULL, 'update', 'ot_start', NULL, '18:00:00', '2025-09-15 09:46:09'),
(909, 1927, NULL, 'update', 'ot_end', NULL, '20:15:00', '2025-09-15 09:46:09'),
(910, 1927, NULL, 'update', 'ot_task', NULL, 'สรุปยอด', '2025-09-15 09:46:09'),
(911, 1927, NULL, 'update', 'ot_result', NULL, '1', '2025-09-15 09:46:09');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `id` int(11) NOT NULL,
  `day_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `present` tinyint(1) NOT NULL DEFAULT 1,
  `clock_in` time NOT NULL DEFAULT '08:00:00',
  `clock_out` time NOT NULL DEFAULT '17:00:00',
  `ot_start` time DEFAULT NULL,
  `ot_end` time DEFAULT NULL,
  `ot_task` varchar(255) DEFAULT NULL,
  `product_count` int(11) DEFAULT NULL,
  `ot_result` int(1) DEFAULT NULL,
  `ot_approver_id` int(11) DEFAULT NULL,
  `ot_minutes` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_records`
--

INSERT INTO `attendance_records` (`id`, `day_id`, `user_id`, `present`, `clock_in`, `clock_out`, `ot_start`, `ot_end`, `ot_task`, `product_count`, `ot_result`, `ot_approver_id`, `ot_minutes`, `notes`, `created_at`, `updated_at`) VALUES
(1847, 26, 10, 0, '08:00:00', '17:00:00', '12:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 06:40:17', '2025-09-12 07:43:44'),
(1848, 27, 10, 0, '08:00:00', '17:00:00', '12:00:00', '12:00:00', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:08:33', '2025-09-12 07:44:07'),
(1849, 28, 12, 0, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:08:46', '2025-09-12 07:08:46'),
(1856, 26, 3, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1857, 26, 4, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1858, 26, 7, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1859, 26, 12, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1860, 26, 13, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1861, 26, 15, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1862, 26, 16, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1863, 26, 17, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1864, 26, 21, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:44', '2025-09-12 07:43:44'),
(1865, 27, 3, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1866, 27, 4, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1867, 27, 7, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1868, 27, 12, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1869, 27, 13, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1870, 27, 15, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1871, 27, 16, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1872, 27, 17, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1873, 27, 21, 1, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 07:43:57', '2025-09-12 07:43:57'),
(1874, 29, 10, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 07:49:51', '2025-09-12 11:13:03'),
(1875, 29, 12, 0, '08:00:00', '17:00:00', '12:00:00', '12:00:00', NULL, NULL, NULL, NULL, 15, 'ลาป่วย', '2025-09-12 07:49:56', '2025-09-13 04:00:41'),
(1876, 29, 16, 1, '08:00:00', '17:00:00', '18:00:00', '12:00:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 07:50:01', '2025-09-13 04:00:37'),
(1877, 29, 17, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 07:50:08', '2025-09-12 11:13:04'),
(1878, 29, 4, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 07:50:24', '2025-09-12 11:13:03'),
(1879, 29, 15, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 08:02:56', '2025-09-12 08:02:56'),
(1880, 29, 21, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 08:02:56', '2025-09-12 08:02:56'),
(1881, 30, 4, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 10, 1, NULL, 15, NULL, '2025-09-12 10:08:30', '2025-09-12 10:12:27'),
(1882, 30, 5, 0, '09:00:00', '18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ลาช่วงเช้า', '2025-09-12 10:08:30', '2025-09-12 10:14:22'),
(1883, 30, 6, 1, '09:00:00', '18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 10:08:30', '2025-09-12 10:08:30'),
(1884, 30, 18, 1, '09:00:00', '18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 10:08:30', '2025-09-12 10:08:30'),
(1885, 30, 19, 1, '13:00:00', '18:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-12 10:08:30', '2025-09-12 10:14:22'),
(1886, 30, 20, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 10, 1, NULL, 15, NULL, '2025-09-12 10:08:30', '2025-09-12 10:12:27'),
(1887, 30, 21, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 10, 1, NULL, 15, NULL, '2025-09-12 10:08:30', '2025-09-12 10:12:27'),
(1888, 29, 3, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 11:13:03', '2025-09-12 11:13:03'),
(1889, 29, 7, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 11:13:03', '2025-09-12 11:13:03'),
(1890, 29, 13, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 11:13:03', '2025-09-12 11:13:03'),
(1891, 29, 20, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 200, 1, NULL, 15, NULL, '2025-09-12 11:13:04', '2025-09-12 11:13:04'),
(1892, 29, 2, 0, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ลาป่วย', '2025-09-12 11:13:53', '2025-09-12 11:13:53'),
(1893, 29, 9, 0, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ลาป่วย', '2025-09-12 11:13:53', '2025-09-12 11:13:53'),
(1894, 29, 18, 0, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ลาป่วย', '2025-09-12 11:13:53', '2025-09-12 11:13:53'),
(1895, 29, 23, 0, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ลาป่วย', '2025-09-12 11:13:53', '2025-09-12 11:13:53'),
(1896, 31, 17, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 03:52:32', '2025-09-13 09:10:04'),
(1897, 31, 4, 1, '10:30:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 03:59:34', '2025-09-13 09:10:04'),
(1898, 31, 16, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 04:28:31', '2025-09-13 09:10:04'),
(1899, 31, 5, 1, '10:30:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 04:31:53', '2025-09-13 09:10:04'),
(1900, 31, 6, 1, '10:30:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 04:31:53', '2025-09-13 09:10:04'),
(1901, 31, 18, 1, '10:30:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 04:31:53', '2025-09-13 09:10:04'),
(1902, 31, 19, 1, '10:30:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 04:31:53', '2025-09-13 09:10:04'),
(1903, 31, 20, 1, '10:30:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 04:31:53', '2025-09-13 09:10:04'),
(1904, 31, 21, 1, '10:30:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, 'ลาป่วย', '2025-09-13 04:31:53', '2025-09-13 09:10:04'),
(1905, 32, 10, 0, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-13 04:46:15', '2025-09-13 04:46:15'),
(1906, 32, 12, 0, '08:00:00', '17:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-13 04:47:03', '2025-09-13 04:47:03'),
(1907, 31, 12, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 0, NULL, 15, NULL, '2025-09-13 07:23:54', '2025-09-13 09:10:04'),
(1908, 31, 7, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 07:25:08', '2025-09-13 09:10:04'),
(1909, 31, 15, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 07:25:08', '2025-09-13 09:10:04'),
(1911, 31, 13, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 07:25:19', '2025-09-13 09:10:04'),
(1913, 31, 1, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1914, 31, 2, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1915, 31, 8, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1916, 31, 9, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1917, 31, 11, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1918, 31, 14, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1919, 31, 22, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1920, 31, 23, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-13 09:10:04', '2025-09-13 09:10:04'),
(1921, 34, 11, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 04:58:28', '2025-09-15 09:44:36'),
(1922, 34, 6, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 05:38:33', '2025-09-15 09:44:36'),
(1923, 34, 22, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 05:38:33', '2025-09-15 09:44:36'),
(1925, 34, 1, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 05:38:50', '2025-09-15 09:44:36'),
(1926, 34, 12, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, 'ลาๆ', '2025-09-15 07:20:22', '2025-09-15 09:46:09'),
(1927, 34, 16, 1, '08:00:00', '17:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, 'ลาๆ', '2025-09-15 07:20:22', '2025-09-15 09:46:09'),
(1928, 34, 4, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 07:20:45', '2025-09-15 09:44:36'),
(1929, 34, 17, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, 'ลาๆ', '2025-09-15 07:20:45', '2025-09-15 09:45:16'),
(1930, 34, 21, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 07:21:27', '2025-09-15 09:44:36'),
(1931, 34, 7, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 07:27:23', '2025-09-15 09:44:36'),
(1932, 34, 15, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 07:27:23', '2025-09-15 09:44:36'),
(1936, 34, 2, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1938, 34, 5, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1941, 34, 8, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1942, 34, 9, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1945, 34, 13, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1946, 34, 14, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1950, 34, 18, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1951, 34, 19, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1952, 34, 20, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36'),
(1955, 34, 23, 1, '09:00:00', '18:00:00', '18:00:00', '20:15:00', 'สรุปยอด', 100, 1, NULL, 15, NULL, '2025-09-15 09:44:36', '2025-09-15 09:44:36');

--
-- Triggers `attendance_records`
--
DELIMITER $$
CREATE TRIGGER `trg_att_after_delete` AFTER DELETE ON `attendance_records` FOR EACH ROW BEGIN
  INSERT INTO attendance_history (record_id, user_id, action, changed_field, old_value, new_value)
  VALUES (OLD.id, @current_user_id, 'delete', NULL,
          CONCAT('present=',OLD.present,';ot_start=',IFNULL(OLD.ot_start,''),';ot_end=',IFNULL(OLD.ot_end,'')), NULL);
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_att_after_insert` AFTER INSERT ON `attendance_records` FOR EACH ROW BEGIN
  INSERT INTO attendance_history(record_id, user_id, action, changed_field, old_value, new_value)
  VALUES (NEW.id, @current_user_id, 'create', NULL, NULL,
          CONCAT('present=',NEW.present,';ot_start=',IFNULL(NEW.ot_start,''),';ot_end=',IFNULL(NEW.ot_end,'')));
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_att_after_update` AFTER UPDATE ON `attendance_records` FOR EACH ROW BEGIN
  IF NOT (OLD.present <=> NEW.present) THEN
    INSERT INTO attendance_history (record_id,user_id,action,changed_field,old_value,new_value)
    VALUES (OLD.id, @current_user_id, 'update','present',OLD.present,NEW.present);
  END IF;
  IF NOT (OLD.ot_start <=> NEW.ot_start) THEN
    INSERT INTO attendance_history (record_id,user_id,action,changed_field,old_value,new_value)
    VALUES (OLD.id, @current_user_id, 'update','ot_start',OLD.ot_start,NEW.ot_start);
  END IF;
  IF NOT (OLD.ot_end <=> NEW.ot_end) THEN
    INSERT INTO attendance_history (record_id,user_id,action,changed_field,old_value,new_value)
    VALUES (OLD.id, @current_user_id, 'update','ot_end',OLD.ot_end,NEW.ot_end);
  END IF;
  IF NOT (OLD.ot_task <=> NEW.ot_task) THEN
    INSERT INTO attendance_history (record_id,user_id,action,changed_field,old_value,new_value)
    VALUES (OLD.id, @current_user_id, 'update','ot_task',OLD.ot_task,NEW.ot_task);
  END IF;
  IF NOT (OLD.ot_result <=> NEW.ot_result) THEN
    INSERT INTO attendance_history (record_id,user_id,action,changed_field,old_value,new_value)
    VALUES (OLD.id, @current_user_id, 'update','ot_result',OLD.ot_result,NEW.ot_result);
  END IF;
  IF NOT (OLD.ot_approver_id <=> NEW.ot_approver_id) THEN
    INSERT INTO attendance_history (record_id,user_id,action,changed_field,old_value,new_value)
    VALUES (OLD.id, @current_user_id, 'update','ot_approver_id',OLD.ot_approver_id,NEW.ot_approver_id);
  END IF;
  IF NOT (OLD.notes <=> NEW.notes) THEN
    INSERT INTO attendance_history (record_id,user_id,action,changed_field,old_value,new_value)
    VALUES (OLD.id, @current_user_id, 'update','notes',OLD.notes,NEW.notes);
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `manager_user_id` int(11) DEFAULT NULL,
  `department_view` varchar(255) NOT NULL DEFAULT '0',
  `can_edit` tinyint(1) NOT NULL DEFAULT 0,
  `can_view_history` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `manager_user_id`, `department_view`, `can_edit`, `can_view_history`, `created_at`) VALUES
(1, 'Sales', 3, '1', 0, 0, '2025-09-02 03:49:52'),
(2, 'IT', 6, '1,2', 1, 0, '2025-09-02 03:49:52'),
(3, 'HR', 9, '0', 1, 1, '2025-09-02 03:49:52');

-- --------------------------------------------------------

--
-- Table structure for table `report_ot_summary`
--

CREATE TABLE `report_ot_summary` (
  `id` int(11) NOT NULL,
  `month` int(2) NOT NULL,
  `year` int(4) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_ot_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_work_hours_summary`
--

CREATE TABLE `report_work_hours_summary` (
  `id` int(11) NOT NULL,
  `att_date` date NOT NULL,
  `total_hours` decimal(5,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `employee_code` varchar(30) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `department_id` int(11) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `is_manager` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `join_date` date DEFAULT NULL,
  `leave_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `employee_code`, `first_name`, `last_name`, `department_id`, `position`, `email`, `is_manager`, `created_at`, `join_date`, `leave_date`) VALUES
(1, 'S001', 'สมชาย', 'ขายดี', 1, 'Sales Executive', 'somchai@company.local', 0, '2025-09-02 03:50:05', '2019-04-01', NULL),
(2, 'S002', 'อรทัย', 'รุ่งโรจน์', 1, 'Sales Executive', 'ornthai@company.local', 0, '2025-09-02 03:50:05', '2019-04-15', NULL),
(3, 'S003', 'ปรีชา', 'เจริญ', 1, 'Sales Manager', 'precha@company.local', 1, '2025-09-02 03:50:05', '2018-06-01', '2024-05-30'),
(4, 'I001', 'ชุติ', 'ไอที', 2, 'IT Support', 'chuti@company.local', 0, '2025-09-02 03:50:05', '2020-02-10', NULL),
(5, 'I002', 'มนัส', 'ระบบ', 2, 'System Engineer', 'manat@company.local', 0, '2025-09-02 03:50:05', '2020-03-05', NULL),
(6, 'I003', 'วริศ', 'ไอที', 2, 'IT Manager', 'warit@company.local', 1, '2025-09-02 03:50:05', '2018-11-01', NULL),
(7, 'H001', 'นันทา', 'บุคลากร', 3, 'HR Officer', 'nanta@company.local', 0, '2025-09-02 03:50:05', '2021-07-01', NULL),
(8, 'H002', 'สมฤทัย', 'สวัสดิ์', 3, 'Recruiter', 'somruthai@company.local', 0, '2025-09-02 03:50:05', '2021-08-01', NULL),
(9, 'H003', 'เกษรา', 'HR', 3, 'HR Manager', 'kasira@company.local', 1, '2025-09-02 03:50:05', '2025-09-09', NULL),
(10, 'ADM1', 'ADMIN', 'Boss', 1, 'Director', 'boss@company.local', 1, '2025-09-02 03:50:05', '2016-01-01', '2025-09-10'),
(11, 'F001', 'วราพร', 'การเงิน', 3, 'Accountant', 'waraporn@company.local', 0, '2025-09-02 03:50:05', '2019-05-20', NULL),
(12, 'F002', 'กนก', 'สมบัติ', 3, 'Finance Officer', 'kanok@company.local', 0, '2025-09-02 03:50:05', '2019-06-15', NULL),
(13, 'F003', 'ประสิทธิ์', 'คำนวณ', 3, 'Finance Manager', 'prasit@company.local', 1, '2025-09-02 03:50:05', '2015-10-01', NULL),
(14, 'S004', 'สุภาพร', 'ยอดขาย', 1, 'Sales Executive', 'supaporn@company.local', 0, '2025-09-02 03:50:05', '2022-01-02', NULL),
(15, 'S005', 'ธีรพล', 'ลูกค้า', 1, 'Sales Executive', 'teerapon@company.local', 0, '2025-09-02 03:50:05', '2022-03-10', NULL),
(16, 'S006', 'จันทร์เพ็ญ', 'ทองดี', 1, 'Sales Coordinator', 'janpen@company.local', 0, '2025-09-02 03:50:05', '2022-04-01', NULL),
(17, 'S007', 'ชาญชัย', 'ค้าขาย', 1, 'Key Account Manager', 'chanchai@company.local', 1, '2025-09-02 03:50:05', '2014-12-15', NULL),
(18, 'I004', 'อาทิตย์', 'ดิจิทัล', 2, 'Programmer', 'arthit@company.local', 0, '2025-09-02 03:50:05', '2020-09-01', NULL),
(19, 'I005', 'สุริยา', 'พัฒนา', 2, 'System Analyst', 'suriya@company.local', 0, '2025-09-02 03:50:05', '2020-10-01', NULL),
(20, 'I006', 'พรชัย', 'โค้ดดิ้ง', 2, 'Software Tester', 'pornchai@company.local', 0, '2025-09-02 03:50:05', '2021-01-10', NULL),
(21, 'I007', 'ณัฐพล', 'ดีไซน์', 2, 'UI/UX Designer', 'natthapon@company.local', 0, '2025-09-02 03:50:05', '2021-02-20', NULL),
(22, 'H003', 'ศศิธร', 'บุคคล', 3, 'HR Officer', 'sasitorn@company.local', 0, '2025-09-02 03:50:05', '2023-02-01', NULL),
(23, 'H004', 'เกียรติศักดิ์', 'สรรหา', 3, 'Recruitment Specialist', 'kiattisak@company.local', 0, '2025-09-02 03:50:05', '2023-03-01', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance_days`
--
ALTER TABLE `attendance_days`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_date` (`att_date`);

--
-- Indexes for table `attendance_history`
--
ALTER TABLE `attendance_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `record_id` (`record_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_history_created_at` (`created_at`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_day_user` (`day_id`,`user_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_attendance_day` (`day_id`),
  ADD KEY `idx_clock_in` (`clock_in`),
  ADD KEY `idx_clock_out` (`clock_out`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_departments_manager` (`manager_user_id`);

--
-- Indexes for table `report_ot_summary`
--
ALTER TABLE `report_ot_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `report_work_hours_summary`
--
ALTER TABLE `report_work_hours_summary`
  ADD PRIMARY KEY (`id`),
  ADD KEY `att_date` (`att_date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `idx_users_name` (`first_name`,`last_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance_days`
--
ALTER TABLE `attendance_days`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `attendance_history`
--
ALTER TABLE `attendance_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=912;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1958;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `report_ot_summary`
--
ALTER TABLE `report_ot_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_work_hours_summary`
--
ALTER TABLE `report_work_hours_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_history`
--
ALTER TABLE `attendance_history`
  ADD CONSTRAINT `fk_history_record` FOREIGN KEY (`record_id`) REFERENCES `attendance_records` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_history_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `attendance_records_ibfk_1` FOREIGN KEY (`day_id`) REFERENCES `attendance_days` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_records_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `departments`
--
ALTER TABLE `departments`
  ADD CONSTRAINT `fk_departments_manager` FOREIGN KEY (`manager_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;