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

def apply_excel_premium_style(writer, sheet_name):
    """
    Aplica a identidade visual Suzano Premium em uma aba do Excel aberta via pd.ExcelWriter.
    - Cabeçalho Azul Escuro (#0F172A) com texto Branco Negritado.
    - Ajuste automático de largura de colunas.
    """
    from openpyxl.styles import PatternFill, Font
    
    workbook = writer.book
    if sheet_name not in writer.sheets:
        return
        
    worksheet = writer.sheets[sheet_name]
    
    # Configuração de Cores (Identidade Suzano)
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    
    # Estiliza o cabeçalho (primeira linha)
    for cell in worksheet[1]:
        cell.fill = header_fill
        cell.font = header_font
        
    # Ajuste automático de largura de colunas (Max 50px)
    for column in worksheet.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if cell.value:
                    val_len = len(str(cell.value))
                    if val_len > max_length:
                        max_length = val_len
            except:
                pass
        adjusted_width = (max_length + 2)
        worksheet.column_dimensions[column_letter].width = min(adjusted_width, 50)
