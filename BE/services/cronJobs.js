const { checkUpcomingSchedules, checkLowStock } = require("../services/pushNotificationService");

let scheduleIntervalId = null;
let lowStockIntervalId = null;

/**
 * Khởi động các cron jobs cho push notification
 */
const startCronJobs = () => {
  console.log("⏰ Khởi động cron jobs cho push notification...");

  // Mỗi phút: kiểm tra schedules sắp đến
  scheduleIntervalId = setInterval(checkUpcomingSchedules, 60 * 1000);
  console.log("   ✅ Schedule reminder: mỗi 1 phút");

  // Mỗi giờ: kiểm tra thuốc sắp hết
  lowStockIntervalId = setInterval(checkLowStock, 60 * 60 * 1000);
  console.log("   ✅ Low stock check: mỗi 1 giờ");

  // Chạy ngay lần đầu sau 10 giây (đợi DB kết nối)
  setTimeout(() => {
    checkUpcomingSchedules();
    checkLowStock();
  }, 10000);
};

/**
 * Dừng các cron jobs
 */
const stopCronJobs = () => {
  if (scheduleIntervalId) clearInterval(scheduleIntervalId);
  if (lowStockIntervalId) clearInterval(lowStockIntervalId);
  console.log("⏹️ Đã dừng cron jobs");
};

module.exports = { startCronJobs, stopCronJobs };
