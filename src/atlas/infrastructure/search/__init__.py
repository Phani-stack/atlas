"""Search providers and resource download infrastructure."""

from .downloader import download_file, peek_pdf, safe_filename
from .providers import (
    EXT_TYPE,
    UA,
    classify_url,
    gather_search_results,
    search_arxiv,
    search_duckduckgo,
    search_openalex,
    search_youtube,
)

__all__ = [
    "EXT_TYPE",
    "UA",
    "classify_url",
    "download_file",
    "gather_search_results",
    "peek_pdf",
    "safe_filename",
    "search_arxiv",
    "search_duckduckgo",
    "search_openalex",
    "search_youtube",
]
