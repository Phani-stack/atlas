"""Sandboxed Python code execution runner for coding challenges and test assertion validation."""
import json
import subprocess
import sys
from typing import Any


def execute_python_function(
    code: str,
    fn: str,
    args_list: list[list[Any]],
    timeout: int = 8,
) -> tuple[list[dict[str, Any]] | None, str | None]:
    """Runs `fn(*args)` for each argument set in a subprocess. Returns (results, error)."""
    harness = (
        "import json, sys\n"
        "def _d(o):\n    return o.tolist() if hasattr(o, 'tolist') else repr(o)\n"
        "ns = {'__name__': '__answer__'}\n"
        f"exec(compile({code!r}, '<answer>', 'exec'), ns)\n"
        f"f = ns.get({fn!r})\n"
        f"if f is None: sys.exit({('Function ' + fn + ' is not defined')!r})\n"
        "out = []\n"
        "for a in json.loads(sys.stdin.read()):\n"
        "    try: out.append({'ok': True, 'v': f(*a)})\n"
        "    except Exception as e: out.append({'ok': False, 'e': repr(e)[:200]})\n"
        "sys.stdout.write('\\n@@RESULT@@' + json.dumps(out, default=_d))\n"
    )
    try:
        process = subprocess.run(
            [sys.executable, "-c", harness],
            input=json.dumps(args_list),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return None, f"Time limit exceeded ({timeout}s)"

    if "@@RESULT@@" not in process.stdout:
        err = (process.stderr or "").strip().splitlines()
        return None, (err[-1] if err else "no output")[:300]

    return json.loads(process.stdout.rsplit("@@RESULT@@", 1)[1]), None


def values_are_equal(a: Any, b: Any) -> bool:
    """Tolerant equality comparison supporting floating points, sequences, and mappings."""
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool) and not isinstance(b, bool):
        return abs(a - b) <= 1e-6 + 1e-6 * abs(b)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(values_are_equal(x, y) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        return a.keys() == b.keys() and all(values_are_equal(a[k], b[k]) for k in a)
    return a == b
