import os
import sys
import pytest

# Add src directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
