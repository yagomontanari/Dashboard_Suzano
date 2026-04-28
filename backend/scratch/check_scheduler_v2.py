
import asyncio
from core.scheduler import scheduler, restart_scheduler
from core.database_app import AppSessionLocal as AsyncSessionLocalApp
from core.models_app import NotificationSchedule, NotificationRecipient
from sqlalchemy.future import select

async def check_scheduler():
    # Inicializa o scheduler no processo atual
    await restart_scheduler()
    
    print(f"Scheduler running: {scheduler.running}")
    print("Jobs in scheduler:")
    jobs = scheduler.get_jobs()
    if not jobs:
        print(" - No jobs found in scheduler.")
    for job in jobs:
        print(f" - ID: {job.id}, Next Run: {job.next_run_time}, Trigger: {job.trigger}")
    
    async with AsyncSessionLocalApp() as db:
        res = await db.execute(select(NotificationSchedule))
        schedules = res.scalars().all()
        print("\nSchedules in database:")
        for s in schedules:
            print(f" - ID: {s.id}, Time: {s.time}, Active: {s.active}")

if __name__ == "__main__":
    asyncio.run(check_scheduler())
