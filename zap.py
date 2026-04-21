import os
import sys
import zipfile
import fnmatch
import time
from pathlib import Path

class ZapArchiver:
    def __init__(self, source_path=".", output_name=None):
        self.source_dir = Path(source_path).resolve()
        self.output_name = output_name or f"{self.source_dir.name}_archive.zip"
        self.start_time = 0
        
        # Core Exclusion Set
        self.ignore_patterns = self._parse_gitignore()
        
        # Mandatory exclusions (security/recursion safety)
        self.ignore_patterns.update([
            '.git', '.git/**', '.gitignore', self.output_name, 
            '*.zip', 'zap.py', '.DS_Store', '__pycache__'
        ])

    def _parse_gitignore(self):
        """Reads .gitignore and cleans patterns for matching."""
        patterns = set()
        gitignore = self.source_dir / '.gitignore'
        
        if gitignore.exists():
            with open(gitignore, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    # Skip comments, empty lines, and negations (for simplicity)
                    if line and not line.startswith('#') and not line.startswith('!'):
                        # Remove trailing slashes for consistent matching
                        patterns.add(line.rstrip('/'))
        return patterns

    def matches_pattern(self, rel_path_str):
        """
        Check if a relative path matches any gitignore style patterns.
        Handles nested paths like 'backend/venv/bin/python' against 'backend/venv'
        """
        normalized_path = rel_path_str.replace('\\', '/')
        path_parts = normalized_path.split('/')

        for pattern in self.ignore_patterns:
            clean_pattern = pattern.replace('\\', '/')
            
            # 1. Direct match or wildcard match of any segment in the path
            # (e.g., 'node_modules' matches 'project/node_modules/file.js')
            for part in path_parts:
                if fnmatch.fnmatch(part, clean_pattern):
                    return True
            
            # 2. Match against the full relative path string 
            # (e.g., 'backend/venv' matches 'backend/venv/lib/...')
            if normalized_path.startswith(clean_pattern + '/') or normalized_path == clean_pattern:
                return True
            
            # 3. Standard glob match for the whole string
            if fnmatch.fnmatch(normalized_path, clean_pattern):
                return True
                
        return False

    def get_files(self):
        """Pass 1: Scan for all non-ignored files."""
        eligible = []
        for root, dirs, files in os.walk(self.source_dir):
            # Prune directories in-place to speed up walk
            rel_root = os.path.relpath(root, self.source_dir)
            if rel_root == ".":
                rel_root = ""

            # Check if current directory itself is ignored
            if rel_root and self.matches_pattern(rel_root):
                dirs[:] = [] # Stop descending
                continue

            for file in files:
                full_path = Path(root) / file
                rel_file = os.path.relpath(full_path, self.source_dir)
                
                if not self.matches_pattern(rel_file):
                    eligible.append(full_path)
                    
        return eligible

    def run(self):
        """Pass 2: Archive with progress feedback."""
        print(f"🔍 Scanning: {self.source_dir}")
        files = self.get_files()
        total = len(files)
        
        if total == 0:
            print("❌ No files found (check your gitignore or source path).")
            return

        print(f"📦 Found {total} files. Starting compression...")
        self.start_time = time.time()

        with zipfile.ZipFile(self.output_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for i, file_path in enumerate(files, 1):
                rel_path = file_path.relative_to(self.source_dir)
                
                # Progress UI Calculation
                pct = (i / total) * 100
                bar = '█' * int(pct / 5) + '░' * (20 - int(pct / 5))
                
                # Truncate filename for display
                display_name = str(rel_path)
                if len(display_name) > 35:
                    display_name = "..." + display_name[-32:]

                # Update terminal line
                sys.stdout.write(f"\r\033[K|{bar}| {pct:3.1f}% [{i}/{total}] Archiving: {display_name}")
                sys.stdout.flush()

                zipf.write(file_path, rel_path)

        duration = time.time() - self.start_time
        print(f"\n\n✨ Successfully created: {self.output_name}")
        print(f"⏱️  Time elapsed: {duration:.2f} seconds")
        print(f"📁 Size: {os.path.getsize(self.output_name) / (1024*1024):.2f} MB")

if __name__ == "__main__":
    # simple CLI handling
    src = sys.argv[1] if len(sys.argv) > 1 else "."
    out = sys.argv[2] if len(sys.argv) > 2 else None
    
    app = ZapArchiver(src, out)
    app.run()