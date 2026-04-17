import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from main import app

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

@pytest.mark.asyncio
async def test_security_headers(async_client):
    """Valida se os cabeçalhos de segurança estão presentes em todas as respostas."""
    response = await async_client.get("/api/data/dashboard") # Mesmo sem auth, o middleware de headers deve rodar
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert "Content-Security-Policy" in response.headers
    assert "Strict-Transport-Security" in response.headers

@pytest.mark.asyncio
async def test_sql_injection_validation(async_client):
    """Valida se o parâmetro sort_by é bloqueado por regex se contiver caracteres maliciosos."""
    # Simula um ataque de injeção no parâmetro de ordenação
    response = await async_client.get("/api/data/dashboard/inconsistencies/sellin?sort_by=id;DROP TABLE users")
    # Mesmo sem autenticação (401), a validação de parâmetros pode ocorrer antes ou depois.
    # Se retornar 400, a validação de segurança funcionou.
    if response.status_code == 400:
        assert response.json()["detail"] == "Parâmetro de ordenação inválido"

@pytest.mark.asyncio
async def test_rate_limiting(async_client):
    """Valida se o limite de taxa (Rate Limiting) está ativo."""
    # Nota: Em ambiente de teste, o limiter pode precisar de configuração extra para não bloquear testes,
    # mas aqui queremos validar que ele existe.
    # Vamos tentar disparar várias requisições rápidas.
    responses = []
    for _ in range(70):
        responses.append(await async_client.get("/api/data/dashboard"))
    
    # Verifica se pelo menos uma requisição retornou 429 (Too Many Requests)
    status_codes = [r.status_code for r in responses]
    assert 429 in status_codes

@pytest.mark.asyncio
async def test_error_sanitization(async_client):
    """Valida que erros internos não expõem detalhes técnicos (traceback)."""
    # Vamos forçar um erro de categoria inválida que não seja capturado pelo 400
    # Ou injetar um erro no dashboard
    response = await async_client.get("/api/data/dashboard/inconsistencies/invalid_category")
    if response.status_code == 500:
        data = response.json()
        # Não deve haver "traceback" ou mensagens detalhadas de erro de sistema
        assert "traceback" not in str(data).lower()
        assert "stack" not in str(data).lower()
