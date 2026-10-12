import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    let targetUserId = user.id;

    if (clientId) {
      if (user.role !== "TRAINER") {
        return NextResponse.json({ success: false, error: "Only trainers can query other users' progress" }, { status: 403 });
      }
      targetUserId = clientId;
    }

    const progressRecords = await prisma.dailyProgress.findMany({
      where: { userId: targetUserId },
      orderBy: { dateString: "asc" }
    });

    return NextResponse.json({ success: true, data: progressRecords });
  } catch (error: any) {
    console.error("Error fetching daily progress:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { dateString, isCompleted, action, routineId, dayTitle, dayDescription, trainerName, clientId } = await req.json();

    if (!dateString) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    let targetUserId = user.id;
    if (user.role === "TRAINER" && clientId) {
      targetUserId = clientId;
    }

    const effectiveTrainerName = trainerName || (user.role === "TRAINER" ? user.name : "Coach");

    if (action === "delete") {
      try {
        await prisma.dailyProgress.delete({
          where: {
            userId_dateString: {
              userId: targetUserId,
              dateString
            }
          }
        });
        return NextResponse.json({ success: true, data: null });
      } catch (err) {
        // Ignored if non-existent
        return NextResponse.json({ success: true, data: null });
      }
    }

    if (typeof isCompleted !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      console.log(`[Progress POST] Upserting for user ${targetUserId}, date ${dateString}, isCompleted ${isCompleted}`);
      const record = await tx.dailyProgress.upsert({
        where: {
          userId_dateString: {
            userId: targetUserId,
            dateString,
          }
        },
        update: { 
          isCompleted,
          routineId,
          dayTitle,
          dayDescription,
          trainerName: effectiveTrainerName
        },
        create: {
          userId: targetUserId,
          dateString,
          isCompleted,
          routineId,
          dayTitle,
          dayDescription,
          trainerName: effectiveTrainerName
        }
      });

      // Calculate Streak using all progress records
      const allProgress = await tx.dailyProgress.findMany({
        where: { userId: targetUserId },
        orderBy: { dateString: "desc" }
      });

      console.log(`[Progress POST] Global History Count: ${allProgress.length} for user ${user.id}`);

      // 1. Calculate the current active streak (working back from today/yesterday)
      let currentStreak = 0;
      const now = new Date();
      // Use local ISO date string for "today"
      const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const yesterdayDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000 - 86400000);
      const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

      const getPrevDateStr = (dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        return d.toISOString().split("T")[0];
      };

      const todayRecord = allProgress.find((p: any) => p.dateString === todayStr);
      const yesterdayRecord = allProgress.find((p: any) => p.dateString === yesterdayStr);

      let searchStr = "";
      if (todayRecord?.isCompleted) {
        searchStr = todayStr;
      } else if (!todayRecord && yesterdayRecord?.isCompleted) {
        searchStr = yesterdayStr;
      } else if (todayRecord && !todayRecord.isCompleted) {
        searchStr = "";
      }

      if (searchStr) {
        while (true) {
          const found = allProgress.find((p: any) => p.dateString === searchStr);
          if (found && found.isCompleted) {
            currentStreak++;
            searchStr = getPrevDateStr(searchStr);
          } else {
            break;
          }
        }
      }

      // 2. Scan entire history to find the absolute MAX streak ever
      const sortedHistory = [...allProgress].sort((a, b) => a.dateString.localeCompare(b.dateString));
      
      let globalMaxStreak = 0;
      let runningStreak = 0;
      let lastDateStr = "";

      for (const rec of sortedHistory) {
        if (!rec.isCompleted) {
          runningStreak = 0;
          lastDateStr = "";
          continue;
        }

        if (!lastDateStr) {
          runningStreak = 1;
        } else {
          // Use UTC for stable day difference
          const d1 = new Date(lastDateStr + "T00:00:00Z").getTime();
          const d2 = new Date(rec.dateString + "T00:00:00Z").getTime();
          const diffDays = Math.round((d2 - d1) / 86400000);
          
          if (diffDays === 1) {
            runningStreak++;
          } else {
            runningStreak = 1;
          }
        }
        
        lastDateStr = rec.dateString;
        if (runningStreak > globalMaxStreak) {
          globalMaxStreak = runningStreak;
        }
      }

      console.log(`[Progress POST] User ${targetUserId} - Current: ${currentStreak}, Calculated Global Max: ${globalMaxStreak}`);

      const dbUser = await tx.user.findUnique({ where: { id: targetUserId } });
      if (dbUser) {
        const existingHighest = dbUser.highestStreak || 0;
        // IMPORTANT: We compare with our fresh global scan
        if (globalMaxStreak > existingHighest) {
          console.log(`[Progress POST] UPDATING highestStreak: ${existingHighest} -> ${globalMaxStreak}`);
          await tx.user.update({
            where: { id: targetUserId },
            data: { highestStreak: globalMaxStreak }
          });
        } else if (globalMaxStreak < existingHighest && runningStreak === 0) {
          // Safety: If for some reason the DB has a higher value than we can find in records, 
          // we trust the DB unless we are specifically recalculating everything.
          // But here we'll keep the highest one.
        }
      }

      return { record, currentStreak };
    });

    return NextResponse.json({ success: true, data: result.record, currentStreak: result.currentStreak });
  } catch (error: any) {
    console.error("CRITICAL ERROR in Progress POST:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
