from datetime import datetime
import calendar

def parse_date_range(start_date: str = None, end_date: str = None):
    """
    Centraliza a lógica de tratamento de períodos de data do Dashboard.
    Retorna (start_dt, end_dt)
    """
    today = datetime.now()
    
    # Lógica para Start Date
    if not start_date or start_date == "2024-01-01":
        start_dt = datetime(today.year, today.month, 1)
    else:
        try:
            start_dt = datetime.strptime(start_date[:10], "%Y-%m-%d")
        except (ValueError, TypeError):
            start_dt = datetime(today.year, today.month, 1)
            
    # Lógica para End Date
    if not end_date or end_date == "2026-12-31":
        last_day = calendar.monthrange(today.year, today.month)[1]
        end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)
    else:
        try:
            end_dt = datetime.strptime(end_date[:10], "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        except (ValueError, TypeError):
            last_day = calendar.monthrange(today.year, today.month)[1]
            end_dt = datetime(today.year, today.month, last_day, 23, 59, 59)
            
    return start_dt, end_dt
