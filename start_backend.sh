#!/bin/bash
cd "$(dirname "$0")/backend"
uv sync
uv run python main.py
