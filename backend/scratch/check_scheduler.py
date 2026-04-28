
import asyncio
from core.scheduler import scheduler
from core.database_app import AppSessionLocal as AsyncSessionLocalApp
from core.models_app import NotificationSchedule, NotificationRecipient
from sqlalchemy.future import select

async def check_scheduler():
    print(f"Scheduler running: {scheduler.running}")
    print("Jobs in scheduler:")
    for job in scheduler.get_jobs():
        print(f" - ID: {job.id}, Next Run: {job.next_run_time}, Trigger: {job.trigger}")
    
    async with AsyncSessionLocalApp() as db:
        res = await db.execute(select(NotificationSchedule))
        schedules = res.scalars().all()
        print("\nSchedules in database:")
        for s in schedules:
            print(f" - ID: {s.id}, Time: {s.time}, Active: {s.active}")
            
        res = await db.execute(select(NotificationRecipient))
        recipients = res.scalars().all()
        print("\nRecipients in database:")
        for r in recipients:
            print(f" - ID: {r.id}, Email: {r.email}, Active: {r.active}")

if __name__ == "__main__":
    asyncio.run(check_scheduler())
