import type { LeaderboardEntry, NotificationItem } from "@/types";

type QuickTask = {
  id: string;
  type: "workout" | "diet";
  title: string;
  subtitle: string;
  completed: boolean;
};

type SubmissionRow = {
  id: string;
  studentName: string;
  taskName?: string;
  taskType?: "workout" | "diet" | "checkin";
  dayNumber?: number;
  points?: number;
  timestamp: string;
  status: "pending" | "approved" | "rejected";
  mediaUrl: string;
  trainerNote?: string;
};

export type DashboardSummaryExportParams = {
  student: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    collegeId?: string;
    fitnessGoal?: string;
    currentDay: number;
    totalDays: number;
    completionPercentage: number;
    streak: number;
    totalPoints?: number;
    rank?: number;
    trainerId?: string | null;
  };
  coachName: string;
  activeTab: string;
  activePill: string;
  timeframe: string;
  progressOverview: {
    streak: number;
    totalPoints: number;
    totalCaloriesBurnedLast30Days: number;
    weeklyAvgWorkoutMinutes: number;
    totalStepsLast30Days: number;
    checkInsLast30Days: number;
    completionPercentage: number;
  } | null;
  approvedWorkoutCaloriesToday: number;
  todayApprovedCount: number;
  liveStreak: number;
  longestStreak: number;
  streakWindow: "5w" | "10w";
  streakCells: number[];
  quickTasks: QuickTask[];
  leaderboard: LeaderboardEntry[];
  notifications: NotificationItem[];
  submissions: SubmissionRow[];
  generatedAt: string;
};

const BRAND = {
  green: "C9F85A",
  cyan: "4DD2FF",
  dark: "121212",
  panel: "171717",
  panel2: "1E1E1E",
  text: "F5F5F5",
  muted: "A3A3A3",
  limeSoft: "EAFCC0",
  blueSoft: "D7F6FF",
  amberSoft: "FFE3B5",
  redSoft: "FFD5D5",
  purpleSoft: "EBDDFF",
};

const statusFill = {
  approved: "C9F85A",
  pending: "FFD18A",
  rejected: "FFB4B4",
};

const excelColor = (hex: string): string => `FF${hex.replace("#", "")}`;

const safeSheetName = (name: string): string => {
  const cleaned = name.replace(/[\\/?*\[\]:]/g, " ").trim();
  return cleaned.slice(0, 31) || "Summary";
};

const autoFitColumns = (worksheet: { columns: Array<{ width?: number; values: unknown[] }> }) => {
  worksheet.columns.forEach((column) => {
    let maxLength = 10;
    column.values.forEach((value) => {
      if (value == null) return;
      const length = String(value).length;
      if (length > maxLength) maxLength = length;
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 36);
  });
};

const setTitleRow = (sheet: any, title: string, subtitle: string) => {
  sheet.mergeCells("A1:H2");
  const titleCell = sheet.getCell("A1");
  titleCell.value = title;
  titleCell.font = { name: "Aptos", size: 22, bold: true, color: { argb: excelColor(BRAND.text) } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.dark) } };

  sheet.mergeCells("A3:H3");
  const subtitleCell = sheet.getCell("A3");
  subtitleCell.value = subtitle;
  subtitleCell.font = { name: "Aptos", size: 11, italic: true, color: { argb: excelColor(BRAND.muted) } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "left" };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.dark) } };

  sheet.getRow(1).height = 28;
  sheet.getRow(2).height = 18;
  sheet.getRow(3).height = 20;
};

const styleSectionHeader = (row: any, label: string, fillHex: string) => {
  row.values = [label];
  row.font = { name: "Aptos", size: 12, bold: true, color: { argb: excelColor("111111") } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(fillHex) } };
  row.alignment = { vertical: "middle", horizontal: "left" };
  row.height = 20;
};

const styleTableHeader = (row: any) => {
  row.eachCell((cell: any) => {
    cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: excelColor(BRAND.text) } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.panel2) } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin", color: { argb: excelColor(BRAND.panel2) } },
      left: { style: "thin", color: { argb: excelColor(BRAND.panel2) } },
      bottom: { style: "thin", color: { argb: excelColor(BRAND.panel2) } },
      right: { style: "thin", color: { argb: excelColor(BRAND.panel2) } },
    };
  });
};

const styleDataRow = (row: any, stripe = false) => {
  row.eachCell((cell: any, colNumber: number) => {
    cell.font = { name: "Aptos", size: 10, color: { argb: excelColor(BRAND.text) } };
    cell.alignment = { vertical: "middle", horizontal: colNumber === 1 ? "left" : "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: excelColor("2D2D2D") } },
      left: { style: "thin", color: { argb: excelColor("2D2D2D") } },
      bottom: { style: "thin", color: { argb: excelColor("2D2D2D") } },
      right: { style: "thin", color: { argb: excelColor("2D2D2D") } },
    };
    if (stripe) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor("1A1A1A") } };
    }
  });
};

const addKeyValueTable = (
  sheet: any,
  startRow: number,
  items: Array<[string, string | number | null | undefined]>
) => {
  let rowIndex = startRow;
  items.forEach(([label, value], idx) => {
    const row = sheet.getRow(rowIndex + idx);
    row.getCell(1).value = label;
    row.getCell(2).value = value ?? "—";
    row.getCell(1).font = { name: "Aptos", bold: true, color: { argb: excelColor(BRAND.text) } };
    row.getCell(2).font = { name: "Aptos", color: { argb: excelColor(BRAND.text) } };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.panel2) } };
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.panel) } };
    row.getCell(1).border = row.getCell(2).border = {
      top: { style: "thin", color: { argb: excelColor("2A2A2A") } },
      left: { style: "thin", color: { argb: excelColor("2A2A2A") } },
      bottom: { style: "thin", color: { argb: excelColor("2A2A2A") } },
      right: { style: "thin", color: { argb: excelColor("2A2A2A") } },
    };
  });
};

const sheetBaseStyle = (sheet: any) => {
  sheet.properties.defaultRowHeight = 20;
  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.headerFooter.oddFooter = "&LAfter-Hours Socials Dashboard Export&RPage &P of &N";
  sheet.tabColor = { argb: excelColor(BRAND.green) };
  sheet.columns = [
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
  ];
  sheet.eachRow({ includeEmpty: true }, (row: any) => {
    row.height = Math.max(row.height ?? 18, 18);
  });
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.dark) } };
  sheet.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.dark) } };
  sheet.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.dark) } };
};

export async function downloadDashboardSummaryXlsx(params: DashboardSummaryExportParams): Promise<void> {
  const excelJsModule = await import("exceljs");
  const ExcelJS = (excelJsModule as { default?: typeof excelJsModule }).default ?? excelJsModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "After-Hours Socials";
  workbook.lastModifiedBy = "After-Hours Socials";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.properties.date1904 = false;

  const overview = workbook.addWorksheet("Overview");
  sheetBaseStyle(overview);
  setTitleRow(overview, "After-Hours Socials", `Student dashboard export for ${params.student.name}`);
  overview.getCell("A5").value = "Snapshot";
  overview.getCell("A5").font = { name: "Aptos", size: 13, bold: true, color: { argb: excelColor(BRAND.dark) } };
  overview.getCell("A5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.green) } };
  addKeyValueTable(overview, 6, [
    ["Student", params.student.name],
    ["Email", params.student.email],
    ["College ID", params.student.collegeId ?? "—"],
    ["Coach", params.coachName],
    ["Current Day", `${params.student.currentDay}/${params.student.totalDays}`],
    ["Completion", `${params.student.completionPercentage}%`],
    ["Current Streak", `${params.student.streak} days`],
    ["Total Points", params.student.totalPoints ?? params.progressOverview?.totalPoints ?? 0],
    ["Rank", params.student.rank ?? "—"],
    ["Fitness Goal", params.student.fitnessGoal ?? "—"],
    ["Active Tab", params.activeTab],
    ["Filter Pill", params.activePill],
    ["Timeframe", params.timeframe],
  ]);

  const kpiStart = 22;
  overview.getCell(`A${kpiStart}`).value = "Performance KPIs";
  styleSectionHeader(overview.getRow(kpiStart), "Performance KPIs", BRAND.cyan);
  addKeyValueTable(overview, kpiStart + 1, [
    ["Workout completion", `${params.progressOverview?.completionPercentage ?? params.student.completionPercentage}%`],
    ["Calories burned (30d)", params.progressOverview?.totalCaloriesBurnedLast30Days ?? 0],
    ["Avg workout minutes", params.progressOverview?.weeklyAvgWorkoutMinutes ?? 0],
    ["Steps (30d)", params.progressOverview?.totalStepsLast30Days ?? 0],
    ["Check-ins (30d)", params.progressOverview?.checkInsLast30Days ?? 0],
    ["Approved workouts today", params.todayApprovedCount],
    ["Workout calories today", params.approvedWorkoutCaloriesToday],
    ["Live streak", `${params.liveStreak} days`],
    ["Best streak window", `${params.longestStreak} cells / ${params.streakWindow}`],
  ]);

  overview.getCell("F22").value = "Export Notes";
  overview.getCell("F22").font = { name: "Aptos", size: 13, bold: true, color: { argb: excelColor(BRAND.dark) } };
  overview.getCell("F22").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.amberSoft) } };
  overview.getCell("F23").value = "This workbook is split into pages for overview, progress, tasks, submissions, leaderboard and notifications.";
  overview.getCell("F23").alignment = { wrapText: true, vertical: "top" };
  overview.mergeCells("F23:H28");
  overview.getCell("F23").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.panel) } };
  overview.getCell("F23").font = { name: "Aptos", color: { argb: excelColor(BRAND.text) }, italic: true };

  overview.columns = [
    { width: 18 }, { width: 22 }, { width: 18 }, { width: 18 },
    { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 },
  ];

  const progress = workbook.addWorksheet("Progress");
  sheetBaseStyle(progress);
  setTitleRow(progress, "Progress Report", `Generated ${params.generatedAt} • Branded export`);
  progress.getCell("A5").value = "Streak Map";
  progress.getCell("A5").font = { name: "Aptos", bold: true, color: { argb: excelColor(BRAND.dark) } };
  progress.getCell("A5").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.cyan) } };
  progress.mergeCells("A6:H6");
  progress.getCell("A6").value = `Best running streak over the selected window: ${params.longestStreak} cells`;
  progress.getCell("A6").font = { name: "Aptos", italic: true, color: { argb: excelColor(BRAND.muted) } };
  progress.getCell("A6").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.panel) } };

  const streakHeaders = Array.from({ length: Math.min(params.streakCells.length, 14) }, (_, index) => `Day ${index + 1}`);
  progress.getRow(8).values = ["Metric", ...streakHeaders];
  styleTableHeader(progress.getRow(8));
  progress.getRow(9).values = ["Streak Cell", ...params.streakCells.slice(0, 14)];
  styleDataRow(progress.getRow(9), true);
  progress.getRow(10).values = ["Window", params.streakWindow];
  progress.getRow(10).getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.limeSoft) } };

  addKeyValueTable(progress, 12, [
    ["Completion", `${params.progressOverview?.completionPercentage ?? params.student.completionPercentage}%`],
    ["Current streak", `${params.progressOverview?.streak ?? params.student.streak} days`],
    ["Workout calories 30d", params.progressOverview?.totalCaloriesBurnedLast30Days ?? 0],
    ["Average workout minutes", params.progressOverview?.weeklyAvgWorkoutMinutes ?? 0],
    ["Steps 30d", params.progressOverview?.totalStepsLast30Days ?? 0],
    ["Check-ins 30d", params.progressOverview?.checkInsLast30Days ?? 0],
  ]);

  const tasks = workbook.addWorksheet("Tasks");
  sheetBaseStyle(tasks);
  setTitleRow(tasks, "Tasks & Daily Activity", `Active tab: ${params.activeTab} • Filter: ${params.activePill}`);
  tasks.getRow(5).values = ["Type", "Task", "Subtitle", "Completed"];
  styleTableHeader(tasks.getRow(5));
  params.quickTasks.forEach((task, index) => {
    const row = tasks.getRow(6 + index);
    row.values = [task.type, task.title, task.subtitle, task.completed ? "Yes" : "No"];
    styleDataRow(row, index % 2 === 1);
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(task.type === "workout" ? BRAND.blueSoft : BRAND.amberSoft) } };
    row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(task.completed ? BRAND.limeSoft : BRAND.redSoft) } };
  });

  const submissionsSheet = workbook.addWorksheet("Submissions");
  sheetBaseStyle(submissionsSheet);
  setTitleRow(submissionsSheet, "Submissions Ledger", "Detailed record of recent task submissions");
  submissionsSheet.getRow(5).values = ["Date", "Task", "Type", "Day", "Points", "Status", "Media", "Trainer Note"];
  styleTableHeader(submissionsSheet.getRow(5));
  params.submissions.forEach((submission, index) => {
    const row = submissionsSheet.getRow(6 + index);
    row.values = [
      submission.timestamp,
      submission.taskName ?? "—",
      submission.taskType ?? "—",
      submission.dayNumber ?? "—",
      submission.points ?? 0,
      submission.status,
      submission.mediaUrl || "—",
      submission.trainerNote ?? "—",
    ];
    styleDataRow(row, index % 2 === 1);
    const statusCell = row.getCell(6);
    const fill = submission.status === "approved" ? statusFill.approved : submission.status === "pending" ? statusFill.pending : statusFill.rejected;
    statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(fill) } };
    statusCell.font = { name: "Aptos", bold: true, color: { argb: excelColor(BRAND.dark) } };
  });

  const leaderboard = workbook.addWorksheet("Leaderboard");
  sheetBaseStyle(leaderboard);
  setTitleRow(leaderboard, "Leaderboard", "Rankings sorted by score with key performance metrics");
  leaderboard.getRow(5).values = ["Rank", "Name", "Score", "Streak", "Steps", "Uploads", "Completion %"];
  styleTableHeader(leaderboard.getRow(5));
  [...params.leaderboard].sort((a, b) => b.score - a.score).slice(0, 25).forEach((entry, index) => {
    const row = leaderboard.getRow(6 + index);
    row.values = [entry.rank ?? index + 1, entry.name, entry.score, entry.streak, entry.steps, entry.uploads, `${entry.completionPercentage}%`];
    styleDataRow(row, index % 2 === 1);
    if (index < 3) {
      row.eachCell((cell: any) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(index === 0 ? BRAND.limeSoft : index === 1 ? BRAND.blueSoft : BRAND.amberSoft) } };
        cell.font = { name: "Aptos", bold: true, color: { argb: excelColor(BRAND.dark) } };
      });
    }
  });

  const notifications = workbook.addWorksheet("Notifications");
  sheetBaseStyle(notifications);
  setTitleRow(notifications, "Notifications", "Recent alerts and updates from the app");
  notifications.getRow(5).values = ["Time", "Title", "Message", "Type", "Read"];
  styleTableHeader(notifications.getRow(5));
  [...params.notifications]
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .slice(0, 20)
    .forEach((notification, index) => {
      const row = notifications.getRow(6 + index);
      row.values = [notification.timestamp, notification.title, notification.message, notification.type, notification.read ? "Read" : "Unread"];
      styleDataRow(row, index % 2 === 1);
      row.getCell(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(notification.read ? BRAND.limeSoft : BRAND.amberSoft) } };
    });

  const cover = workbook.addWorksheet("Cover");
  sheetBaseStyle(cover);
  cover.mergeCells("A1:H4");
  cover.getCell("A1").value = `After-Hours Socials\n${params.student.name}`;
  cover.getCell("A1").font = { name: "Aptos", size: 24, bold: true, color: { argb: excelColor(BRAND.text) } };
  cover.getCell("A1").alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  cover.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.dark) } };
  cover.getCell("A6").value = `Generated ${params.generatedAt}`;
  cover.getCell("A6").font = { name: "Aptos", size: 12, italic: true, color: { argb: excelColor(BRAND.muted) } };
  cover.getCell("A7").value = "Workbook pages: Overview, Progress, Tasks, Submissions, Leaderboard, Notifications";
  cover.getCell("A7").font = { name: "Aptos", color: { argb: excelColor(BRAND.text) } };
  cover.getCell("A9").value = "Branded export";
  cover.getCell("A9").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.green) } };
  cover.getCell("A9").font = { name: "Aptos", bold: true, color: { argb: excelColor(BRAND.dark) } };
  cover.getCell("A10").value = "Detailed, page-wise data export generated from the student dashboard.";
  cover.mergeCells("A10:H12");
  cover.getCell("A10").alignment = { wrapText: true, vertical: "middle", horizontal: "left" };
  cover.getCell("A10").fill = { type: "pattern", pattern: "solid", fgColor: { argb: excelColor(BRAND.panel) } };
  cover.getCell("A10").font = { name: "Aptos", color: { argb: excelColor(BRAND.text) } };

  [overview, progress, tasks, submissionsSheet, leaderboard, notifications, cover].forEach((sheet) => autoFitColumns(sheet));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ahg-dashboard-summary-${params.student.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}