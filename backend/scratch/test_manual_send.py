
import asyncio
from core.scheduler import process_notification_job

async def test_manual_send():
    print("Iniciando envio manual de teste...")
    try:
        await process_notification_job()
        print("Finalizado com sucesso!")
    except Exception as e:
        print(f"Erro durante o envio: {e}")

if __name__ == "__main__":
    asyncio.run(test_manual_send())
