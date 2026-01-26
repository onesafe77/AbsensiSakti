#!/usr/bin/env python3
"""
Script to remove duplicate route definitions from routes.ts
Keeps the first occurrence of each route and removes duplicates.
"""

import re
import sys

def normalize_path(path):
    """Normalize route path for comparison."""
    # Fix backslashes to forward slashes
    path = path.replace('\\', '/')
    # Remove multiple slashes
    path = re.sub(r'/+', '/', path)
    return path

def extract_route_signature(line):
    """Extract route method and path for comparison."""
    # Match: app.METHOD("PATH" or `PATH` or 'PATH')
    match = re.match(r'\s*app\.(get|post|put|delete|patch)\s*\(\s*["\'\`]([^"\'\`]+)["\'\`]', line)
    if match:
        method = match.group(1)
        path = normalize_path(match.group(2))
        return f"{method}:{path}"
    return None

def deduplicate_routes(input_file, output_file):
    """Remove duplicate route definitions."""

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    seen_routes = {}  # signature -> first line number
    output_lines = []
    i = 0
    total_lines = len(lines)
    duplicates_removed = 0

    while i < total_lines:
        line = lines[i]

        # Check if this line starts a route definition
        route_sig = extract_route_signature(line)

        if route_sig:
            # This is a route definition
            if route_sig in seen_routes:
                # Duplicate found - skip this entire handler block
                print(f"Line {i+1}: Duplicate {route_sig} (first at line {seen_routes[route_sig]})")

                # Skip until we find the closing }); of this handler
                brace_count = line.count('{') - line.count('}')
                i += 1

                # Keep skipping lines until braces are balanced
                while i < total_lines:
                    current_line = lines[i]
                    brace_count += current_line.count('{') - current_line.count('}')

                    # Check if this line ends the handler
                    if brace_count <= 0 and '});' in current_line:
                        duplicates_removed += 1
                        i += 1  # Skip the closing line too
                        break
                    i += 1
                continue
            else:
                # First occurrence - keep it
                seen_routes[route_sig] = i + 1
                output_lines.append(line)
                i += 1
                continue

        # Not a route definition, keep the line
        output_lines.append(line)
        i += 1

    # Write cleaned file
    output_content = '\n'.join(output_lines)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(output_content)

    print(f"\n[OK] Analysis complete:")
    print(f"  - Found {len(seen_routes)} unique routes")
    print(f"  - Removed {duplicates_removed} duplicate route handlers")
    print(f"  - Original: {total_lines} lines")
    print(f"  - Cleaned: {len(output_lines)} lines")
    print(f"  - Reduction: {total_lines - len(output_lines)} lines ({((total_lines - len(output_lines))/total_lines*100):.1f}%)")

if __name__ == "__main__":
    input_file = "server/routes.ts"
    output_file = "server/routes.ts"

    print("Starting route deduplication...")
    print("=" * 60)
    deduplicate_routes(input_file, output_file)
    print("=" * 60)
    print("[OK] Done!")
